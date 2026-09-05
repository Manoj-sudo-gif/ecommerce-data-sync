import React from 'react';
import {
  Upload,
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  ShoppingBag,
  Store,
} from 'lucide-react';

interface HeaderProps {
  rawCount: number;
  processedCount: number;
  reviewRequiredCount: number;
  errorCount: number;
  onClearSession: () => void;
  onProcessData: () => void;
  onExportEcommerce: () => void;
  onExportStoreInventory?: () => void;
  onExportImageTeam: () => void;
  onExportErrorReport: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  rawCount,
  processedCount,
  reviewRequiredCount,
  errorCount,
  onClearSession,
  onProcessData,
  onExportEcommerce,
  onExportStoreInventory,
  onExportImageTeam,
  onExportErrorReport,
  isProcessing,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Brand & App Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-inner text-slate-950 font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">GM FASHION</h1>
                <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Data Sync & AI Mapping
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Wondersoft Data Normalization • 7-Store Aggregation • S-Size Image Engine
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="text-slate-400">Raw Records:</span>
              <span className="font-semibold text-white">{rawCount}</span>
            </div>

            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="text-slate-400">Aggregated SKUs:</span>
              <span className="font-semibold text-emerald-400">{processedCount}</span>
            </div>

            {reviewRequiredCount > 0 ? (
              <div className="bg-amber-950/60 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-700/50 flex items-center space-x-2 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>AI Review Needed:</span>
                <span className="font-bold">{reviewRequiredCount}</span>
              </div>
            ) : (
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2">
                <span className="text-slate-400">AI Approved:</span>
                <span className="font-semibold text-emerald-400">100%</span>
              </div>
            )}

            {errorCount > 0 && (
              <div className="bg-rose-950/60 text-rose-300 px-3 py-1.5 rounded-lg border border-rose-800/60 flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Issues:</span>
                <span className="font-bold">{errorCount}</span>
              </div>
            )}
          </div>

          {/* Global Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {rawCount > 0 && (
              <button
                onClick={onProcessData}
                disabled={isProcessing}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Process Data</span>
              </button>
            )}

            {processedCount > 0 && (
              <>
                <button
                  onClick={onExportEcommerce}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
                  title="Download GM_Fashion_Ecommerce_Products.xlsx with individual store counts"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>E-Commerce Excel</span>
                </button>

                {onExportStoreInventory && (
                  <button
                    onClick={onExportStoreInventory}
                    className="bg-teal-700 hover:bg-teal-600 text-white font-medium text-xs px-3 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
                    title="Download GM_Fashion_Store_Inventory.xlsx with store-by-store breakdown"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Store Inventory Excel</span>
                  </button>
                )}

                <button
                  onClick={onExportImageTeam}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
                  title="Download GM_Fashion_Image_Team.xlsx"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Image Team Excel</span>
                </button>
              </>
            )}

            {errorCount > 0 && (
              <button
                onClick={onExportErrorReport}
                className="bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-medium px-3 py-2 rounded-lg border border-rose-700/60 transition flex items-center space-x-1"
                title="Download Error & Validation Report"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                <span>Error Log</span>
              </button>
            )}

            <button
              onClick={onClearSession}
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-rose-100 border border-rose-800/80 text-xs px-3 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-sm font-medium"
              title="Completely wipe temporary uploaded data and reset session"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Session</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
