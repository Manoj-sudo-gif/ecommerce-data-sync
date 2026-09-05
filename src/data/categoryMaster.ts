import { MainCategoryType, DepartmentType } from '../types';

export const APPROVED_TAXONOMY: Record<
  MainCategoryType,
  Record<DepartmentType, string[]>
> = {
  Men: {
    'Top Wear': ['Shirt', 'T Shirt'],
    'Bottom Wear': ['Pant', 'Track Pant', 'Shorts'],
    'Inner Wear': ['Vest', 'Gym Vest', 'Brief', 'Trunk'],
    Traditional: ['Shirt', 'Dhoti', 'Set Dhoti'],
  },
  Boys: {
    'Top Wear': ['Shirt', 'T Shirt'],
    'Bottom Wear': ['Pant', 'Track Pant', 'Shorts'],
    'Inner Wear': ['Vest', 'Gym Vest', 'Brief', 'Trunk'],
    Traditional: ['Shirt', 'Dhoti', 'Set Dhoti'],
  },
  Kids: {
    'Top Wear': ['Shirt', 'T Shirt'],
    'Bottom Wear': ['Pant', 'Track Pant', 'Shorts'],
    'Inner Wear': ['Vest', 'Gym Vest', 'Brief', 'Trunk'],
    Traditional: ['Shirt', 'Dhoti', 'Set Dhoti'],
  },
};

export const MAIN_CATEGORIES: MainCategoryType[] = ['Men', 'Boys', 'Kids'];

export const DEPARTMENTS: DepartmentType[] = [
  'Top Wear',
  'Bottom Wear',
  'Inner Wear',
  'Traditional',
];

export function getProductTypesForDepartment(
  mainCategory: MainCategoryType,
  department: DepartmentType
): string[] {
  return APPROVED_TAXONOMY[mainCategory]?.[department] || [];
}

export function isValidTaxonomyCombination(
  mainCat: string,
  dept: string,
  productType: string
): boolean {
  if (!MAIN_CATEGORIES.includes(mainCat as MainCategoryType)) return false;
  if (!DEPARTMENTS.includes(dept as DepartmentType)) return false;
  const validTypes = APPROVED_TAXONOMY[mainCat as MainCategoryType]?.[dept as DepartmentType];
  return !!validTypes?.includes(productType);
}
