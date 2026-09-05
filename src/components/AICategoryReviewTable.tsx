import React, { useState } from 'react';
import { ProcessedProductRecord, MainCategoryType, DepartmentType } from '../types';
import {
  MAIN_CATEGORIES,
  DEPARTMENTS,
  getProductTypesForDepartment,
} from '../data/categoryMaster';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Check,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react';

interface AICategoryReviewTableProps {
  products: ProcessedProductRecord[];
  onUpdateCategory: (
    productId: string,
    newMainCat: MainCategoryType,
    newDept: DepartmentType,
    newProductType: string
  ) => void;
  onApproveAllLowConfidence: () => void;
}

export const AICategoryReviewTable: React.FC<AICategoryReviewTableProps> = ({
  products,
  onUpdateCategory,
  onApproveAllLowConfidence,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMainCat, setEditMainCat] = useState<MainCategoryType>('Men');
  const [editDept, setEditDept] = useState<DepartmentType>('Top Wear');
  const [editPType, setEditPType] = useState<string>('Shirt');
  const [filterReviewOnly, setFilterReviewOnly] = useState<boolean>(false);

  const startEdit = (p: ProcessedProductRecord) => {
    setEditingId(p.id);
    setEditMainCat(p.mainCategory);
    setEditDept(p.department);
    setEditPType(p.productType);
  };

  const handleMainCatChange = (cat: MainCategoryType) => {
    setEditMainCat(cat);
    const validTypes = getProductTypesForDepartment(cat, editDept);
    setEditPType(validTypes[0] || 'Shirt');
  };

  const handleDeptChange = (dept: DepartmentType) => {
    setEditDept(dept);
    const validTypes = getProductTypesForDepartment(editMainCat, dept);
    setEditPType(validTypes[0] || 'Shirt');
  };

  const saveEdit = (id: string) => {
    onUpdateCategory(id, editMainCat, editDept, editPType);
    setEditingId(null);
  };

  const displayedProducts = filterReviewOnly
    ? products.filter((p) => p.classificationResult.status === 'Manual Review Required')
    : products;

  const reviewNeededCount = products.filter(
    (p) => p.classificationResult.status === 'Manual Review Required'
  ).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-5">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-base">
              AI Category Classification Review
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review AI category transformations or manually override any ambiguous Wondersoft mappings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setFilterReviewOnly(!filterReviewOnly)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border transition flex items-center space-x-1.5 ${
              filterReviewOnly
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {filterReviewOnly ? 'Show All Products' : `Only Review Required (${reviewNeededCount})`}
            </span>
          </button>

          {reviewNeededCount > 0 && (
            <button
              onClick={onApproveAllLowConfidence}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve All Remaining ({reviewNeededCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-200 uppercase font-mono tracking-wider text-[11px] border-b border-slate-800">
              <th className="py-3 px-3">Orig Product Group</th>
              <th className="py-3 px-3">Orig Department</th>
              <th className="py-3 px-3">Product Name</th>
              <th className="py-3 px-3">AI Main Category</th>
              <th className="py-3 px-3">AI Department</th>
              <th className="py-3 px-3">AI Product Type</th>
              <th className="py-3 px-3 text-center">Confidence</th>
              <th className="py-3 px-3 text-center">Source</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedProducts.map((p) => {
              const isEditing = editingId === p.id;
              const isLowConfidence = p.classificationResult.confidence < 0.8;
              const isReviewRequired =
                p.classificationResult.status === 'Manual Review Required';

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-amber-50/30 transition ${
                    isReviewRequired ? 'bg-amber-50/40' : ''
                  }`}
                >
                  {/* Original Wondersoft Product Group */}
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    {p.originalProductGroup}
                  </td>

                  {/* Original Wondersoft Department */}
                  <td className="py-3 px-3 font-mono text-slate-600 bg-slate-50">
                    {p.originalDepartment}
                  </td>

                  {/* Product Name */}
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {p.productName}
                  </td>

                  {/* AI Main Category */}
                  <td className="py-3 px-3">
                    {isEditing ? (
                      <select
                        value={editMainCat}
                        onChange={(e) =>
                          handleMainCatChange(e.target.value as MainCategoryType)
                        }
                        className="bg-white border border-amber-500 rounded px-2 py-1 font-semibold text-xs text-slate-900"
                      >
                        {MAIN_CATEGORIES.map((mc) => (
                          <option key={mc} value={mc}>
                            {mc}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {p.mainCategory}
                      </span>
                    )}
                  </td>

                  {/* AI Department */}
                  <td className="py-3 px-3">
                    {isEditing ? (
                      <select
                        value={editDept}
                        onChange={(e) =>
                          handleDeptChange(e.target.value as DepartmentType)
                        }
                        className="bg-white border border-amber-500 rounded px-2 py-1 font-semibold text-xs text-amber-900"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold text-amber-900 bg-amber-100/60 px-2.5 py-0.5 rounded border border-amber-200">
                        {p.department}
                      </span>
                    )}
                  </td>

                  {/* AI Product Type */}
                  <td className="py-3 px-3">
                    {isEditing ? (
                      <select
                        value={editPType}
                        onChange={(e) => setEditPType(e.target.value)}
                        className="bg-white border border-amber-500 rounded px-2 py-1 font-semibold text-xs text-slate-900"
                      >
                        {getProductTypesForDepartment(editMainCat, editDept).map(
                          (pt) => (
                            <option key={pt} value={pt}>
                              {pt}
                            </option>
                          )
                        )}
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">{p.productType}</span>
                    )}
                  </td>

                  {/* Confidence Badge */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        p.classificationResult.confidence >= 0.85
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.classificationResult.confidence >= 0.7
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {Math.round(p.classificationResult.confidence * 100)}%
                    </span>
                  </td>

                  {/* Classification Source */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase font-mono ${
                        p.classificationResult.source === 'RULE'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : p.classificationResult.source === 'MANUAL'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {p.classificationResult.source}
                    </span>
                  </td>

                  {/* Review Status */}
                  <td className="py-3 px-3 text-center">
                    {p.classificationResult.status === 'Approved' ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Approved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-bold text-[11px]">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Review Required</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    {isEditing ? (
                      <button
                        onClick={() => saveEdit(p.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-2.5 py-1 rounded shadow-sm transition flex items-center space-x-1 ml-auto"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(p)}
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded border border-amber-200 font-medium text-xs transition flex items-center space-x-1 ml-auto"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Correct</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
