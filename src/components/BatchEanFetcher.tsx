import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Barcode,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { ProcessedProductRecord, FilterState } from '../types';

interface BatchEanFetcherProps {
  products: ProcessedProductRecord[];
  rawCount: number;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onSelectTableTab: () => void;
  onProcessData?: () => Promise<void> | void;
}

export const BatchEanFetcher: React.FC<BatchEanFetcherProps> = ({
  products,
  rawCount,
  filters,
  onFilterChange,
  onSelectTableTab,
  onProcessData,
}) => {
  const [eanText, setEanText] = useState<string>(filters.batchEanInput || '');

  React.useEffect(() => {
    setEanText(filters.batchEanInput || '');
  }, [filters.batchEanInput]);

  // Parse input EAN codes count (stripping leading/trailing single quotes, quotes, spaces)
  const parseEanCodes = (text: string): string[] => {
    return Array.from(
      new Set(
        text
          .split(/[\n\r,;\t ]+/)
          .map((t) => t.trim().replace(/^['"`\s]+|['"`\s]+$/g, ''))
          .filter((t) => t.length >= 3)
      )
    );
  };

  const parsedEans = parseEanCodes(eanText);

  // Apply Batch EAN Filter (preserves active stock quantity filter so user can immediately view e.g. stock >= 5)
  const handleApplyFilter = async () => {
    const cleanedText = parseEanCodes(eanText).join('\n');
    onFilterChange({
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
      batchEanInput: cleanedText || eanText,
    });

    if (onProcessData && (products.length === 0 || rawCount === 0)) {
      await onProcessData();
    }

    onSelectTableTab();
  };

  // Clear Batch EAN Field
  const handleClear = () => {
    setEanText('');
    onFilterChange({
      ...filters,
      batchEanInput: '',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-200/80 p-6 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl border border-amber-500/20 mt-0.5">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <span>Batch EAN Code Fetcher</span>
              {parsedEans.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {parsedEans.length} EANs Entered
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste EAN numbers to search and fetch matching product records from uploaded Wondersoft data.
            </p>
          </div>
        </div>

        {rawCount === 0 && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center space-x-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Upload Wondersoft file above first to fetch data.</span>
          </div>
        )}
      </div>

      {/* Multiline EAN Paste Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-amber-600" />
            <span>Enter / Paste EAN Codes</span>
          </label>
        </div>

        <textarea
          value={eanText}
          onChange={(e) => setEanText(e.target.value)}
          placeholder={`Paste EAN codes here (e.g. 5001234567890, 6001234567891...)`}
          rows={5}
          className="w-full bg-slate-50/80 border border-slate-300 focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 rounded-xl p-3 font-mono text-xs text-slate-800 transition resize-y leading-relaxed"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
          <p className="flex items-center space-x-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
            <span>Strict Exact Match: Only these exact EANs will show. Excel quotes (e.g. '5...) are automatically stripped.</span>
          </p>
          {filters.batchEanInput && (
            <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md self-start sm:self-auto">
              Active: Filtered to entered EAN list
            </span>
          )}
        </div>

        {/* Buttons: Clear Field & Fetch */}
        <div className="flex items-center justify-end space-x-3 pt-1">
          <button
            onClick={handleClear}
            disabled={!eanText}
            className="text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-4 py-2 rounded-xl transition flex items-center space-x-1.5 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Field</span>
          </button>

          <button
            onClick={handleApplyFilter}
            disabled={parsedEans.length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-5 py-2 rounded-xl transition shadow-sm flex items-center space-x-2 disabled:opacity-50"
          >
            <Filter className="w-4 h-4 text-slate-950" />
            <span>Fetch Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
