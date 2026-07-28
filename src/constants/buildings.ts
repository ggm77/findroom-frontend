export const BUILDING_NAMES: Record<string, string> = {
  HDH: '현동홀',
  NMH: '느헤미야홀',
  NTH: '뉴턴홀',
  OH: '오석관',
  EBEN: '에벤에셀관',
  ANH: '올네이션스홀',
  CSH: '코너스톤홀',
  KGH: '그레이스홀',
  GLC: '언어교육원',
  HCA: '효암채플',
  SU: '학관',
};

export function buildingName(code: string): string {
  return BUILDING_NAMES[code] ?? code;
}

// 건물 목록/결과에 표시되는 순서. 순서를 바꾸려면 이 배열을 재배열하세요.
export const BUILDING_ORDER: string[] = Object.keys(BUILDING_NAMES);

export function buildingOrderIndex(code: string): number {
  const index = BUILDING_ORDER.indexOf(code);
  return index === -1 ? BUILDING_ORDER.length : index;
}
