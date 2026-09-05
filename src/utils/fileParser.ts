import * as XLSX from 'xlsx';
import { WondersoftRawRecord, EcommerceFileInfo } from '../types';

export async function parseUploadedFile(file: File): Promise<WondersoftRawRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false, dense: true });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 1. Convert to 2D array to detect real header row (in case of title/metadata rows at top)
        const raw2D: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        let headerRowIndex = 0;
        let maxHeaderScore = -1;

        const keywords = [
          'ean', 'barcode', 'mrp', 'stock', 'qty', 'department', 'dept', 'brand',
          'class', 'size', 'colour', 'color', 'product', 'group', 'item', 'style', 'price'
        ];

        // Scan first 15 rows to find the row with the most matching header keywords
        for (let r = 0; r < Math.min(raw2D.length, 15); r++) {
          const rowVals = raw2D[r] || [];
          let score = 0;
          rowVals.forEach((val) => {
            const strVal = String(val ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
            keywords.forEach((kw) => {
              if (strVal.includes(kw)) score++;
            });
          });
          if (score > maxHeaderScore) {
            maxHeaderScore = score;
            headerRowIndex = r;
          }
        }

        // Parse JSON rows starting from detected header row
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          defval: '',
        });

        if (jsonRows.length === 0) {
          resolve([]);
          return;
        }

        // Pre-compute matched column names from sample row
        const sampleRow = jsonRows[0] || {};
        const availableKeys = Object.keys(sampleRow);

        const findBestKey = (possibleKeys: string[]): string => {
          for (const key of possibleKeys) {
            const cleanTarget = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matchedKey = availableKeys.find(
              (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget
            );
            if (matchedKey) return matchedKey;
          }
          return '';
        };

        const keyMap = {
          storeName: findBestKey(['store', 'storename', 'store id', 'outlet', 'location', 'branch', 'shop', 'counter', 'store_name', 'unit']),
          productGroup: findBestKey(['product group', 'productgroup', 'pg', 'category', 'group', 'section', 'division', 'product_group', 'group_name', 'main_cat', 'cat', 'pg_name']),
          department: findBestKey(['department', 'dept', 'ws department', 'department name', 'sub_cat', 'subcategory', 'sub category', 'dept_name', 'department_name']),
          classBrand: findBestKey(['class', 'brand', 'class/brand', 'brand name', 'class_name', 'brand_name', 'mfg', 'company', 'manufacturer', 'vendor']),
          colour: findBestKey(['colour', 'color', 'shade', 'col', 'color_name', 'colour_name']),
          size: findBestKey(['size', 'sz', 'size_name', 'size_code']),
          garmentFabric: findBestKey(['garment', 'fabric', 'garment/fabric', 'material', 'composition', 'quality', 'garment_fabric']),
          ean: findBestKey(['ean code', 'ean', 'eancode', 'barcode', 'upc', 'ean_code', 'ean_no', 'eanno', 'barcode_no', 'bar_code', 'item_code', 'itemcode', 'code', 'gtin']),
          mrp: findBestKey(['mrp', 'selling price', 'price', 'rsp', 'rate', 's_price', 'mrp_price', 'selling_price', 'unit_price', 'val', 'value']),
          stock: findBestKey(['stock', 'stock quantity', 'qty', 'quantity', 'stk', 'closing_stock', 'current_stock', 'balance', 'total_stock', 'closing stock', 'stk_qty', 'stock_qty', 'closing_qty', 'inventory']),
          toonLabel: findBestKey(['toon label', 'toonlabel', 'toon_label', 'toon', 'toon label no', 'toon code', 'toon_code', 'toon_name', 'toon_no']),
          styleNo: findBestKey(['style no', 'styleno', 'style', 'style code', 'design_no', 'design', 'art_no', 'style_name', 'style_code', 'model', 'item_no']),
          productName: findBestKey(['product name', 'productname', 'item name', 'itemname', 'description', 'particulars', 'item_description', 'product_description', 'item', 'product']),
        };

        const len = jsonRows.length;
        const normalizedRows: WondersoftRawRecord[] = [];

        for (let i = 0; i < len; i++) {
          const row = jsonRows[i];

          let storeName = keyMap.storeName ? String(row[keyMap.storeName] ?? '').trim() : '';
          let productGroup = keyMap.productGroup ? String(row[keyMap.productGroup] ?? '').trim() : '';
          let department = keyMap.department ? String(row[keyMap.department] ?? '').trim() : '';
          let classBrand = keyMap.classBrand ? String(row[keyMap.classBrand] ?? '').trim() : '';
          let colour = keyMap.colour ? String(row[keyMap.colour] ?? '').trim() : '';
          let size = keyMap.size ? String(row[keyMap.size] ?? '').trim() : '';
          let garmentFabric = keyMap.garmentFabric ? String(row[keyMap.garmentFabric] ?? '').trim() : '';
          let ean = keyMap.ean ? String(row[keyMap.ean] ?? '').trim() : '';
          // Strip leading/trailing single or double quotes commonly present in Excel exports (e.g. '500123...)
          ean = ean.replace(/^['"`\s]+|['"`\s]+$/g, '').trim();
          let mrpVal = keyMap.mrp ? parseFloat(String(row[keyMap.mrp] ?? 0)) || 0 : 0;
          let stockVal = keyMap.stock ? parseInt(String(row[keyMap.stock] ?? 0), 10) || 0 : 0;
          let toonLabel = keyMap.toonLabel ? String(row[keyMap.toonLabel] ?? '').trim() : '';
          let styleNo = keyMap.styleNo ? String(row[keyMap.styleNo] ?? '').trim() : '';

          // Fallback search for Toon Label in row keys if missing
          if (!toonLabel && typeof row === 'object') {
            for (const [k, v] of Object.entries(row)) {
              if (k.toLowerCase().includes('toon') && v) {
                toonLabel = String(v).trim();
                break;
              }
            }
          }

          let effectiveToon = toonLabel || styleNo || 'STD01';
          let productName = keyMap.productName ? String(row[keyMap.productName] ?? '').trim() : '';

          // Fallback search across row keys if ean is missing
          if (!ean && typeof row === 'object') {
            for (const [k, v] of Object.entries(row)) {
              const kLower = k.toLowerCase();
              const vStr = String(v ?? '').trim();
              if ((kLower.includes('ean') || kLower.includes('barcode') || kLower.includes('code') || kLower.includes('upc')) && vStr) {
                ean = vStr;
                break;
              }
              if (!ean && /^\d{8,14}$/.test(vStr)) {
                ean = vStr;
                break;
              }
            }
          }

          // Generate fallback EAN if row has data but no EAN
          if (!ean && Object.values(row).some((v) => String(v ?? '').trim() !== '')) {
            ean = `EAN_${i + 1}`;
          }

          if (!ean) continue; // Skip completely blank empty rows

          // Fallback search for MRP if zero
          if (mrpVal === 0 && typeof row === 'object') {
            for (const [k, v] of Object.entries(row)) {
              if (k.toLowerCase().includes('mrp') || k.toLowerCase().includes('price') || k.toLowerCase().includes('rate')) {
                const parsed = parseFloat(String(v));
                if (!isNaN(parsed) && parsed > 0) {
                  mrpVal = parsed;
                  break;
                }
              }
            }
          }

          // Fallback search for Stock if zero
          if (stockVal === 0 && typeof row === 'object') {
            for (const [k, v] of Object.entries(row)) {
              if (k.toLowerCase().includes('qty') || k.toLowerCase().includes('stock') || k.toLowerCase().includes('stk')) {
                const parsed = parseInt(String(v), 10);
                if (!isNaN(parsed) && parsed > 0) {
                  stockVal = parsed;
                  break;
                }
              }
            }
          }

          normalizedRows.push({
            storeName: storeName || 'Store 1',
            productGroup: productGroup || 'MEN',
            department: department || 'Top Wear',
            classBrand: classBrand || 'GM Fashion',
            colour: colour || 'N/A',
            size: size || 'FREE',
            garmentFabric: garmentFabric || 'Cotton',
            ean,
            mrp: mrpVal,
            stock: stockVal,
            styleNo: effectiveToon,
            toonLabel: toonLabel || effectiveToon,
            productName: productName || department || 'Garment Item',
            rawRow: row,
          });
        }

        resolve(normalizedRows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export async function parseEcommerceTemplateFile(
  file: File
): Promise<{ info: EcommerceFileInfo; headers: string[]; sampleData: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false, dense: true });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        let headers: string[] = [];
        if (jsonRows.length > 0) {
          headers = Object.keys(jsonRows[0]);
        }

        const info: EcommerceFileInfo = {
          fileName: file.name,
          rowCount: jsonRows.length,
          headers,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        resolve({
          info,
          headers,
          sampleData: jsonRows.slice(0, 10),
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
