import * as XLSX from 'xlsx';
import { ProcessedProductRecord, ValidationIssue, ImageTeamRecord } from '../types';

export function exportEcommerceExcel(products: ProcessedProductRecord[]): void {
  // Collect all unique store names across all products
  const storeNamesSet = new Set<string>();
  products.forEach((p) => {
    p.storeBreakdown?.forEach((sb) => {
      if (sb.store && sb.store.trim()) {
        storeNamesSet.add(sb.store.trim());
      }
    });
  });
  const allStoreNames = Array.from(storeNamesSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const dataRows = products.map((p) => {
    const storeStockMap: Record<string, number> = {};
    p.storeBreakdown?.forEach((sb) => {
      const sName = sb.store.trim();
      storeStockMap[sName] = (storeStockMap[sName] || 0) + sb.stock;
    });

    const storeSummary =
      p.storeBreakdownSummary ||
      (p.storeBreakdown && p.storeBreakdown.length > 0
        ? p.storeBreakdown.map((sb) => `${sb.store}: ${sb.stock}`).join(' | ')
        : `${p.storeCount} stores`);

    const row: Record<string, any> = {
      'Main Category': p.mainCategory,
      'Department': p.department,
      'Product Type': p.productType,
      'Product Name': p.productName,
      'Brand': p.brand,
      'Colour': p.colour,
      'Size': p.size,
      'Fabric': p.fabric,
      'EAN': String(p.ean), // Force string format for EAN
      'Selling Price': p.sellingPrice,
      'Total Stock Quantity': p.stockQuantity,
      'Store Count': p.storeCount,
    };

    // Include individual store counts for each EAN
    allStoreNames.forEach((storeName) => {
      row[`${storeName} (Stock)`] = storeStockMap[storeName] ?? 0;
    });

    row['Store-wise Breakdown'] = storeSummary;
    row['Toon Label'] = p.toonLabel || p.styleNo || '';
    row['StyleNo'] = p.styleNo;
    row['Image Path'] = p.imagePath;
    row['Cost Price'] = p.costPrice || '';
    row['Discount'] = p.discount || '';
    row['Meta Title'] = p.metaTitle || '';
    row['Meta Keywords'] = p.metaKeywords || '';
    row['Meta Description'] = p.metaDescription || '';
    row['Fit'] = p.fit || '';
    row['Product Description'] = p.productDescription || '';
    row['Product Details'] = p.productDetails || '';
    row['Original Wondersoft Group'] = p.originalProductGroup;
    row['Original Wondersoft Dept'] = p.originalDepartment;
    row['AI Confidence'] = `${Math.round(p.classificationResult.confidence * 100)}%`;
    row['Classification Source'] = p.classificationResult.source;

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths for polished presentation
  const colWidths: { wch: number }[] = [
    { wch: 15 }, // Main Category
    { wch: 15 }, // Department
    { wch: 15 }, // Product Type
    { wch: 25 }, // Product Name
    { wch: 15 }, // Brand
    { wch: 12 }, // Colour
    { wch: 8 },  // Size
    { wch: 15 }, // Fabric
    { wch: 16 }, // EAN
    { wch: 14 }, // Selling Price
    { wch: 18 }, // Total Stock Quantity
    { wch: 14 }, // Store Count
  ];
  // Add width for each store column
  allStoreNames.forEach(() => {
    colWidths.push({ wch: 16 });
  });
  colWidths.push(
    { wch: 32 }, // Store-wise Breakdown
    { wch: 16 }, // Toon Label
    { wch: 15 }, // StyleNo
    { wch: 25 }, // Image Path
    { wch: 12 }, // Cost Price
    { wch: 12 }, // Discount
    { wch: 25 }, // Meta Title
    { wch: 25 }, // Meta Keywords
    { wch: 30 }, // Meta Description
    { wch: 12 }, // Fit
    { wch: 35 }, // Product Description
    { wch: 35 }, // Product Details
    { wch: 25 }, // Original Group
    { wch: 25 }, // Original Dept
    { wch: 14 }, // AI Confidence
    { wch: 20 }, // Classification Source
  );
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'E-Commerce Products');

  // Also append Sheet 2: Dedicated Store-wise Inventory Breakdown
  const storeInventoryRows = products.map((p) => {
    const storeStockMap: Record<string, number> = {};
    p.storeBreakdown?.forEach((sb) => {
      const sName = sb.store.trim();
      storeStockMap[sName] = (storeStockMap[sName] || 0) + sb.stock;
    });

    const sRow: Record<string, any> = {
      'EAN': String(p.ean),
      'Product Name': p.productName,
      'Brand': p.brand,
      'Colour': p.colour,
      'Size': p.size,
      'Toon Label': p.toonLabel || p.styleNo || '',
      'Selling Price': p.sellingPrice,
      'Total Stock': p.stockQuantity,
      'Stores With Stock': p.storeCount,
    };

    allStoreNames.forEach((storeName) => {
      sRow[storeName] = storeStockMap[storeName] ?? 0;
    });

    sRow['Store Breakdown Summary'] =
      p.storeBreakdownSummary ||
      (p.storeBreakdown && p.storeBreakdown.length > 0
        ? p.storeBreakdown.map((sb) => `${sb.store}: ${sb.stock}`).join(' | ')
        : `${p.storeCount} stores`);

    return sRow;
  });

  const storeWorksheet = XLSX.utils.json_to_sheet(storeInventoryRows);
  const storeColWidths: { wch: number }[] = [
    { wch: 16 }, // EAN
    { wch: 25 }, // Product Name
    { wch: 15 }, // Brand
    { wch: 12 }, // Colour
    { wch: 8 },  // Size
    { wch: 16 }, // Toon Label
    { wch: 14 }, // Selling Price
    { wch: 14 }, // Total Stock
    { wch: 16 }, // Stores With Stock
  ];
  allStoreNames.forEach(() => {
    storeColWidths.push({ wch: 16 });
  });
  storeColWidths.push({ wch: 35 }); // Store Breakdown Summary
  storeWorksheet['!cols'] = storeColWidths;

  XLSX.utils.book_append_sheet(workbook, storeWorksheet, 'Store-wise Inventory');

  XLSX.writeFile(workbook, 'GM_Fashion_Ecommerce_Products.xlsx');
}

export function exportStoreInventoryExcel(products: ProcessedProductRecord[]): void {
  const storeNamesSet = new Set<string>();
  products.forEach((p) => {
    p.storeBreakdown?.forEach((sb) => {
      if (sb.store && sb.store.trim()) {
        storeNamesSet.add(sb.store.trim());
      }
    });
  });
  const allStoreNames = Array.from(storeNamesSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const storeInventoryRows = products.map((p) => {
    const storeStockMap: Record<string, number> = {};
    p.storeBreakdown?.forEach((sb) => {
      const sName = sb.store.trim();
      storeStockMap[sName] = (storeStockMap[sName] || 0) + sb.stock;
    });

    const sRow: Record<string, any> = {
      'EAN': String(p.ean),
      'Product Name': p.productName,
      'Brand': p.brand,
      'Colour': p.colour,
      'Size': p.size,
      'Toon Label': p.toonLabel || p.styleNo || '',
      'Selling Price': p.sellingPrice,
      'Total Aggregated Stock': p.stockQuantity,
      'Stores Count': p.storeCount,
    };

    allStoreNames.forEach((storeName) => {
      sRow[`${storeName} Stock`] = storeStockMap[storeName] ?? 0;
    });

    sRow['Store-wise Breakdown'] =
      p.storeBreakdownSummary ||
      (p.storeBreakdown && p.storeBreakdown.length > 0
        ? p.storeBreakdown.map((sb) => `${sb.store}: ${sb.stock}`).join(' | ')
        : `${p.storeCount} stores`);

    return sRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(storeInventoryRows);
  const colWidths: { wch: number }[] = [
    { wch: 16 }, // EAN
    { wch: 25 }, // Product Name
    { wch: 15 }, // Brand
    { wch: 12 }, // Colour
    { wch: 8 },  // Size
    { wch: 16 }, // Toon Label
    { wch: 14 }, // Selling Price
    { wch: 20 }, // Total Aggregated Stock
    { wch: 14 }, // Stores Count
  ];
  allStoreNames.forEach(() => {
    colWidths.push({ wch: 16 });
  });
  colWidths.push({ wch: 35 });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Store Inventory');
  XLSX.writeFile(workbook, 'GM_Fashion_Store_Inventory.xlsx');
}

export function exportImageTeamExcel(products: ProcessedProductRecord[]): void {
  // Deduplicate products strictly by TOON LABLE (no duplicate Toon Labels in Image Team Excel)
  const toonGroupMap = new Map<string, ProcessedProductRecord[]>();

  products.forEach((p) => {
    const rawToon = String(p.toonLabel || p.styleNo || '').trim();
    const toonKey = rawToon.toUpperCase();

    if (!toonKey) {
      // Fallback if toon label is empty, use EAN as distinct key
      const fallbackKey = `__NO_TOON_${p.ean}`;
      toonGroupMap.set(fallbackKey, [p]);
      return;
    }

    if (!toonGroupMap.has(toonKey)) {
      toonGroupMap.set(toonKey, []);
    }
    toonGroupMap.get(toonKey)!.push(p);
  });

  const dataRows: Record<string, any>[] = [];

  toonGroupMap.forEach((groupProducts) => {
    // Pick the best representative SKU for this Toon Label:
    // 1. Priority 1: SKU whose EAN matches the S-Size reference EAN (sSizeEan)
    // 2. Priority 2: SKU with size 'S'
    // 3. Priority 3: First available SKU in the group
    let rep = groupProducts.find((p) => p.ean === p.sSizeEan);
    if (!rep) {
      rep = groupProducts.find((p) => p.size?.trim().toUpperCase() === 'S');
    }
    if (!rep) {
      rep = groupProducts[0];
    }

    dataRows.push({
      'Product Name': rep.productName || '',
      'EAN': String(rep.ean || ''),
      'TOON LABLE': rep.toonLabel || rep.styleNo || '',
      'BRAND': rep.brand || '',
      'SIZE': rep.size || '',
      'COLOUR': rep.colour || '',
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  worksheet['!cols'] = [
    { wch: 35 }, // Product Name
    { wch: 18 }, // EAN
    { wch: 20 }, // TOON LABLE
    { wch: 20 }, // BRAND
    { wch: 12 }, // SIZE
    { wch: 18 }, // COLOUR
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Image Team');

  XLSX.writeFile(workbook, 'GM_Fashion_Image_Team.xlsx');
}

export function exportErrorReportExcel(validationIssues: ValidationIssue[]): void {
  const dataRows = validationIssues.map((issue) => ({
    'Issue ID': issue.id,
    'Row / EAN ID': issue.rowId,
    'EAN': issue.ean,
    'Product Info': issue.productInfo,
    'Issue Type': issue.issueType,
    'Message / Details': issue.message,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 },
    { wch: 14 },
    { wch: 50 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Error Report');

  XLSX.writeFile(workbook, 'GM_Fashion_Error_Report.xlsx');
}
