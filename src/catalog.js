export const CATALOG = {
  '과자': {
    '오리온': ['초코파이', '포카칩', '오감자', '초코송이', '꼬북칩'],
    '농심': ['새우깡', '꿀꽈배기', '자갈치', '바나나킥'],
    '해태': ['홈런볼', '에이스', '맛동산', '포키'],
    '롯데': ['빼빼로', '마가렛트', '꼬깔콘', '칙촉'],
    '직접 입력': [],
  },
  '음료': {
    '코카콜라': ['코카콜라', '스프라이트', '환타'],
    '롯데칠성': ['펩시', '칸타타', '레쓰비', '밀키스'],
    '동아오츠카': ['포카리스웨트'],
    '빙그레': ['바나나맛우유'],
    '직접 입력': [],
  },
  '사탕/젤리': {
    '하리보': ['골드베어', '콜라젤리'],
    '롯데': ['말랑카우', '목캔디'],
    '해태': ['아이셔'],
    '직접 입력': [],
  },
};

export const CATEGORIES = Object.keys(CATALOG);

export function getBrands(category) {
  return Object.keys(CATALOG[category] ?? {});
}

export function getItems(category, brand) {
  return CATALOG[category]?.[brand] ?? [];
}

export function isCustomBrand(brand) {
  return brand === '직접 입력';
}

// 카테고리 내 모든 상품을 브랜드별로 그룹핑해서 반환 (option_groups용)
// value 형식: "브랜드::상품명"
export function getItemOptionGroups(category) {
  const brands = CATALOG[category] ?? {};
  const groups = [];

  for (const [brand, items] of Object.entries(brands)) {
    if (brand === '직접 입력') continue;
    groups.push({
      label: brand,
      options: items.map(item => ({ label: item, value: `${brand}::${item}` })),
    });
  }

  return groups;
}

// "브랜드::상품명" 값 파싱
export function parseItemValue(value) {
  if (value === '직접 입력') return { brand: '직접 입력', item: null };
  const idx = value.indexOf('::');
  return { brand: value.slice(0, idx), item: value.slice(idx + 2) };
}
