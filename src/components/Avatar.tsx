import { avatarColorForName, avatarColorForIndex, initialOf } from "@/lib/avatarColor";

interface Props {
  /** 이름 기반 색(참여자/지출 목록 등 저장된 사람) */
  name?: string;
  /** 순서 기반 색(입력 중이라 이름이 비어있을 수 있는 폼 행) */
  index?: number;
  /** index 모드일 때 표시할 글자(입력 중인 이름의 첫 글자) */
  letter?: string;
  size?: number;
}

export default function Avatar({ name, index, letter, size = 36 }: Props) {
  const color = name !== undefined ? avatarColorForName(name) : avatarColorForIndex(index ?? 0);
  const glyph = name !== undefined ? initialOf(name) : letter && letter.length > 0 ? letter[0] : "+";

  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold"
      style={{
        width: size,
        height: size,
        background: color.bg,
        color: color.text,
        fontSize: Math.max(12, Math.round(size * 0.42)),
      }}
    >
      {glyph}
    </div>
  );
}
