import {
  ClassificationResult,
  MainCategoryType,
  DepartmentType,
  WondersoftRawRecord,
} from '../types';

export function classifyWithRules(
  record: Partial<WondersoftRawRecord>
): ClassificationResult | null {
  const productGroup = (record.productGroup || '').toLowerCase().trim();
  const rawDept = (record.department || '').toLowerCase().trim();
  const rawName = (record.productName || '').toLowerCase().trim();
  const rawClass = (record.classBrand || '').toLowerCase().trim();
  const rawGarment = (record.garmentFabric || '').toLowerCase().trim();

  const combinedText = `${productGroup} ${rawDept} ${rawName} ${rawClass} ${rawGarment}`;

  // 1. Determine Main Category
  let mainCategory: MainCategoryType | null = null;
  let mainCatConfidence = 0.95;

  if (
    combinedText.includes('junior') ||
    combinedText.includes('jr') ||
    combinedText.includes('boys') ||
    combinedText.includes('boy')
  ) {
    mainCategory = 'Boys';
  } else if (
    combinedText.includes('kids') ||
    combinedText.includes('kid') ||
    combinedText.includes('children') ||
    combinedText.includes('baby') ||
    combinedText.includes('infant')
  ) {
    mainCategory = 'Kids';
  } else if (
    combinedText.includes('men') ||
    combinedText.includes('mens') ||
    combinedText.includes('adult') ||
    combinedText.includes('man')
  ) {
    mainCategory = 'Men';
  } else {
    // Default fallback based on product group if unstated
    if (productGroup.includes('boy')) mainCategory = 'Boys';
    else if (productGroup.includes('kid')) mainCategory = 'Kids';
    else if (productGroup.includes('men')) mainCategory = 'Men';
    else mainCatConfidence = 0.6; // Low confidence for main category
  }

  // 2. Determine Department & Product Type using STRICT KEYWORD PRIORITY
  let department: DepartmentType | null = null;
  let productType: string | null = null;

  // Specific multi-word keywords FIRST
  if (combinedText.includes('gym vest')) {
    department = 'Inner Wear';
    productType = 'Gym Vest';
  } else if (combinedText.includes('set dhoti')) {
    department = 'Traditional';
    productType = 'Set Dhoti';
  } else if (
    combinedText.includes('track pant') ||
    combinedText.includes('trackpant') ||
    combinedText.includes('jogger')
  ) {
    department = 'Bottom Wear';
    productType = 'Track Pant';
  } else if (
    combinedText.includes('t shirt') ||
    combinedText.includes('t-shirt') ||
    combinedText.includes('tshirt') ||
    combinedText.includes('polo')
  ) {
    department = 'Top Wear';
    productType = 'T Shirt';
  } else if (
    combinedText.includes('short') ||
    combinedText.includes('shorts') ||
    combinedText.includes('half pant') ||
    combinedText.includes('bermuda')
  ) {
    department = 'Bottom Wear';
    productType = 'Shorts';
  } else if (
    combinedText.includes('brief') ||
    combinedText.includes('undergarment')
  ) {
    department = 'Inner Wear';
    productType = 'Brief';
  } else if (
    combinedText.includes('trunk') ||
    combinedText.includes('boxer')
  ) {
    department = 'Inner Wear';
    productType = 'Trunk';
  } else if (
    combinedText.includes('vest') ||
    combinedText.includes('banian')
  ) {
    department = 'Inner Wear';
    productType = 'Vest';
  } else if (
    combinedText.includes('dhoti') ||
    combinedText.includes('veshti')
  ) {
    department = 'Traditional';
    productType = 'Dhoti';
  } else if (
    combinedText.includes('pant') ||
    combinedText.includes('trouser') ||
    combinedText.includes('jeans') ||
    combinedText.includes('chino')
  ) {
    department = 'Bottom Wear';
    productType = 'Pant';
  } else if (combinedText.includes('shirt')) {
    department = 'Top Wear';
    productType = 'Shirt';
  }

  if (mainCategory && department && productType) {
    const finalConfidence = mainCatConfidence >= 0.9 ? 0.96 : 0.82;
    return {
      mainCategory,
      department,
      productType,
      confidence: finalConfidence,
      source: 'RULE',
      status: finalConfidence >= 0.8 ? 'Approved' : 'Manual Review Required',
      reasoning: `Rule match based on keyword priority in text: "${combinedText}"`,
    };
  }

  // Partial match if mainCategory is resolved but department/productType isn't completely clear
  if (mainCategory) {
    return {
      mainCategory,
      department: department || 'Top Wear', // best guess
      productType: productType || 'Shirt',
      confidence: 0.55, // Low confidence -> triggers AI fallback or manual review
      source: 'RULE',
      status: 'Manual Review Required',
      warning: 'Ambiguous product type from deterministic rule check.',
      reasoning: `Partial rule match for ${mainCategory}, requires AI or manual review for product type`,
    };
  }

  return null;
}
