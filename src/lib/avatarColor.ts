/**
 * 참여자별 아바타 색. 단일 accent(그린)는 CTA·잔액 의미색으로만 쓰고,
 * 아바타는 "이 사람이 누구인지" 구분하는 별도의 정체성 색 팔레트를
 * 쓴다 (레퍼런스 3의 컬러풀한 아바타 칩 참고, DecisionLog §11).
 */
export const AVATAR_PALETTE: { bg: string; text: string }[] = [
  { bg: "#E3F2FD", text: "#0B4F86" }, // sky
  { bg: "#FDECD8", text: "#8A4B08" }, // peach
  { bg: "#F0E6FB", text: "#5B2A99" }, // lavender
  { bg: "#FCE4EC", text: "#9C1750" }, // rose
  { bg: "#DFF7F3", text: "#0F6B5C" }, // teal
  { bg: "#FFF4CE", text: "#7A5B00" }, // sand
];

export function initialOf(name: string): string {
  return name.trim().slice(0, 1) || "?";
}

/** 같은 이름은 항상 같은 색(참여자 목록/지출 내역/정산 결과 전체에서 일관) */
export function avatarColorForName(name: string) {
  const seed = name.trim() || "?";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

/** 아직 이름이 없는 입력 중인 행(모임 생성 폼)처럼 순서로 고정해야 할 때 */
export function avatarColorForIndex(index: number) {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
}
