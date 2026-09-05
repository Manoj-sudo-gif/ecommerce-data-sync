import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Check,
  X,
  Database,
  Layers,
  Play,
  Loader2,
} from 'lucide-react';
import { WondersoftRawRecord, EcommerceFileInfo, ColumnMappingConfig } from '../types';

interface UploadPanelProps {
  onFileUpload: (file: File) => void;
  onEcommerceFileUpload: (file: File) => void;
  rawRecords: WondersoftRawRecord[];
  ecommerceFileInfo: EcommerceFileInfo | null;
  columnMapping: ColumnMappingConfig;
  onUpdateColumnMapping: (newMapping: ColumnMappingConfig) => void;
  onProcessData: () => void;
  isProcessing: boolean;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  onFileUpload,
  onEcommerceFileUpload,
  rawRecords,
  ecommerceFileInfo,
  columnMapping,
  onUpdateColumnMapping,
  onProcessData,
  isProcessing,
}) => {
  const wondersoftInputRef = useRef<HTMLInputElement>(null);
  const ecommerceInputRef = useRef<HTMLInputElement>(null);

  const [isEditingMapping, setIsEditingMapping] = useState<boolean>(false);
  const [editableMapping, setEditableMapping] = useState<Array<{ source: string; target: string }>>([]);
  const [newSourceField, setNewSourceField] = useState<string>('');
  const [newTargetField, setNewTargetField] = useState<string>('');

  // Handle Wondersoft ERP upload
  const handleWondersoftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleWondersoftDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle E-Commerce Template upload
  const handleEcommerceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onEcommerceFileUpload(e.target.files[0]);
    }
  };

  const handleEcommerceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onEcommerceFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Open Edit Mapping Drawer/Modal
  const openEditModal = () => {
    const mappingArray = Object.entries(columnMapping).map(([source, target]) => ({
      source,
      target,
    }));
    setEditableMapping(mappingArray);
    setIsEditingMapping(true);
  };

  // Save Mapping
  const handleSaveMapping = () => {
    const updatedObj: ColumnMappingConfig = {};
    editableMapping.forEach((item) => {
      if (item.source.trim() && item.target.trim()) {
        updatedObj[item.source.trim()] = item.target.trim();
      }
    });
    onUpdateColumnMapping(updatedObj);
    setIsEditingMapping(false);
  };

  // Add a new custom column field
  const handleAddNewColumn = () => {
    if (!newSourceField.trim() || !newTargetField.trim()) return;
    setEditableMapping((prev) => [
      ...prev,
      { source: newSourceField.trim(), target: newTargetField.trim() },
    ]);
    setNewSourceField('');
    setNewTargetField('');
  };

  const handleRemoveField = (index: number) => {
    setEditableMapping((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Enterprise Capacity Badge */}
      <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 border border-slate-800">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-100">
            Enterprise Engine Capacity: Optimized for 100,000+ (1 Lakh) Rows Processing
          </span>
        </div>
        <span className="bg-amber-500/20 text-amber-300 font-mono text-[11px] px-2.5 py-0.5 rounded-md border border-amber-500/30">
          Fast Stream Processing • Zero-Crash Memory Pipeline
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field 1: Upload Wondersoft Export File */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500 text-slate-950 font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-xs">
              1
            </span>
            <h3 className="font-semibold text-slate-800 text-base">
              Upload Wondersoft File
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Select or drag & drop Wondersoft ERP Inventory Export file (.csv, .xlsx, .xls).
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleWondersoftDrop}
            onClick={() => wondersoftInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/70 hover:bg-amber-50/30 rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 group min-h-[140px]"
          >
            <input
              type="file"
              ref={wondersoftInputRef}
              onChange={handleWondersoftChange}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />
            <div className="p-2.5 bg-white group-hover:bg-amber-100 rounded-full shadow-xs text-slate-600 group-hover:text-amber-700 transition">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 group-hover:text-amber-800">
                Click to browse or drop Wondersoft file
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports CSV, XLSX, XLS up to 1,00,000 rows</p>
            </div>
          </div>

          {rawRecords.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs flex items-center justify-between space-x-2 text-emerald-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium">
                  Wondersoft File Loaded: <strong>{rawRecords.length}</strong> records ready
                </span>
              </div>
              <button
                onClick={onProcessData}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-xs flex items-center space-x-1 disabled:opacity-50 flex-shrink-0"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Process Data</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Field 2: Upload E-Commerce File */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="bg-slate-800 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-xs">
              2
            </span>
            <h3 className="font-semibold text-slate-800 text-base">
              Upload E-Commerce File
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Upload your E-Commerce master catalog or template file (.csv, .xlsx, .xls).
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleEcommerceDrop}
            onClick={() => ecommerceInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/30 rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 group min-h-[140px]"
          >
            <input
              type="file"
              ref={ecommerceInputRef}
              onChange={handleEcommerceChange}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />
            <div className="p-2.5 bg-white group-hover:bg-indigo-100 rounded-full shadow-xs text-slate-600 group-hover:text-indigo-700 transition">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 group-hover:text-indigo-800">
                Click to browse or drop E-Commerce file
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Master catalog / Target column layout template</p>
            </div>
          </div>

          {ecommerceFileInfo && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-xs flex items-center space-x-2 text-indigo-900">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-semibold">{ecommerceFileInfo.fileName}</span> (
                {ecommerceFileInfo.headers.length} columns detected)
              </div>
            </div>
          )}
        </div>

        {/* Field 3: E-Commerce Field Mapping Layer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="bg-slate-800 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-xs">
                3
              </span>
              <h3 className="font-semibold text-slate-800 text-base">
                E-Commerce Field Mapping
              </h3>
            </div>

            {/* EDIT Button */}
            <button
              onClick={openEditModal}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>Edit Mappings</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Wondersoft fields mapped to standardized E-Commerce target columns.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 max-h-48 overflow-y-auto">
            <div className="flex justify-between text-slate-400 font-medium pb-1 border-b border-slate-200">
              <span>Wondersoft Source</span>
              <span>E-Commerce Target</span>
            </div>
            <div className="space-y-1.5 text-slate-700 font-mono text-[11px]">
              {Object.entries(columnMapping).map(([source, target]) => (
                <div key={source} className="flex justify-between items-center">
                  <span className="text-slate-600 font-sans">{source}</span>
                  <span className="text-amber-700 font-semibold font-sans">→ {target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT FIELD MAPPING MODAL */}
      {isEditingMapping && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  E-Commerce Column Mapping Layer Editor
                </h3>
              </div>
              <button
                onClick={() => setIsEditingMapping(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Customize E-Commerce column target names or add new column fields to match your company's E-Commerce export format.
            </p>

            {/* Mapping List Table */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 pb-1 border-b border-slate-100">
                <span className="col-span-5">Wondersoft Source Field</span>
                <span className="col-span-6">E-Commerce Target Column Name</span>
                <span className="col-span-1 text-center">Action</span>
              </div>

              {editableMapping.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <input
                    type="text"
                    value={item.source}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditableMapping((prev) =>
                        prev.map((m, i) => (i === idx ? { ...m, source: val } : m))
                      );
                    }}
                    placeholder="Source field name"
                    className="col-span-5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-medium text-slate-700"
                  />
                  <input
                    type="text"
                    value={item.target}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditableMapping((prev) =>
                        prev.map((m, i) => (i === idx ? { ...m, target: val } : m))
                      );
                    }}
                    placeholder="E-commerce target column name"
                    className="col-span-6 bg-white border border-amber-300 rounded px-2.5 py-1.5 font-semibold text-slate-900 focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => handleRemoveField(idx)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Remove field mapping"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Column Field Input Block */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-amber-900 flex items-center space-x-1">
                <Plus className="w-3.5 h-3.5 text-amber-700" />
                <span>Add New Column Field</span>
              </p>
              <div className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="e.g. HSN Code / Fit / Tag"
                  value={newSourceField}
                  onChange={(e) => setNewSourceField(e.target.value)}
                  className="col-span-5 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Target Column Name (e.g. HSN_Code)"
                  value={newTargetField}
                  onChange={(e) => setNewTargetField(e.target.value)}
                  className="col-span-5 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
                <button
                  onClick={handleAddNewColumn}
                  disabled={!newSourceField.trim() || !newTargetField.trim()}
                  className="col-span-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-1.5 px-2 rounded-lg transition disabled:opacity-50"
                >
                  Add Field
                </button>
              </div>
            </div>

            {/* Save / Cancel buttons */}
            <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setIsEditingMapping(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMapping}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Mapping Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
