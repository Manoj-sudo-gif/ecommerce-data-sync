import React from 'react';
import { PricingRulesConfig, ColumnMappingConfig } from '../types';
import { Settings, Save, RotateCcw, DollarSign, Sliders } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricingConfig: PricingRulesConfig;
  onSavePricingConfig: (config: PricingRulesConfig) => void;
  columnMapping: ColumnMappingConfig;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  pricingConfig,
  onSavePricingConfig,
  columnMapping,
}) => {
  const [costPriceEnabled, setCostPriceEnabled] = React.useState(pricingConfig.enableCostPriceCalc);
  const [costPricePct, setCostPricePct] = React.useState(pricingConfig.costPricePercentage);
  const [discountEnabled, setDiscountEnabled] = React.useState(pricingConfig.enableDiscountCalc);
  const [discountPct, setDiscountPct] = React.useState(pricingConfig.discountPercentage);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePricingConfig({
      enableCostPriceCalc: costPriceEnabled,
      costPricePercentage: costPricePct,
      enableDiscountCalc: discountEnabled,
      discountPercentage: discountPct,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden space-y-5 p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-base">
              Pricing Rules & Transformation Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Pricing Formulas Module */}
        <div className="space-y-4 text-xs">
          <h4 className="font-semibold text-slate-800 text-sm flex items-center space-x-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Pricing Rules Module</span>
          </h4>
          <p className="text-slate-500">
            By default, Cost Price and Discount remain blank unless explicitly calculated here according to your company pricing rules.
          </p>

          {/* Cost Price Calculation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={costPriceEnabled}
                onChange={(e) => setCostPriceEnabled(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="font-semibold text-slate-800">
                Calculate Cost Price automatically from MRP / Selling Price
              </span>
            </label>

            {costPriceEnabled && (
              <div className="flex items-center space-x-3 pt-1 pl-6">
                <span className="text-slate-600">Cost Price =</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={costPricePct}
                  onChange={(e) => setCostPricePct(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-white border border-slate-300 rounded px-2 py-1 font-mono text-center font-bold"
                />
                <span className="text-slate-600">% of Selling Price (MRP)</span>
              </div>
            )}
          </div>

          {/* Discount Calculation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={discountEnabled}
                onChange={(e) => setDiscountEnabled(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="font-semibold text-slate-800">
                Apply Default Discount Rate
              </span>
            </label>

            {discountEnabled && (
              <div className="flex items-center space-x-3 pt-1 pl-6">
                <span className="text-slate-600">Default Discount =</span>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-white border border-slate-300 rounded px-2 py-1 font-mono text-center font-bold"
                />
                <span className="text-slate-600">% off MRP</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Rules</span>
          </button>
        </div>
      </div>
    </div>
  );
};
