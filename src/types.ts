export type MainCategoryType = 'Men' | 'Boys' | 'Kids';

export type DepartmentType = 'Top Wear' | 'Bottom Wear' | 'Inner Wear' | 'Traditional';

export type ProductTypeMap = {
  'Top Wear': ['Shirt', 'T Shirt'];
  'Bottom Wear': ['Pant', 'Track Pant', 'Shorts'];
  'Inner Wear': ['Vest', 'Gym Vest', 'Brief', 'Trunk'];
  'Traditional': ['Shirt', 'Dhoti', 'Set Dhoti'];
};

export interface WondersoftRawRecord {
  storeId?: string;
  storeName?: string;
  productGroup: string;
  department: string;
  classBrand: string;
  colour: string;
  size: string;
  garmentFabric: string;
  ean: string;
  mrp: number;
  stock: number;
  styleNo: string;
  toonLabel?: string;
  productName?: string;
  [key: string]: any;
}

export interface ColumnMappingConfig {
  [wondersoftColumn: string]: string;
}

export interface EcommerceFileInfo {
  fileName: string;
  rowCount: number;
  headers: string[];
  uploadedAt: string;
}

export interface ClassificationResult {
  mainCategory: MainCategoryType;
  department: DepartmentType;
  productType: string;
  confidence: number;
  source: 'RULE' | 'AI' | 'MANUAL';
  status: 'Approved' | 'Manual Review Required';
  warning?: string;
  reasoning?: string;
}

export interface ProcessedProductRecord {
  id: string;
  ean: string;
  mainCategory: MainCategoryType;
  department: DepartmentType;
  productType: string;
  productName: string;
  brand: string;
  colour: string;
  size: string;
  fabric: string;
  sellingPrice: number;
  stockQuantity: number;
  styleNo: string;
  toonLabel?: string;
  imagePath: string;
  sSizeEan?: string;
  costPrice?: string | number;
  discount?: string | number;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  fit?: string;
  productDescription?: string;
  productDetails?: string;
  storeCount: number;
  storeBreakdown?: { store: string; stock: number; mrp: number }[];
  storeBreakdownSummary?: string;
  originalProductGroup: string;
  originalDepartment: string;
  classificationResult: ClassificationResult;
  validationErrors: string[];
  validationWarnings: string[];
}

export interface ValidationIssue {
  id: string;
  rowId: string;
  ean: string;
  productInfo: string;
  issueType: 'ERROR' | 'WARNING';
  message: string;
}

export type StockComparisonOperator = '>=' | '>' | '<=' | '<' | '=';

export interface FilterState {
  eanSeries: string;
  department: string;
  productType: string;
  productName: string;
  brand: string;
  colour: string;
  ean: string;
  size: string;
  minStock: string;
  stockValue?: string;
  stockOperator?: StockComparisonOperator;
  maxStock: string;
  reviewStatus: 'ALL' | 'APPROVED' | 'REVIEW_REQUIRED';
  batchEanInput?: string;
}

export interface PricingRulesConfig {
  enableCostPriceCalc: boolean;
  costPricePercentage: number; // e.g. 60% of MRP
  enableDiscountCalc: boolean;
  discountPercentage: number;
}

export interface ImageTeamRecord {
  productName: string;
  ean: string;
  toonLabel?: string;
  brand: string;
  size: string;
  colour: string;
}
