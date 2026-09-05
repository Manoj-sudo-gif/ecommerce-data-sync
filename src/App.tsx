import React, { useState } from 'react';
import { Header } from './components/Header';
import { UploadPanel } from './components/UploadPanel';
import { BatchEanFetcher } from './components/BatchEanFetcher';
import { FilterBar } from './components/FilterBar';
import { DataTableView } from './components/DataTableView';
import { AICategoryReviewTable } from './components/AICategoryReviewTable';
import { ImageMappingView } from './components/ImageMappingView';
import { ValidationView } from './components/ValidationView';
import { ConfigModal } from './components/ConfigModal';

import {
  WondersoftRawRecord,
  ProcessedProductRecord,
  ValidationIssue,
  FilterState,
  PricingRulesConfig,
  ColumnMappingConfig,
  EcommerceFileInfo,
  MainCategoryType,
  DepartmentType,
} from './types';
import { parseUploadedFile, parseEcommerceTemplateFile } from './utils/fileParser';
import {
  processWondersoftPipeline,
  applyProductFilters,
  DEFAULT_COLUMN_MAPPING,
} from './utils/dataPipeline';
import {
  exportEcommerceExcel,
  exportStoreInventoryExcel,
  exportImageTeamExcel,
  exportErrorReportExcel,
} from './utils/excelExporter';
import { SAMPLE_WONDERSOFT_RECORDS } from './utils/sampleData';

import {
  LayoutDashboard,
  Table,
  Sparkles,
  Image as ImageIcon,
  AlertTriangle,
  Settings,
  Barcode,
} from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  eanSeries: '',
  department: '',
  productType: '',
  productName: '',
  brand: '',
  colour: '',
  ean: '',
  size: '',
  minStock: '',
  stockValue: '',
  stockOperator: '>=',
  maxStock: '',
  reviewStatus: 'ALL',
  batchEanInput: '',
};

const INITIAL_PRICING_CONFIG: PricingRulesConfig = {
  enableCostPriceCalc: false,
  costPricePercentage: 60,
  enableDiscountCalc: false,
  discountPercentage: 0,
};

