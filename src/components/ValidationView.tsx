import React from 'react';
import { ValidationIssue } from '../types';
import { AlertTriangle, Download, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface ValidationViewProps {
  validationIssues: ValidationIssue[];
  onExportErrorReport: () => void;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  validationIssues,
  onExportErrorReport,
}) => {
  const errors = validationIssues.filter((i) => i.issueType === 'ERROR');
  const warnings = validationIssues.filter((i) => i.issueType === 'WARNING');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-800 text-base">
              Validation & Data Quality Engine
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit report flagging missing EANs, store MRP discrepancies, image mapping warnings, and AI review requirements.
          </p>
        </div>

        {validationIssues.length > 0 && (
          <button
            onClick={onExportErrorReport}
            className="bg-rose-900 hover:bg-rose-800 text-rose-100 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Download Error Report Excel ({validationIssues.length} Issues)</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 bg-slate-200 text-slate-700 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Flagged Items</p>
            <p className="text-lg font-bold text-slate-800">{validationIssues.length}</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-rose-600">Critical Errors</p>
            <p className="text-lg font-bold text-rose-900">{errors.length}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-amber-700">Warnings / Reviews</p>
            <p className="text-lg font-bold text-amber-900">{warnings.length}</p>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      {validationIssues.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center text-emerald-800 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-base">All Data Clean & Validated!</h4>
          <p className="text-xs text-emerald-700">
            No missing EANs, store MRP conflicts, or image mapping failures detected.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-200 uppercase font-mono tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Row / EAN ID</th>
                <th className="py-3 px-3">EAN Code</th>
                <th className="py-3 px-3">Product Description</th>
                <th className="py-3 px-3">Details / Resolution Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {validationIssues.map((issue) => (
                <tr
                  key={issue.id}
                  className={issue.issueType === 'ERROR' ? 'bg-rose-50/40' : 'bg-amber-50/30'}
                >
                  <td className="py-3 px-3">
                    <span
                      className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase ${
                        issue.issueType === 'ERROR'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {issue.issueType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 font-mono">
                    {issue.rowId}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {issue.ean}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {issue.productInfo}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {issue.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
