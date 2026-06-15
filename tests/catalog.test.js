import { describe, it, expect } from 'vitest';
import { CATALOG, CATEGORIES, getBrands, getItems, isCustomBrand } from '../src/catalog.js';

describe('catalog', () => {
  it('카테고리 3개 존재', () => {
    expect(CATEGORIES).toEqual(['과자', '음료', '사탕/젤리']);
  });

  it('getBrands — 과자 브랜드 포함 확인', () => {
    const brands = getBrands('과자');
    expect(brands).toContain('오리온');
    expect(brands).toContain('직접 입력');
  });

  it('getBrands — 없는 카테고리는 빈 배열', () => {
    expect(getBrands('없는카테고리')).toEqual([]);
  });

  it('getItems — 오리온 과자 목록 반환', () => {
    const items = getItems('과자', '오리온');
    expect(items).toContain('초코파이');
    expect(items).toContain('포카칩');
  });

  it('getItems — 직접 입력은 빈 배열', () => {
    expect(getItems('과자', '직접 입력')).toEqual([]);
  });

  it('getItems — 없는 브랜드는 빈 배열', () => {
    expect(getItems('과자', '없는브랜드')).toEqual([]);
  });

  it('isCustomBrand — 직접 입력만 true', () => {
    expect(isCustomBrand('직접 입력')).toBe(true);
    expect(isCustomBrand('오리온')).toBe(false);
  });

  it('모든 카테고리에 직접 입력 브랜드 존재', () => {
    for (const cat of CATEGORIES) {
      expect(getBrands(cat)).toContain('직접 입력');
    }
  });
});
