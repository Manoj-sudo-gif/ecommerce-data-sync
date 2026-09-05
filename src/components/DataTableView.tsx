import React, { useState } from 'react';
import { ProcessedProductRecord } from '../types';
import { Image, Layers, Sparkles, AlertCircle, ChevronDown, ChevronRight, Store } from 'lucide-react';

interface DataTableViewProps {
  products: ProcessedProductRecord[];
}

export const DataTableView: React.FC<DataTableViewProps> = ({ products }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
        <Layers className="w-12 h-12 text-slate-300 mx-auto" />
        <h4 className="text-base font-semibold text-slate-700">No products match current filters</h4>
        <p className="text-xs text-slate-400">
          Try adjusting your EAN Series, Department, or Colour filters above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-200 uppercase font-mono tracking-wider text-[11px] border-b border-slate-800">
              <th className="py-3 px-3 w-8"></th>
              <th className="py-3 px-3">Main Category</th>
              <th className="py-3 px-3">Department</th>
              <th className="py-3 px-3">Product Type</th>
              <th className="py-3 px-3">Product Name</th>
              <th className="py-3 px-3">Brand</th>
              <th className="py-3 px-3">Colour</th>
              <th className="py-3 px-3">Size</th>
              <th className="py-3 px-3">Fabric</th>
              <th className="py-3 px-3">EAN</th>
              <th className="py-3 px-3 text-right">MRP (₹)</th>
              <th className="py-3 px-3 text-center">Agg. Stock</th>
              <th className="py-3 px-3">Image Path</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {products.map((p) => {
              const isExpanded = expandedRowId === p.id;
              const isSSize = p.size.toUpperCase() === 'S';

              return (
                <React.Fragment key={p.id}>
                  <tr
                    onClick={() => toggleRow(p.id)}
                    className={`hover:bg-amber-50/40 cursor-pointer transition ${
                      isExpanded ? 'bg-amber-50/60' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-amber-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </td>

                    {/* Main Category */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {p.mainCategory}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3">
                      <span className="font-medium text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
                        {p.department}
                      </span>
                    </td>

                    {/* Product Type */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">
                        {p.productType}
                      </span>
                    </td>

                    {/* Product Name */}
                    <td className="py-3 px-3 font-medium text-slate-900 max-w-[160px] truncate" title={p.productName}>
                      {p.productName}
                    </td>

                    {/* Brand */}
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {p.brand}
                    </td>

                    {/* Colour */}
                    <td className="py-3 px-3 text-slate-700">
                      {p.colour}
                    </td>

                    {/* Size */}
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          isSSize
                            ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {p.size}
                      </span>
                    </td>

                    {/* Fabric */}
                    <td className="py-3 px-3 text-slate-600">
                      {p.fabric}
                    </td>

                    {/* EAN */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 tracking-tight">
                      {p.ean}
                    </td>

                    {/* MRP */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      ₹{p.sellingPrice}
                    </td>

                    {/* Aggregated Stock & Individual Store Count */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 text-xs">
                          {p.stockQuantity} <span className="text-[10px] font-normal text-emerald-700">units</span>
                        </span>
                        <span
                          className="text-[10px] font-semibold text-slate-600 mt-1 inline-flex items-center gap-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 px-2 py-0.5 rounded border border-slate-200 transition"
                          title={p.storeBreakdownSummary || p.storeBreakdown?.map((s) => `${s.store}: ${s.stock} units`).join(' | ')}
                        >
                          <Store className="w-2.5 h-2.5 text-amber-600 flex-shrink-0" />
                          <span>{p.storeCount} stores</span>
                        </span>
                      </div>
                    </td>

                    {/* Image Path */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-600">
                        <Image className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {p.imagePath}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Individual Store Breakdown Drawer */}
                  {isExpanded && (
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <td colSpan={13} className="p-4">
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-inner space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center space-x-2">
                              <Store className="w-4 h-4 text-amber-600" />
                              <h5 className="font-semibold text-slate-800 text-xs">
                                Individual Store Stock for EAN {p.ean} ({p.brand} {p.colour} {p.size})
                              </h5>
                              <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">
                                {p.stockQuantity} Total Units • {p.storeCount} Stores
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">
                              Toon Label: <strong className="text-slate-800">{p.toonLabel || p.styleNo}</strong> | S-Size Ref EAN: <strong className="text-amber-700">{p.imagePath.replace('images/', '').replace('.jpg', '')}</strong>
                            </span>
                          </div>

                          {/* Quick Store Breakdown Summary Line */}
                          {p.storeBreakdownSummary && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-700 flex items-center justify-between">
                              <span className="text-slate-500 font-sans text-xs font-medium">Store Counts:</span>
                              <span className="font-semibold text-slate-900">{p.storeBreakdownSummary}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2 text-xs">
                            {p.storeBreakdown?.map((st, i) => (
                              <div
                                key={i}
                                className={`rounded-lg p-2.5 text-center space-y-1 transition ${
                                  st.stock > 0
                                    ? 'bg-emerald-50/70 border border-emerald-200 shadow-2xs'
                                    : 'bg-slate-50 border border-slate-200 opacity-60'
                                }`}
                              >
                                <p className="text-[11px] font-medium text-slate-700 truncate" title={st.store}>
                                  {st.store}
                                </p>
                                <p className={`text-base font-bold ${st.stock > 0 ? 'text-emerald-800' : 'text-slate-400'}`}>
                                  {st.stock} <span className="text-[10px] text-slate-400 font-normal">units</span>
                                </p>
                                {st.mrp > 0 && (
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    ₹{st.mrp}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                            <div>
                              Original Wondersoft Dept:{' '}
                              <span className="font-semibold text-slate-700">{p.originalDepartment}</span>
                            </div>
                            <div>
                              AI Classification Reasoning:{' '}
                              <span className="italic text-slate-600">{p.classificationResult.reasoning || 'Rule Match'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
