import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Download,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  ShoppingBag,
  Store,
  ChevronDown,
  CheckCircle2,
  Database,
  ExternalLink,
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
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      {/* Tier 1: Main Brand Bar & Primary Action Center */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl shadow-md font-bold shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Data Sync Software
                </h1>
                <span className="bg-amber-500/15 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wide">
                  GM Fashion
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Wondersoft Data Normalization • 7-Store Aggregation • S-Size Image Engine
              </p>
            </div>
          </div>

          {/* Action Center */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Process Data Action (Prominent CTA) */}
            {rawCount > 0 && (
              <button
                onClick={onProcessData}
                disabled={isProcessing}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Process Data</span>
              </button>
            )}

            {/* Consolidated Export Dropdown & Quick Actions */}
            {processedCount > 0 && (
              <div className="relative" ref={exportDropdownRef}>
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg border border-slate-700/80 hover:border-slate-600 transition flex items-center space-x-2 shadow-sm"
                  title="Export reports and spreadsheets"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Excel</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isExportMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                      Download Excel Workbooks
                    </div>

                    <button
                      onClick={() => {
                        onExportEcommerce();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/70 transition flex items-start space-x-3 group"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 mt-0.5">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white group-hover:text-emerald-300">
                          E-Commerce Master Catalog
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          EAN, Toon Label, pricing, stock & 4 image URLs
                        </div>
                      </div>
                    </button>

                    {onExportStoreInventory && (
                      <button
                        onClick={() => {
                          onExportStoreInventory();
                          setIsExportMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/70 transition flex items-start space-x-3 group"
                      >
                        <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/20 mt-0.5">
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white group-hover:text-teal-300">
                            Store Inventory Breakdown
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Individual 7-store stock matrix
                          </div>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onExportImageTeam();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-700/70 transition flex items-start space-x-3 group"
                    >
                      <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white group-hover:text-indigo-300">
                          Image Team Excel
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Toon labels, sizes & 4 image angle URLs
                        </div>
                      </div>
                    </button>

                    {errorCount > 0 && (
                      <>
                        <div className="my-1 border-t border-slate-700/60" />
                        <button
                          onClick={() => {
                            onExportErrorReport();
                            setIsExportMenuOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-rose-950/40 transition flex items-center space-x-3 group"
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-rose-300">
                              Validation Error Report ({errorCount})
                            </span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Clear Session / Reset */}
            {showClearConfirm ? (
              <div className="flex items-center space-x-1.5 bg-rose-950/80 border border-rose-700 px-2 py-1 rounded-lg">
                <span className="text-[11px] text-rose-200">Reset all?</span>
                <button
                  onClick={() => {
                    onClearSession();
                    setShowClearConfirm(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded transition"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-slate-400 hover:text-white text-[11px] px-1 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 p-2 rounded-lg border border-slate-800 hover:border-rose-900/60 transition"
                title="Reset session and upload fresh files"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tier 2: Sleek Live Data Pipeline Status Strip */}
      <div className="bg-slate-950/50 border-t border-slate-800/70 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
          {/* Metric Indicators */}
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1 text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Raw Records:</span>
              <strong className="text-white font-mono">
                {rawCount > 0 ? rawCount.toLocaleString() : '0'}
              </strong>
            </div>

            <div className="hidden sm:block text-slate-700">•</div>

            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aggregated SKUs:</span>
              <strong className="text-emerald-400 font-mono">
                {processedCount > 0 ? processedCount.toLocaleString() : '0'}
              </strong>
            </div>

            <div className="hidden sm:block text-slate-700">•</div>

            <div className="flex items-center space-x-1.5">
              {reviewRequiredCount > 0 ? (
                <span className="flex items-center space-x-1 text-amber-300 font-medium">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>AI Review:</span>
                  <strong className="font-mono underline decoration-amber-500/50">
                    {reviewRequiredCount.toLocaleString()} pending
                  </strong>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-slate-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>AI Categories:</span>
                  <span className="text-emerald-400 font-medium">Verified</span>
                </span>
              )}
            </div>

            <div className="hidden sm:block text-slate-700">•</div>

            <div className="flex items-center space-x-1.5">
              {errorCount > 0 ? (
                <button
                  onClick={onExportErrorReport}
                  className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 transition"
                  title="Click to download error report"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Issues:</span>
                  <strong className="font-mono underline">{errorCount.toLocaleString()}</strong>
                </button>
              ) : (
                <span className="flex items-center space-x-1 text-slate-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Data Quality:</span>
                  <span className="text-slate-300">Clean</span>
                </span>
              )}
            </div>
          </div>

          {/* Direct Fast-Action Excel Badges (Right side of strip when processed) */}
          {processedCount > 0 && (
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-500 hidden md:inline">Quick download:</span>
              <button
                onClick={onExportEcommerce}
                className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center space-x-1 transition"
                title="Download E-Commerce Master"
              >
                <span>E-Commerce</span>
              </button>
              <span className="text-slate-700">|</span>
              {onExportStoreInventory && (
                <>
                  <button
                    onClick={onExportStoreInventory}
                    className="text-teal-400 hover:text-teal-300 hover:underline flex items-center space-x-1 transition"
                    title="Download Store Inventory"
                  >
                    <span>Store Inventory</span>
                  </button>
                  <span className="text-slate-700">|</span>
                </>
              )}
              <button
                onClick={onExportImageTeam}
                className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-1 transition"
                title="Download Image Team Excel"
              >
                <span>Image Team</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
