import { ProcessedProductRecord } from '../types';

/**
 * Derives the main category folder name for GM Fashion catalog URL.
 * Men -> 'Mens'
 * Boys -> 'Boys'
 * Kids -> 'Kids'
 */
export function getMainCategoryFolder(p: ProcessedProductRecord): string {
  const mc = (p.mainCategory || '').trim().toLowerCase();
  const name = (p.productName || '').toLowerCase();
  const group = (p.originalProductGroup || '').toLowerCase();

  if (mc === 'boys' || mc === 'boy' || name.includes('boys') || name.includes('boy ') || group.includes('boy')) {
    return 'Boys';
  }
  if (mc === 'kids' || mc === 'kid' || name.includes('kids') || name.includes('kid ') || group.includes('kid')) {
    return 'Kids';
  }
  return 'Mens';
}

/**
 * Derives the department folder name (uppercase & URL encoded).
 * e.g. 'Top Wear' -> 'TOP%20WEAR'
 */
export function getDepartmentFolder(p: ProcessedProductRecord): string {
  let dept = (p.department || '').trim();
  if (!dept || dept.toLowerCase() === 'all') {
    const pType = (p.productType || '').toLowerCase();
    const orig = (p.originalDepartment || '').toLowerCase();
    const name = (p.productName || '').toLowerCase();

    if (
      pType.includes('shirt') ||
      pType.includes('tee') ||
      name.includes('shirt') ||
      name.includes('top') ||
      orig.includes('top')
    ) {
      dept = 'Top Wear';
    } else if (
      pType.includes('pant') ||
      pType.includes('trouser') ||
      pType.includes('short') ||
      pType.includes('jean') ||
      name.includes('pant') ||
      orig.includes('bottom')
    ) {
      dept = 'Bottom Wear';
    } else if (
      pType.includes('vest') ||
      pType.includes('brief') ||
      pType.includes('trunk') ||
      orig.includes('inner')
    ) {
      dept = 'Inner Wear';
    } else if (pType.includes('dhoti') || orig.includes('trad')) {
      dept = 'Traditional';
    } else {
      dept = 'Top Wear';
    }
  }

  return encodeURIComponent(dept.toUpperCase().trim());
}

/**
 * Derives the product type folder name (uppercase & URL encoded).
 * e.g. 'Shirt' -> 'SHIRT', 'T Shirt' -> 'T%20SHIRT'
 */
export function getProductTypeFolder(p: ProcessedProductRecord): string {
  let pt = (p.productType || '').trim();
  if (!pt) {
    const name = (p.productName || '').toLowerCase();
    if (name.includes('t-shirt') || name.includes('t shirt') || name.includes('tee') || name.includes('polo')) {
      pt = 'T Shirt';
    } else if (name.includes('shirt')) {
      pt = 'Shirt';
    } else if (name.includes('track pant')) {
      pt = 'Track Pant';
    } else if (name.includes('pant') || name.includes('trouser') || name.includes('jean')) {
      pt = 'Pant';
    } else if (name.includes('short')) {
      pt = 'Shorts';
    } else if (name.includes('gym vest')) {
      pt = 'Gym Vest';
    } else if (name.includes('vest')) {
      pt = 'Vest';
    } else if (name.includes('brief')) {
      pt = 'Brief';
    } else if (name.includes('trunk')) {
      pt = 'Trunk';
    } else if (name.includes('set dhoti')) {
      pt = 'Set Dhoti';
    } else if (name.includes('dhoti')) {
      pt = 'Dhoti';
    } else {
      pt = 'Shirt';
    }
  }

  const normalized = pt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  return encodeURIComponent(normalized);
}

/**
 * Derives the brand folder name (slashes removed, uppercase & URL encoded).
 * e.g. 'FOCUS L/F' -> 'FOCUS LF' -> 'FOCUS%20LF'
 */
export function getBrandFolder(p: ProcessedProductRecord): string {
  const rawBrand = (p.brand || 'GM FASHION').trim();
  // Strip slashes and illegal path characters (e.g. FOCUS L/F becomes FOCUS LF)
  const cleaned = rawBrand.replace(/[/\\:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  return encodeURIComponent(cleaned || 'GM FASHION');
}

/**
 * Returns the cleaned Toon Label string.
 */
export function getCleanToonLabel(p: ProcessedProductRecord): string {
  const toon = (p.toonLabel || p.styleNo || p.ean || '').trim();
  const cleaned = toon.replace(/[/\\:*?"<>|]+/g, '').trim();
  return cleaned || 'DEFAULT';
}

/**
 * Derives the Toon Label folder name (URL encoded).
 * e.g. '5-S098-01' -> '5-S098-01'
 */
export function getToonFolder(p: ProcessedProductRecord): string {
  return encodeURIComponent(getCleanToonLabel(p));
}

export type ImageAngle = 'F' | 'B' | 'L' | 'C';

/**
 * Generates the GM Fashion full image URL for a given angle:
 * F = Front, B = Back, L = Left, C = Closeup
 *
 * Example:
 * https://gmfashions.in/ver4/image/cache/catalog/Mens/TOP%20WEAR/SHIRT/FOCUS%20LF/5-S098-01/5-S098-01%20F-300x300.jpg
 */
export function generateGMImageAngleUrl(
  p: ProcessedProductRecord,
  angle: ImageAngle
): string {
  const base = 'https://gmfashions.in/ver4/image/cache/catalog';
  const mainCat = getMainCategoryFolder(p);
  const dept = getDepartmentFolder(p);
  const pType = getProductTypeFolder(p);
  const brand = getBrandFolder(p);
  const toon = getCleanToonLabel(p);
  const toonFolder = encodeURIComponent(toon);
  const fileName = encodeURIComponent(`${toon} ${angle}-300x300.jpg`);

  return `${base}/${mainCat}/${dept}/${pType}/${brand}/${toonFolder}/${fileName}`;
}

export interface GMImageAngleUrls {
  front: string;
  back: string;
  left: string;
  closeup: string;
}

/**
 * Returns all 4 image URLs (front, back, left, closeup) for a product record.
 */
export function getGMImageAngleUrls(p: ProcessedProductRecord): GMImageAngleUrls {
  return {
    front: generateGMImageAngleUrl(p, 'F'),
    back: generateGMImageAngleUrl(p, 'B'),
    left: generateGMImageAngleUrl(p, 'L'),
    closeup: generateGMImageAngleUrl(p, 'C'),
  };
}
