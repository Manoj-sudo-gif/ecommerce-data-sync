import React from 'react';
import { Search, Filter, RotateCcw, Hash, Trash2, Loader2, Package, Barcode } from 'lucide-react';
import { FilterState, StockComparisonOperator } from '../types';

const STOCK_NUMBERS = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '22', '25', '28', '30', '35', '40', '45', '50',
  '60', '70', '80', '90', '100', '150', '200', '300', '500'
];

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  onSelectTableTab?: () => void;
  onProcessData?: () => Promise<void> | void;
  rawCount?: number;
  isProcessing?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  onSelectTableTab,
  onProcessData,
  rawCount = 0,
  isProcessing = false,
}) => {
  const handleChange = (field: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleStockValueChange = (val: string) => {
    const op = filters.stockOperator || '>=';
    onFilterChange({
      ...filters,
      stockValue: val,
      minStock: val !== '' ? `${op}${val}` : '',
    });
  };

  const handleStockOperatorChange = (op: StockComparisonOperator) => {
    onFilterChange({
      ...filters,
      stockOperator: op,
      minStock: filters.stockValue ? `${op}${filters.stockValue}` : '',
    });
  };

  const handleClearStock = () => {
    onFilterChange({
      ...filters,
      stockValue: '',
      minStock: '',
    });
  };

  const handleFetchData = async () => {
    if (onProcessData) {
      await onProcessData();
    }
    if (onSelectTableTab) {
      onSelectTableTab();
    }
  };

  const batchEanCount = React.useMemo(() => {
    if (!filters.batchEanInput || !filters.batchEanInput.trim()) return 0;
    return new Set(
      filters.batchEanInput
        .split(/[\n\r,;\t ]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3)
    ).size;
  }, [filters.batchEanInput]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Custom Data Filter & Fetcher</h3>
          {totalCount > 0 && (
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Showing {filteredCount} of {totalCount} SKUs
            </span>
          )}
        </div>

        <button
          onClick={onResetFilters}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center space-x-1 hover:bg-slate-100 px-2.5 py-1 rounded-md transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset All Filters</span>
        </button>
      </div>

      {/* Batch EAN active badge if user previously pasted EANs */}
      {batchEanCount > 0 && (
        <div className="flex items-center justify-between bg-amber-50/80 border border-amber-300/80 px-3 py-2 rounded-lg text-xs text-amber-950 font-medium">
          <div className="flex items-center space-x-2">
            <Barcode className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Batch EAN Active: <strong>{batchEanCount} EAN codes</strong>. Stock & field filters below will apply on these codes.
            </span>
          </div>
          <button
            onClick={() => onFilterChange({ ...filters, batchEanInput: '' })}
            className="text-[11px] text-rose-700 hover:text-rose-900 font-bold hover:underline ml-2"
            title="Clear Batch EAN filter"
          >
            Clear Batch EANs
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 text-xs">
        {/* 1. Department Filter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700">Department</label>
            <button
              onClick={() => handleChange('department', '')}
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition ${
                !filters.department
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              ALL
            </button>
          </div>
          <input
            type="text"
            value={filters.department}
            onChange={(e) => handleChange('department', e.target.value)}
            placeholder="Type Dept / All"
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-medium"
          />
        </div>

        {/* 2. Class (Brand) Filter */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Class (Brand)</label>
          <input
            type="text"
            value={filters.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="e.g. AIM / GM"
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs"
          />
        </div>

        {/* 3. Colour Filter */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Colour</label>
          <input
            type="text"
            value={filters.colour}
            onChange={(e) => handleChange('colour', e.target.value)}
            placeholder="e.g. Blue, Black"
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs"
          />
        </div>

        {/* 4. Size Filter (Comma-separated e.g. s, l, xl, m) */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700 flex items-center justify-between">
            <span>Size</span>
            <span className="text-[10px] text-amber-700 font-normal">e.g. s,l,xl,m</span>
          </label>
          <input
            type="text"
            value={filters.size}
            onChange={(e) => handleChange('size', e.target.value)}
            placeholder="e.g. s, l, xl, m"
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-mono"
          />
        </div>

        {/* 5. EAN Series Filter */}
        <div className="space-y-1">
          <label className="font-semibold text-amber-800 flex items-center space-x-1">
            <Hash className="w-3 h-3 text-amber-600" />
            <span>EAN Series</span>
          </label>
          <input
            type="text"
            value={filters.eanSeries}
            onChange={(e) => handleChange('eanSeries', e.target.value)}
            placeholder="e.g. 6 or 60"
            className="w-full bg-amber-50/50 border border-amber-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 text-xs"
          />
        </div>

        {/* 6. Product Type Filter */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Product Type</label>
          <input
            type="text"
            value={filters.productType}
            onChange={(e) => handleChange('productType', e.target.value)}
            placeholder="e.g. Men, Shirt, Vest"
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-medium"
          />
        </div>

        {/* 7. Stock Quantity Filter: Number Scroll & Symbol Scroll */}
        <div className="space-y-1 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-300/80">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 flex items-center gap-1 text-xs">
              <Package className="w-3.5 h-3.5 text-amber-700" />
              <span>Stock Quantity</span>
              {filters.stockValue && (
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-400 font-mono">
                  {filters.stockOperator || '>='} {filters.stockValue}
                </span>
              )}
            </label>
            {filters.stockValue && (
              <button
                onClick={handleClearStock}
                className="text-[10px] text-slate-500 hover:text-rose-600 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50 transition"
                title="Reset stock filter"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 1. Number Scroll Dropdown */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-600 block">Number (Qty)</span>
              <select
                id="stock-number-select"
                value={filters.stockValue || ''}
                onChange={(e) => handleStockValueChange(e.target.value)}
                className="w-full bg-white border border-amber-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 cursor-pointer shadow-2xs"
                title="Scroll and select number of units"
              >
                <option value="">Any / All</option>
                {filters.stockValue && !STOCK_NUMBERS.includes(filters.stockValue) && (
                  <option value={filters.stockValue}>{filters.stockValue} (custom)</option>
                )}
                {STOCK_NUMBERS.map((n) => (
                  <option key={n} value={n}>
                    {n} {n === '1' ? 'unit' : 'units'}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Symbol Scroll Dropdown (<, >, <=, >=, =) */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-600 block">Symbol</span>
              <select
                id="stock-symbol-select"
                value={filters.stockOperator || '>='}
                onChange={(e) => handleStockOperatorChange(e.target.value as StockComparisonOperator)}
                className="w-full bg-white border border-amber-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 rounded-lg px-2 py-1.5 text-xs font-bold font-mono text-slate-800 cursor-pointer shadow-2xs"
                title="Select comparison symbol: >=, >, <=, <, ="
              >
                <option value=">=">&gt;= (Above or Equal)</option>
                <option value=">">&gt; (More Than)</option>
                <option value="<=">&lt;= (Below or Equal)</option>
                <option value="<">&lt; (Less Than)</option>
                <option value="=">= (Exactly Equal)</option>
              </select>
            </div>
          </div>

          {/* Quick manual typing input */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 font-medium">Or type number:</span>
            <input
              type="number"
              min="0"
              value={filters.stockValue || ''}
              onChange={(e) => handleStockValueChange(e.target.value)}
              placeholder="e.g. 4, 5"
              className="w-24 bg-white border border-amber-200 focus:border-amber-500 rounded px-2 py-0.5 text-xs font-mono text-slate-800 text-right"
              title="Directly enter stock number"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons: Clear Filters & Fetch Data */}
      <div className="flex items-center justify-end space-x-3 pt-1 border-t border-slate-100">
        <button
          onClick={onResetFilters}
          className="text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Filters</span>
        </button>

        <button
          onClick={handleFetchData}
          disabled={isProcessing}
          className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-xs font-bold px-5 py-2 rounded-xl transition shadow-sm flex items-center space-x-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
              <span>Processing Data...</span>
            </>
          ) : (
            <>
              <Filter className="w-4 h-4 text-slate-950" />
              <span>Fetch Data</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

