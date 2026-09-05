import {
  WondersoftRawRecord,
  ProcessedProductRecord,
  ValidationIssue,
  FilterState,
  ColumnMappingConfig,
  PricingRulesConfig,
  ClassificationResult,
  MainCategoryType,
  DepartmentType,
} from '../types';
import { classifyWithRules } from './ruleEngine';
import { isValidTaxonomyCombination } from '../data/categoryMaster';

export const DEFAULT_COLUMN_MAPPING: ColumnMappingConfig = {
  'Product Group': 'Department',
  Department: 'Product Name',
  Class: 'Brand',
  Colour: 'Colour',
  Size: 'Size',
  Garment: 'Fabric',
  'EAN Code': 'EAN',
  MRP: 'Selling Price',
  Stock: 'Stock Quantity',
};

export async function processWondersoftPipeline(
  rawRecords: WondersoftRawRecord[],
  columnMapping: ColumnMappingConfig = DEFAULT_COLUMN_MAPPING,
  pricingConfig?: PricingRulesConfig
): Promise<{
  processedProducts: ProcessedProductRecord[];
  validationIssues: ValidationIssue[];
  variantMap: Record<string, string>;
}> {
  const validationIssues: ValidationIssue[] = [];

  // 1. Group records by EAN (treating EAN strictly as String)
  const eanGroups: Record<
    string,
    {
      ean: string;
      rows: WondersoftRawRecord[];
      totalStock: number;
      mrpSet: Set<number>;
    }
  > = {};

  rawRecords.forEach((row, index) => {
    // Extract fields according to mapping or fallback
    let rawEan = String(row.ean || row['EAN Code'] || row['EAN'] || row.rawRow?.['EAN Code'] || row.rawRow?.['EAN'] || row.rawRow?.['Barcode'] || '').trim();
    // Strip leading/trailing single or double quotes commonly present in Excel exports (e.g. '500123...)
    rawEan = rawEan.replace(/^['"`\s]+|['"`\s]+$/g, '').trim();

    if (!rawEan && row.rawRow && typeof row.rawRow === 'object') {
      for (const [k, v] of Object.entries(row.rawRow)) {
        const kLower = k.toLowerCase();
        const strVal = String(v ?? '').trim();
        if ((kLower.includes('ean') || kLower.includes('barcode') || kLower.includes('code') || kLower.includes('upc')) && strVal) {
          rawEan = strVal;
          break;
        }
        if (!rawEan && /^\d{8,14}$/.test(strVal)) {
          rawEan = strVal;
          break;
        }
      }
    }

    if (!rawEan) {
      rawEan = `EAN_${index + 1}`;
      validationIssues.push({
        id: `val-missing-ean-${index}`,
        rowId: `Row ${index + 1}`,
        ean: rawEan,
        productInfo: `${row.productGroup || ''} - ${row.department || ''}`,
        issueType: 'WARNING',
        message: `Missing EAN Code in raw record. Generated fallback identifier ${rawEan}.`,
      });
    }

    if (!eanGroups[rawEan]) {
      eanGroups[rawEan] = {
        ean: rawEan,
        rows: [],
        totalStock: 0,
        mrpSet: new Set(),
      };
    }

    const stockNum = parseInt(String(row.stock || row['Stock'] || row.rawRow?.['Stock'] || row.rawRow?.['Qty'] || 0), 10) || 0;
    const mrpNum = parseFloat(String(row.mrp || row['MRP'] || row.rawRow?.['MRP'] || row.rawRow?.['Price'] || 0)) || 0;

    eanGroups[rawEan].rows.push(row);
    eanGroups[rawEan].totalStock += stockNum;
    if (mrpNum > 0) eanGroups[rawEan].mrpSet.add(mrpNum);
  });

  // 2. Build Variant Index to locate representative EAN for Image Mapping according to Category Size Chart
  // Rule: Check starting size -> if missing, check next available size -> if none, pick last size
  // Grouping rule: Grouped strictly by Brand + Colour + Toon Label (from WS data)
  const variantGroupItems: Record<string, { size: string; ean: string; dept: string }[]> = {};

  Object.values(eanGroups).forEach((group) => {
    const rep = group.rows[0];
    const brand = String(rep.classBrand || rep['Class'] || '').trim().toUpperCase();
    const colour = String(rep.colour || rep['Colour'] || '').trim().toUpperCase();
    const toonLabel = String(
      rep.toonLabel ||
      rep['toonLabel'] ||
      rep['Toon Label'] ||
      rep['ToonLabel'] ||
      rep['toon_label'] ||
      rep['TOON LABEL'] ||
      rep.styleNo ||
      rep['StyleNo'] ||
      rep['Style No'] ||
      'DEFAULT'
    )
      .trim()
      .toUpperCase();
    const size = String(rep.size || rep['Size'] || '').trim().toUpperCase();
    const dept = String(rep.department || rep['Department'] || rep.productGroup || '').trim();

    if (brand && colour && toonLabel) {
      const variantKey = `${brand}|${colour}|${toonLabel}`;
      if (!variantGroupItems[variantKey]) {
        variantGroupItems[variantKey] = [];
      }
      variantGroupItems[variantKey].push({ size, ean: group.ean, dept });
    }
  });

  const getSizeSequenceForDeptAndSize = (size: string, dept: string): string[] => {
    const d = dept.toLowerCase();
    const s = size.trim().toUpperCase();

    // Kids size rules: 1-2, 3-4, 5-6, 7-8 or innerwear 45, 50, 55
    if (d.includes('kid') || s === '1-2' || s === '3-4' || s === '5-6' || s === '7-8') {
      if (s === '45' || s === '50' || s === '55' || d.includes('inner')) {
        return ['45', '50', '55'];
      }
      return ['1-2', '3-4', '5-6', '7-8'];
    }

    // Boys size rules: 9-10, 11-12, 13-14, 15-16 or innerwear 60, 65, 70, 73, 75
    if (d.includes('boy') || s === '9-10' || s === '11-12' || s === '13-14' || s === '15-16') {
      if (['60', '65', '70', '73', '75'].includes(s) && (d.includes('inner') || s === '60' || s === '65')) {
        return ['60', '65', '70', '73', '75'];
      }
      return ['9-10', '11-12', '13-14', '15-16'];
    }

    // Mens Innerwear: 75, 80, 85, 90, 95, 100, 105, 110
    if (d.includes('inner') || ['75', '80', '85', '90', '95', '100', '105', '110'].includes(s)) {
      return ['75', '80', '85', '90', '95', '100', '105', '110'];
    }

    // Mens Pants: 28, 30, 32, 34, 36, 38, 40, 42, 44
    if (d.includes('pant') || ['28', '30', '32', '34'].includes(s)) {
      return ['28', '30', '32', '34', '36', '38', '40', '42', '44'];
    }

    // Mens Shirt (Casual / Formal): 36, 38, 40, 42, 44, 46, 48, 50
    if (d.includes('shirt') && !d.includes('t shirt') && !d.includes('t-shirt') && ['36', '38', '40', '42', '44', '46', '48', '50'].includes(s)) {
      return ['36', '38', '40', '42', '44', '46', '48', '50'];
    }

    // Default Letter Sizes (T-Shirts, Track pants, Shorts): S, M, L, XL, XXL, XXXL, 4XL, 5XL
    return ['S', 'M', 'L', 'XL', 'XXL', '3XL', 'XXXL', '4XL', 'XXXXL', '5XL', 'XXXXXL'];
  };

  const variantMap: Record<string, string> = {};

  Object.entries(variantGroupItems).forEach(([variantKey, items]) => {
    if (items.length === 0) return;

    const sample = items[0];
    const sequence = getSizeSequenceForDeptAndSize(sample.size, sample.dept);

    // Sort available items by index in sequence
    const sortedItems = [...items].sort((a, b) => {
      const idxA = sequence.indexOf(a.size.trim().toUpperCase());
      const idxB = sequence.indexOf(b.size.trim().toUpperCase());

      const posA = idxA !== -1 ? idxA : 999;
      const posB = idxB !== -1 ? idxB : 999;

      return posA - posB;
    });

    // 1. Check starting size (index 0 in sequence)
    // 2. If starting size missing, pick next available size (first item in sorted list)
    // 3. If no matching sequence, last available size fallback
    const bestItem = sortedItems[0] || items[items.length - 1];
    variantMap[variantKey] = bestItem.ean;
  });

  // 3. Process aggregated EAN product records & classify
  const initialProducts: ProcessedProductRecord[] = [];
  const itemsNeedingAI: { index: number; payload: any }[] = [];

  const eanEntries = Object.values(eanGroups);

  for (let i = 0; i < eanEntries.length; i++) {
    const group = eanEntries[i];
    const rep = group.rows[0];

    const brand = String(rep.classBrand || rep['Class'] || '').trim();
    const colour = String(rep.colour || rep['Colour'] || '').trim();
    const toonLabel = String(
      rep.toonLabel ||
      rep['toonLabel'] ||
      rep['Toon Label'] ||
      rep['ToonLabel'] ||
      rep['toon_label'] ||
      rep['TOON LABEL'] ||
      rep.styleNo ||
      rep['StyleNo'] ||
      rep['Style No'] ||
      'DEFAULT'
    ).trim();
    const styleNo = toonLabel;
    const size = String(rep.size || rep['Size'] || '').trim();
    const fabric = String(rep.garmentFabric || rep['Garment'] || rep['Fabric'] || '').trim();
    const productName = String(rep.productName || rep['Department'] || rep['Product Name'] || '').trim();
    const productGroup = String(rep.productGroup || rep['Product Group'] || '').trim();
    const originalDepartment = String(rep.department || rep['Department'] || '').trim();

    const sellingPrice = group.mrpSet.size > 0 ? Array.from(group.mrpSet)[0] : 0;

    // Validation checks
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!brand) errors.push('Missing Brand (Class)');
    if (!colour) errors.push('Missing Colour');
    if (!size) errors.push('Missing Size');
    if (!productGroup) errors.push('Missing Product Group');
    if (!originalDepartment) errors.push('Missing Department');
    if (!toonLabel || toonLabel === 'DEFAULT') warnings.push('Missing Toon Label; fallback image mapping used');

    if (group.mrpSet.size > 1) {
      const mrpList = Array.from(group.mrpSet).join(', ');
      warnings.push(`Conflicting MRP values across stores: ₹${mrpList}`);
      validationIssues.push({
        id: `val-mrp-conflict-${group.ean}`,
        rowId: `EAN ${group.ean}`,
        ean: group.ean,
        productInfo: `${brand} ${colour} ${productName}`,
        issueType: 'WARNING',
        message: `Conflicting MRP prices across stores for same EAN: ₹${mrpList}`,
      });
    }

    // Image Path calculation using S-size EAN (Grouped by Toon Label)
    const variantKey = `${brand.toUpperCase()}|${colour.toUpperCase()}|${toonLabel.toUpperCase()}`;
    const sSizeEan = variantMap[variantKey];

    let imagePath = '';
    if (sSizeEan) {
      imagePath = `images/${sSizeEan}.jpg`;
    } else {
      imagePath = `images/${group.ean}.jpg`;
      warnings.push(`No S-size EAN found for Toon Label variant ${variantKey}; used self EAN image path`);
      validationIssues.push({
        id: `val-img-no-s-${group.ean}`,
        rowId: `EAN ${group.ean}`,
        ean: group.ean,
        productInfo: `${brand} ${colour} ${toonLabel} (${size})`,
        issueType: 'WARNING',
        message: `Image Mapping Warning: No S-size EAN record found for Toon Label variant "${variantKey}". Used images/${group.ean}.jpg.`,
      });
    }

    // Cost Price & Discount Calculations
    let costPrice: string | number = '';
    let discount: string | number = '';

    if (pricingConfig?.enableCostPriceCalc && pricingConfig.costPricePercentage > 0) {
      costPrice = Math.round(sellingPrice * (pricingConfig.costPricePercentage / 100));
    }
    if (pricingConfig?.enableDiscountCalc && pricingConfig.discountPercentage > 0) {
      discount = `${pricingConfig.discountPercentage}%`;
    }

    // Level 1 Deterministic Rule Engine
    const ruleClassification = classifyWithRules({
      productGroup,
      department: originalDepartment,
      productName,
      classBrand: brand,
      garmentFabric: fabric,
    });

    let classification: ClassificationResult;

    if (ruleClassification && ruleClassification.confidence >= 0.85) {
      classification = ruleClassification;
    } else {
      // Mark for AI processing
      classification = ruleClassification || {
        mainCategory: 'Men',
        department: 'Top Wear',
        productType: 'Shirt',
        confidence: 0.5,
        source: 'AI',
        status: 'Manual Review Required',
        reasoning: 'Pending AI classification analysis.',
      };

      itemsNeedingAI.push({
        index: i,
        payload: {
          id: group.ean,
          productGroup,
          department: originalDepartment,
          productName,
          classBrand: brand,
          colour,
          size,
          garmentFabric: fabric,
          styleNo,
        },
      });
    }

    if (classification.status === 'Manual Review Required') {
      validationIssues.push({
        id: `val-ai-review-${group.ean}`,
        rowId: `EAN ${group.ean}`,
        ean: group.ean,
        productInfo: `${productGroup} -> ${originalDepartment} (${productName})`,
        issueType: 'WARNING',
        message: `Low confidence classification (${Math.round(
          classification.confidence * 100
        )}%). Requires manual category review.`,
      });
    }

    // Aggregate stock by individual store for this EAN
    const storeMap = new Map<string, { store: string; stock: number; mrp: number }>();
    group.rows.forEach((r) => {
      const sName = String(
        r.storeName ||
        r.storeId ||
        r['Store'] ||
        r['Store Name'] ||
        r['STORE'] ||
        r['Location'] ||
        r['Branch'] ||
        'Store 1'
      ).trim() || 'Store 1';
      const stk = parseInt(String(r.stock ?? r['Stock'] ?? 0), 10) || 0;
      const mrpVal = parseFloat(String(r.mrp ?? r['MRP'] ?? 0)) || 0;
      if (!storeMap.has(sName)) {
        storeMap.set(sName, { store: sName, stock: stk, mrp: mrpVal });
      } else {
        const existing = storeMap.get(sName)!;
        existing.stock += stk;
        if (mrpVal > 0 && !existing.mrp) existing.mrp = mrpVal;
      }
    });

    const storeBreakdown = Array.from(storeMap.values()).sort((a, b) =>
      a.store.localeCompare(b.store, undefined, { numeric: true, sensitivity: 'base' })
    );
    const storesWithStock = storeBreakdown.filter((s) => s.stock > 0);
    const storeCount = storesWithStock.length > 0 ? storesWithStock.length : storeBreakdown.length;
    const storeBreakdownSummary = storeBreakdown
      .map((s) => `${s.store}: ${s.stock}`)
      .join(' | ');

    initialProducts.push({
      id: `prod-${group.ean}`,
      ean: group.ean,
      mainCategory: classification.mainCategory,
      department: classification.department,
      productType: classification.productType,
      productName: productName || originalDepartment,
      brand: brand || 'GM Fashion',
      colour: colour || 'N/A',
      size: size || 'FREE',
      fabric: fabric || 'Cotton',
      sellingPrice,
      stockQuantity: group.totalStock,
      styleNo,
      toonLabel,
      imagePath,
      sSizeEan: sSizeEan || group.ean,
      costPrice,
      discount,
      metaTitle: `${brand} ${productName} - ${colour}`,
      metaKeywords: `${brand}, ${productName}, ${colour}, ${classification.productType}`,
      metaDescription: `Buy ${brand} ${productName} in ${colour} online at GM Fashion.`,
      fit: 'Regular Fit',
      productDescription: `${brand} ${productName} made from ${fabric || 'quality material'}. Perfect for daily wear.`,
      productDetails: `Toon Label: ${toonLabel} | Fabric: ${fabric || 'Cotton'} | Colour: ${colour}`,
      storeCount,
      storeBreakdown,
      storeBreakdownSummary,
      originalProductGroup: productGroup,
      originalDepartment: originalDepartment,
      classificationResult: classification,
      validationErrors: errors,
      validationWarnings: warnings,
    });
  }

  // 4. Batch Gemini AI Classification Call for Items needing AI refinement (Chunked in batches of 25)
  if (itemsNeedingAI.length > 0) {
    const CHUNK_SIZE = 25;
    const allPayloads = itemsNeedingAI.map((item) => item.payload);

    for (let i = 0; i < allPayloads.length; i += CHUNK_SIZE) {
      const chunk = allPayloads.slice(i, i + CHUNK_SIZE);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const apiRes = await fetch('/api/classify-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: chunk }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const data = await apiRes.json();
          if (Array.isArray(data.results)) {
            data.results.forEach((aiRes: any) => {
              const target = initialProducts.find((p) => p.ean === aiRes.id);
              if (target) {
                const mainCat = (aiRes.mainCategory as MainCategoryType) || 'Men';
                const dept = (aiRes.department as DepartmentType) || 'Top Wear';
                const pType = aiRes.productType || 'Shirt';
                const confidence = parseFloat(aiRes.confidence) || 0.75;

                const isValid = isValidTaxonomyCombination(mainCat, dept, pType);

                target.mainCategory = mainCat;
                target.department = dept;
                target.productType = pType;

                target.classificationResult = {
                  mainCategory: mainCat,
                  department: dept,
                  productType: pType,
                  confidence,
                  source: 'AI',
                  status:
                    confidence >= 0.80 && isValid ? 'Approved' : 'Manual Review Required',
                  reasoning: aiRes.reasoning || 'Gemini AI Taxonomy Classification',
                };
              }
            });
          }
        }
      } catch (err) {
        console.warn('AI batch classification call error for chunk, using rule fallbacks:', err);
      }
    }
  }

  return {
    processedProducts: initialProducts,
    validationIssues,
    variantMap,
  };
}

