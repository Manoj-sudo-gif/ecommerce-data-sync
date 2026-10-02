import React, { useState, useRef } from 'react';
import {
  Layers,
  Search,
  Trash2,
  Filter,
  AlertCircle,
  Upload,
  Download,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProcessedProductRecord, FilterState } from '../types';

interface ToonLabelComparatorProps {
  products: ProcessedProductRecord[];
  rawCount: number;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onSelectTableTab: () => void;
  onProcessData?: () => Promise<void> | void;
  onExportToonExcel?: () => void;
}

export const ToonLabelComparator: React.FC<ToonLabelComparatorProps> = ({
  products,
  rawCount,
  filters,
  onFilterChange,
  onSelectTableTab,
  onProcessData,
  onExportToonExcel,
}) => {
  const [toonText, setToonText] = useState<string>(filters.batchToonInput || '');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setToonText(filters.batchToonInput || '');
  }, [filters.batchToonInput]);

  // Parse input Toon Labels with strict deduplication
  const parseToonLabels = (text: string): string[] => {
    const tokens = text
      .split(/[\n\r,;\t]+/)
      .map((t) => t.trim().replace(/^['"`\s]+|['"`\s]+$/g, ''))
      .filter((t) => t.length >= 2);

    return Array.from(new Set(tokens));
  };

  const parsedToons = parseToonLabels(toonText);
  const isCurrentlyActive =
    filters.activeMatchMode === 'TOON' ||
    Boolean(filters.batchToonInput && filters.batchToonInput.trim().length > 0);

  // File Upload Handler (.xlsx, .xls, .csv, .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    if (fileName.endsWith('.txt')) {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const allTokens = content
          .split(/[\n\r,;\t]+/)
          .map((t) => t.trim().replace(/^['"`\s]+|['"`\s]+$/g, ''))
          .filter((t) => t.length >= 2);

        const uniqueTokens = Array.from(new Set(allTokens));
        const duplicateCount = allTokens.length - uniqueTokens.length;

        setToonText(uniqueTokens.join('\n'));
        setUploadFeedback(
          `Loaded ${uniqueTokens.length} unique Toon Labels from ${file.name} (${duplicateCount} duplicates removed).`
        );
      };
      reader.readAsText(file);
    } else {
      // Excel or CSV file
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });

          if (!jsonRows || jsonRows.length === 0) {
            setUploadFeedback('The uploaded file appears to be empty.');
            return;
          }

          // Header row analysis to find best column
          const headerRow = (jsonRows[0] || []) as any[];
          let targetColIndex = 0; // Default to first column

          for (let i = 0; i < headerRow.length; i++) {
            const h = String(headerRow[i] || '').toLowerCase().trim();
            if (
              h.includes('toon') ||
              h.includes('style') ||
              h.includes('label') ||
              h.includes('code')
            ) {
              targetColIndex = i;
              break;
            }
          }

          const extractedToons: string[] = [];
          // Skip header row if it is text
          const startRow = typeof headerRow[targetColIndex] === 'string' && isNaN(Number(headerRow[targetColIndex])) ? 1 : 0;

          for (let r = startRow; r < jsonRows.length; r++) {
            const row = jsonRows[r] as any[];
            if (row && row[targetColIndex] !== undefined && row[targetColIndex] !== null) {
              const val = String(row[targetColIndex])
                .trim()
                .replace(/^['"`\s]+|['"`\s]+$/g, '');
              if (val.length >= 2) {
                extractedToons.push(val);
              }
            }
          }

          const uniqueToons = Array.from(new Set(extractedToons));
          const duplicateCount = extractedToons.length - uniqueToons.length;

          setToonText(uniqueToons.join('\n'));
          setUploadFeedback(
            `Extracted ${uniqueToons.length} unique Toon Labels from "${file.name}" (${duplicateCount} duplicates merged).`
          );
        } catch (err) {
          console.error(err);
          setUploadFeedback('Failed to read file. Please ensure it is a valid Excel or CSV file.');
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // Reset input so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Apply Toon Label Match & Comparator Filter
  const handleApplyFilter = async () => {
    const cleanedText = parseToonLabels(toonText).join('\n');
    onFilterChange({
      ...filters,
      eanSeries: '',
      department: '',
      productType: '',
      productName: '',
      brand: '',
      colour: '',
      ean: '',
      size: '',
      minStock: filters.minStock || '',
      stockValue: filters.stockValue || '',
      stockOperator: filters.stockOperator || '>=',
      maxStock: '',
      reviewStatus: 'ALL',
      batchEanInput: '', // Clear batch EAN so Toon Label takes precedence
      batchToonInput: cleanedText || toonText,
      activeMatchMode: 'TOON',
    });

    if (onProcessData && (products.length === 0 || rawCount === 0)) {
      await onProcessData();
    }

    onSelectTableTab();
  };

  // Clear Toon Label Field
  const handleClear = () => {
    setToonText('');
    setUploadFeedback(null);
    onFilterChange({
      ...filters,
      batchToonInput: '',
      activeMatchMode: filters.batchEanInput ? 'EAN' : 'ALL',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-indigo-200/80 p-6 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-700 rounded-xl border border-indigo-500/20 mt-0.5">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <span>Toon Label Comparator</span>
              {parsedToons.length > 0 && (
                <span className="bg-indigo-100 text-indigo-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {parsedToons.length} Unique Toon Labels
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste or upload Toon Labels to aggregate total stock quantity and eliminate duplicate rows (EAN column omitted).
            </p>
          </div>
        </div>

        {rawCount === 0 && (
          <div className="text-xs text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl flex items-center space-x-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Upload Wondersoft file above first to fetch data.</span>
          </div>
        )}
      </div>

      {/* Multiline Toon Label Paste Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-indigo-600" />
            <span>Enter / Paste / Upload Toon Labels</span>
          </label>

          {/* Upload File Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition flex items-center space-x-1"
              title="Upload an Excel, CSV, or TXT file containing Toon Labels"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Toon File</span>
            </button>
          </div>
        </div>

        <textarea
          value={toonText}
          onChange={(e) => {
            setToonText(e.target.value);
            if (uploadFeedback) setUploadFeedback(null);
          }}
          placeholder={`Paste Toon Labels here (e.g. TN-SHIRT-NAVY, TN-POLO-BLK, TN-JEANS-BLU...)`}
          rows={5}
          className="w-full bg-slate-50/80 border border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 font-mono text-xs text-slate-800 transition resize-y leading-relaxed"
        />

        {/* Upload feedback banner if file was uploaded */}
        {uploadFeedback && (
          <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{uploadFeedback}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
          <p className="flex items-center space-x-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1"></span>
            <span>
              Duplicates Merged • Total Quantity Summed • EAN Column Omitted in Table & Excel Export.
            </span>
          </p>
          {isCurrentlyActive && (
            <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md self-start sm:self-auto">
              Active: Toon Comparator Mode
            </span>
          )}
        </div>

        {/* Buttons: Clear Field, Export Toon Excel & Fetch */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
          <button
            onClick={handleClear}
            disabled={!toonText}
            className="text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Field</span>
          </button>

          {onExportToonExcel && isCurrentlyActive && (
            <button
              onClick={onExportToonExcel}
              className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              title="Download matched Toon Label Excel without EAN column and with combined Total Quantity"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Toon Excel (No EAN)</span>
            </button>
          )}

          <button
            onClick={handleApplyFilter}
            disabled={parsedToons.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-sm flex items-center space-x-2 disabled:opacity-50"
          >
            <Filter className="w-4 h-4 text-white" />
            <span>Compare & Fetch Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
