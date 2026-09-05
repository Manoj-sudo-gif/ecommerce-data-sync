import React from 'react';
import { ProcessedProductRecord } from '../types';
import { Image, Layers, CheckCircle2, FileSpreadsheet, Download, Info } from 'lucide-react';

interface ImageMappingViewProps {
  products: ProcessedProductRecord[];
  variantMap: Record<string, string>;
  onExportImageTeam: () => void;
}

export const ImageMappingView: React.FC<ImageMappingViewProps> = ({
  products,
  variantMap,
  onExportImageTeam,
}) => {
  // Group products by variant (Brand + Colour + Toon Label)
  const variantGroups: Record<
    string,
    {
      sSizeEan: string;
      brand: string;
      colour: string;
      styleNo: string;
      toonLabel: string;
      skus: ProcessedProductRecord[];
    }
  > = {};

  products.forEach((p) => {
    const toon = p.toonLabel || p.styleNo || 'DEFAULT';
    const key = `${p.brand.toUpperCase()}|${p.colour.toUpperCase()}|${toon.toUpperCase()}`;
    if (!variantGroups[key]) {
      variantGroups[key] = {
        sSizeEan: variantMap[key] || p.ean,
        brand: p.brand,
        colour: p.colour,
        styleNo: p.styleNo,
        toonLabel: toon,
        skus: [],
      };
    }
    variantGroups[key].skus.push(p);
  });

  const variantList = Object.values(variantGroups);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header & Logic Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Image className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-base">
              Automatic S-Size Image Mapping Engine
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mandatory Business Rule: Product photos are uploaded ONLY for S-size EAN. All other sizes (M, L, XL, etc.) dynamically point to the S-size image path.
          </p>
        </div>

        <button
          onClick={onExportImageTeam}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Download Image Team Excel ({variantList.length} Unique Toon Labels)</span>
        </button>
      </div>

      {/* Logic Card */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
        <div className="flex items-center space-x-2 font-semibold text-amber-900">
          <Info className="w-4 h-4 text-amber-600" />
          <span>How S-Size Image Resolution Works:</span>
        </div>
        <p className="text-amber-800 leading-relaxed">
          1. System builds variant index key: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Brand | Colour | Toon Label</code><br />
          2. Locates the EAN where <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Size = 'S'</code> (e.g. EAN 6005)<br />
          3. Generates primary image path: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">images/6005.jpg</code><br />
          4. Maps <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">images/6005.jpg</code> onto all sibling sizes (M, L, XL, XXL) of that variant group.
        </p>
      </div>

      {/* Variant Cards & Image Path Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variantList.map((vg, idx) => {
          const imagePath = `images/${vg.sSizeEan}.jpg`;

          return (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs hover:border-amber-300 transition"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {vg.brand} • {vg.colour}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Toon Label: <span className="font-mono font-medium text-slate-700">{vg.toonLabel}</span>
                  </p>
                </div>

                <div className="bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5">
                  <Image className="w-3.5 h-3.5 text-amber-700" />
                  <span>{imagePath}</span>
                </div>
              </div>

              {/* SKU Sizes List */}
              <div className="space-y-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Mapped SKUs across sizes:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  {vg.skus.map((sku) => {
                    const isS = sku.size.toUpperCase() === 'S';
                    return (
                      <div
                        key={sku.id}
                        className={`p-2 rounded-lg border text-center ${
                          isS
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-sans font-semibold opacity-80">
                          Size {sku.size} {isS ? '(S-Master)' : ''}
                        </div>
                        <div className="text-xs font-bold mt-0.5">EAN {sku.ean}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