export function applyProductFilters(
  products: ProcessedProductRecord[],
  filters: FilterState
): ProcessedProductRecord[] {
  // Parse batch EAN input if provided into sets for strict, exact matching
  const batchEanCleanSet = new Set<string>();
  const batchEanNoZeroSet = new Set<string>();

  if (filters.batchEanInput && filters.batchEanInput.trim().length > 0) {
    const rawTokens = filters.batchEanInput.split(/[\n\r,;\t ]+/);
    for (const token of rawTokens) {
      // Clean quotes, punctuation and spaces from searched token
      const cleaned = token.replace(/[^a-z0-9]/gi, '').toLowerCase();
      if (cleaned.length > 0) {
        batchEanCleanSet.add(cleaned);
        const withoutZeros = cleaned.replace(/^0+/, '');
        if (withoutZeros.length > 0) {
          batchEanNoZeroSet.add(withoutZeros);
        }
      }
    }
  }

  return products.filter((p) => {
    // 1. Batch Multi-EAN Search Filter (Strict exact match ONLY on product's actual EAN code)
    if (batchEanCleanSet.size > 0) {
      const pEan = (p.ean || '').toLowerCase().trim();
      const cleanEan = pEan.replace(/[^a-z0-9]/gi, '');
      const cleanEanNoZero = cleanEan.replace(/^0+/, '');

      const isMatched =
        batchEanCleanSet.has(cleanEan) ||
        (cleanEanNoZero.length > 0 && batchEanNoZeroSet.has(cleanEanNoZero));

      // Reject immediately if this product's actual EAN code was NOT in the user's entered batch list!
      if (!isMatched) {
        return false;
      }
    }

    // 2. EAN Series Filter (Strictly matches product's actual EAN starting with prefix e.g. '5' or '6')
    if (filters.eanSeries && filters.eanSeries.trim().length > 0) {
      const rawPrefix = filters.eanSeries.trim().toLowerCase();
      const cleanPrefix = rawPrefix.replace(/[^a-z0-9]/gi, '');
      const pEan = (p.ean || '').toLowerCase().trim();
      const cleanEan = pEan.replace(/[^a-z0-9]/gi, '');

      // Strictly check the product's actual EAN (never check p.sSizeEan to prevent wrong series products leaking in)
      const startsWithPrefix =
        (pEan && pEan.startsWith(rawPrefix)) ||
        (cleanPrefix.length > 0 && cleanEan.startsWith(cleanPrefix));

      if (!startsWithPrefix) {
        return false;
      }
    }

    // 3. Department Filter
    if (
      filters.department &&
      filters.department.trim() !== '' &&
      filters.department.toLowerCase() !== 'all'
    ) {
      const deptQuery = filters.department.toLowerCase().trim();
      const fields = [
        p.department,
        p.originalDepartment,
        p.originalProductGroup,
        p.mainCategory,
      ].map((f) => (f || '').toLowerCase());

      const matchesDept = fields.some((f) => {
        if (deptQuery === 'men') {
          return /\bmen\b/i.test(f) && !/\bwomen\b/i.test(f);
        }
        return f.includes(deptQuery);
      });

      if (!matchesDept) return false;
    }

    // 4. Product Type Filter (Matches productType, mainCategory, department, original group/dept, productName, brand, fabric, colour)
    if (filters.productType && filters.productType.trim().length > 0) {
      const ptQuery = filters.productType.toLowerCase().trim();
      const fieldsToSearch = [
        p.productType,
        p.mainCategory,
        p.department,
        p.originalProductGroup,
        p.originalDepartment,
        p.productName,
        p.brand,
        p.colour,
        p.fabric,
      ].map((f) => (f || '').toLowerCase());

      const keywords = ptQuery.split(/[\s,]+/).filter(Boolean);
      const matchesType = keywords.every((kw) => {
        if (kw === 'men') {
          return fieldsToSearch.some((fieldStr) => /\bmen\b/i.test(fieldStr) && !/\bwomen\b/i.test(fieldStr));
        }
        return fieldsToSearch.some((fieldStr) => fieldStr.includes(kw));
      });

      if (!matchesType) return false;
    }

    // 5. Product Name Filter
    if (
      filters.productName &&
      filters.productName.trim().length > 0 &&
      !p.productName.toLowerCase().includes(filters.productName.toLowerCase().trim())
    ) {
      return false;
    }

    // 6. Brand / Class Filter
    if (
      filters.brand &&
      filters.brand.trim().length > 0 &&
      !p.brand.toLowerCase().includes(filters.brand.toLowerCase().trim())
    ) {
      return false;
    }

    // 7. Colour Filter
    if (
      filters.colour &&
      filters.colour.trim().length > 0 &&
      !p.colour.toLowerCase().includes(filters.colour.toLowerCase().trim())
    ) {
      return false;
    }

    // 8. Single EAN Filter (Strict match on product's actual EAN)
    if (filters.ean && filters.ean.trim().length > 0) {
      const query = filters.ean.trim().toLowerCase();
      const cleanQuery = query.replace(/[^a-z0-9]/gi, '');
      const pEan = (p.ean || '').toLowerCase().trim();
      const cleanEan = pEan.replace(/[^a-z0-9]/gi, '');

      const matches = pEan.includes(query) || (cleanQuery.length > 0 && cleanEan.includes(cleanQuery));
      if (!matches) {
        return false;
      }
    }

    // 9. Size Filter (Supports comma-separated values like "S, L, XL, M" or "36, 38, 40")
    if (filters.size && filters.size.trim().length > 0) {
      const targetSizes = filters.size
        .split(/[\n\r,;\t]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (targetSizes.length > 0) {
        const prodSize = p.size.toLowerCase().trim();
        const matchesSize = targetSizes.some(
          (ts) => prodSize === ts || prodSize.includes(ts) || ts.includes(prodSize)
        );
        if (!matchesSize) return false;
      }
    }

    // 10. Stock Quantity Filter (Supports dropdown number + symbol operator <, >, <=, >=, = or legacy text "10+", ">=5")
    const hasStockValue = filters.stockValue !== undefined && filters.stockValue.trim().length > 0;
    const hasMinStock = filters.minStock && filters.minStock.trim().length > 0;

    if (hasStockValue) {
      const num = parseInt(filters.stockValue!.trim(), 10);
      if (!isNaN(num)) {
        const op = filters.stockOperator || '>=';
        if (op === '>=') {
          if (p.stockQuantity < num) return false;
        } else if (op === '>') {
          if (p.stockQuantity <= num) return false;
        } else if (op === '<=') {
          if (p.stockQuantity > num) return false;
        } else if (op === '<') {
          if (p.stockQuantity >= num) return false;
        } else if (op === '=') {
          if (p.stockQuantity !== num) return false;
        }
      }
    } else if (hasMinStock) {
      const stockStr = filters.minStock.trim();

      if (stockStr.startsWith('==') || stockStr.startsWith('=')) {
        const numStr = stockStr.replace(/=/g, '').trim();
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && p.stockQuantity !== num) {
          return false;
        }
      } else if (stockStr.startsWith('>=')) {
        const numStr = stockStr.replace(/>=/g, '').trim();
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && p.stockQuantity < num) {
          return false;
        }
      } else if (stockStr.startsWith('>')) {
        const numStr = stockStr.replace(/>/g, '').trim();
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && p.stockQuantity <= num) {
          return false;
        }
      } else if (stockStr.startsWith('<=')) {
        const numStr = stockStr.replace(/<=/g, '').trim();
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && p.stockQuantity > num) {
          return false;
        }
      } else if (stockStr.startsWith('<')) {
        const numStr = stockStr.replace(/</g, '').trim();
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && p.stockQuantity >= num) {
          return false;
        }
      } else if (stockStr.endsWith('+') || stockStr.startsWith('+')) {
        const numStr = stockStr.replace(/[+]/g, '').trim();
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && p.stockQuantity < num) {
          return false;
        }
      } else if (stockStr.startsWith('-') || stockStr.endsWith('-')) {
        const numStr = stockStr.replace(/[-]/g, '').trim();
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && p.stockQuantity > num) {
          return false;
        }
      } else {
        // Plain number e.g. "10" means minimum stock 10+
        const num = parseInt(stockStr, 10);
        if (!isNaN(num) && p.stockQuantity < num) {
          return false;
        }
      }
    }

    // 11. Max Stock Filter (if populated explicitly)
    if (filters.maxStock && filters.maxStock.trim().length > 0) {
      const maxVal = parseInt(filters.maxStock, 10);
      if (!isNaN(maxVal) && p.stockQuantity > maxVal) {
        return false;
      }
    }

    // 12. Review Status Filter
    if (filters.reviewStatus === 'APPROVED' && p.classificationResult.status !== 'Approved') {
      return false;
    }
    if (filters.reviewStatus === 'REVIEW_REQUIRED' && p.classificationResult.status !== 'Manual Review Required') {
      return false;
    }

    return true;
  });
}