export function App() {
  const [rawRecords, setRawRecords] = useState<WondersoftRawRecord[]>([]);
  const [processedProducts, setProcessedProducts] = useState<ProcessedProductRecord[]>([]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [variantMap, setVariantMap] = useState<Record<string, string>>({});

  const [ecommerceFileInfo, setEcommerceFileInfo] = useState<EcommerceFileInfo | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig>(DEFAULT_COLUMN_MAPPING);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [pricingConfig, setPricingConfig] = useState<PricingRulesConfig>(INITIAL_PRICING_CONFIG);

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'table' | 'ai-review' | 'image-mapping' | 'validation' | 'batch-ean'
  >('dashboard');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // Auto-process raw records when loaded
  const runPipeline = async (
    records = rawRecords,
    cMapping = columnMapping,
    pConfig = pricingConfig
  ) => {
    if (!records || records.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await processWondersoftPipeline(records, cMapping, pConfig);
      setProcessedProducts(result.processedProducts);
      setValidationIssues(result.validationIssues);
      setVariantMap(result.variantMap);
    } catch (err) {
      console.error('Pipeline processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch & process data on demand
  const handleFetchAndProcessData = async () => {
    let currentRaw = rawRecords;
    if (currentRaw.length === 0) {
      currentRaw = SAMPLE_WONDERSOFT_RECORDS;
      setRawRecords(SAMPLE_WONDERSOFT_RECORDS);
    }

    await runPipeline(currentRaw, columnMapping, pricingConfig);
    setActiveTab('table');
  };

  // Handle Wondersoft ERP upload
  const handleFileUpload = async (file: File) => {
    try {
      const records = await parseUploadedFile(file);
      setRawRecords(records);
    } catch (err) {
      alert('Failed to parse Wondersoft ERP file. Please ensure it is a valid CSV or Excel file.');
    }
  };

  // Handle E-Commerce Master / Template upload
  const handleEcommerceFileUpload = async (file: File) => {
    try {
      const { info } = await parseEcommerceTemplateFile(file);
      setEcommerceFileInfo(info);
    } catch (err) {
      alert('Failed to parse E-Commerce template file.');
    }
  };

  const handleUpdateColumnMapping = (newMapping: ColumnMappingConfig) => {
    setColumnMapping(newMapping);
  };

  // Complete session reset & data wipe
  const handleClearSession = () => {
    setRawRecords([]);
    setProcessedProducts([]);
    setValidationIssues([]);
    setVariantMap({});
    setEcommerceFileInfo(null);
    setFilters(INITIAL_FILTERS);
    setActiveTab('dashboard');
  };

  const handleCategoryUpdate = (
    productId: string,
    newMainCat: MainCategoryType,
    newDept: DepartmentType,
    newProductType: string
  ) => {
    setProcessedProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            mainCategory: newMainCat,
            department: newDept,
            productType: newProductType,
            classificationResult: {
              ...p.classificationResult,
              mainCategory: newMainCat,
              department: newDept,
              productType: newProductType,
              source: 'MANUAL',
              status: 'Approved',
              confidence: 1.0,
              reasoning: 'Manually verified and updated by user in AI Review Table.',
            },
          };
        }
        return p;
      })
    );
  };

  const handleApproveAllLowConfidence = () => {
    setProcessedProducts((prev) =>
      prev.map((p) => ({
        ...p,
        classificationResult: {
          ...p.classificationResult,
          status: 'Approved',
        },
      }))
    );
  };

  const filteredProducts = applyProductFilters(processedProducts, filters);

  const reviewNeededCount = processedProducts.filter(
    (p) => p.classificationResult.status === 'Manual Review Required'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-amber-200">
      {/* Top Application Bar */}
      <Header
        rawCount={rawRecords.length}
        processedCount={processedProducts.length}
        reviewRequiredCount={reviewNeededCount}
        errorCount={validationIssues.length}
        onClearSession={handleClearSession}
        onProcessData={() => runPipeline(rawRecords, columnMapping, pricingConfig)}
        onExportEcommerce={() => exportEcommerceExcel(filteredProducts)}
        onExportStoreInventory={() => exportStoreInventoryExcel(filteredProducts)}
        onExportImageTeam={() => exportImageTeamExcel(filteredProducts)}
        onExportErrorReport={() => exportErrorReportExcel(validationIssues)}
        isProcessing={isProcessing}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Upload & Setup Header Section */}
        <UploadPanel
          onFileUpload={handleFileUpload}
          onEcommerceFileUpload={handleEcommerceFileUpload}
          rawRecords={rawRecords}
          ecommerceFileInfo={ecommerceFileInfo}
          columnMapping={columnMapping}
          onUpdateColumnMapping={handleUpdateColumnMapping}
          onProcessData={() => runPipeline(rawRecords, columnMapping, pricingConfig)}
          isProcessing={isProcessing}
        />

        {/* Batch EAN Code Search & Fetcher */}
        <BatchEanFetcher
          products={processedProducts}
          rawCount={rawRecords.length}
          filters={filters}
          onFilterChange={setFilters}
          onSelectTableTab={() => setActiveTab('table')}
          onProcessData={handleFetchAndProcessData}
        />

        {/* Top-Level Filter Bar (Always accessible before and after data processing) */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={() => setFilters(INITIAL_FILTERS)}
          totalCount={processedProducts.length}
          filteredCount={filteredProducts.length}
          onSelectTableTab={() => setActiveTab('table')}
          onProcessData={handleFetchAndProcessData}
          rawCount={rawRecords.length}
          isProcessing={isProcessing}
        />

        {/* Workspace Navigation Tabs & Settings button */}
        {processedProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span>Sync Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('table')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                  activeTab === 'table'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Table className="w-4 h-4 text-emerald-400" />
                <span>Product Master Data ({filteredProducts.length.toLocaleString()})</span>
              </button>

              <button
                onClick={() => setActiveTab('batch-ean')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 relative ${
                  activeTab === 'batch-ean'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Barcode className="w-4 h-4 text-amber-400" />
                <span>Batch EAN Fetcher</span>
                {filters.batchEanInput && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('ai-review')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 relative ${
                  activeTab === 'ai-review'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Category Review</span>
                {reviewNeededCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                    {reviewNeededCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('image-mapping')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                  activeTab === 'image-mapping'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>S-Size Image Mapping</span>
              </button>

              <button
                onClick={() => setActiveTab('validation')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 ${
                  activeTab === 'validation'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Validation Logs ({validationIssues.length})</span>
              </button>
            </nav>

            <button
              onClick={() => setIsConfigOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition flex items-center space-x-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Pricing Rules Config</span>
            </button>
          </div>
        )}

        {/* Tab Views */}
        {processedProducts.length > 0 && (
          <div className="space-y-6">
            {/* Dashboard Overview View */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Summary Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Raw Wondersoft Rows</p>
                    <p className="text-2xl font-bold text-slate-900">{rawRecords.length.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400">Exported from Wondersoft across stores</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Unique Aggregated SKUs</p>
                    <p className="text-2xl font-bold text-emerald-600">{processedProducts.length.toLocaleString()}</p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      7-Store Stock Combined (SUM)
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
                    <p className="text-xs text-slate-500 font-medium">S-Size Image Variants</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {Object.keys(variantMap).length.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-indigo-700 font-medium">
                      Unique Image Paths Generated
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
                    <p className="text-xs text-slate-500 font-medium">AI Classification Status</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {(processedProducts.length - reviewNeededCount).toLocaleString()} / {processedProducts.length.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {reviewNeededCount === 0 ? 'All 100% Approved' : `${reviewNeededCount} Need Review`}
                    </p>
                  </div>
                </div>

                {/* Main Product Table View */}
                <DataTableView products={filteredProducts} />
              </div>
            )}

            {/* Table View Tab */}
            {activeTab === 'table' && <DataTableView products={filteredProducts} />}

            {/* Batch EAN Fetcher Tab */}
            {activeTab === 'batch-ean' && (
              <div className="space-y-4">
                <DataTableView products={filteredProducts} />
              </div>
            )}

            {/* AI Review Tab */}
            {activeTab === 'ai-review' && (
              <AICategoryReviewTable
                products={filteredProducts}
                onUpdateCategory={handleCategoryUpdate}
                onApproveAllLowConfidence={handleApproveAllLowConfidence}
              />
            )}

            {/* Image Mapping Tab */}
            {activeTab === 'image-mapping' && (
              <ImageMappingView
                products={filteredProducts}
                variantMap={variantMap}
                onExportImageTeam={() => exportImageTeamExcel(filteredProducts)}
              />
            )}

            {/* Validation Logs Tab */}
            {activeTab === 'validation' && (
              <ValidationView
                validationIssues={validationIssues}
                onExportErrorReport={() => exportErrorReportExcel(validationIssues)}
              />
            )}
          </div>
        )}
      </main>

      {/* Pricing Settings Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        pricingConfig={pricingConfig}
        onSavePricingConfig={(newCfg) => {
          setPricingConfig(newCfg);
          if (rawRecords.length > 0) {
            runPipeline(rawRecords, columnMapping, newCfg);
          }
        }}
        columnMapping={columnMapping}
      />
    </div>
  );
}

export default App;
