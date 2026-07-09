import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const GROUP_RETENTION_DAYS = 90;

export function calculateExpiresAt(from = new Date()): Date {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + GROUP_RETENTION_DAYS);
  return expires;
}

/**
 * 만료된 모임에 접근하면 데이터를 삭제하고 null을 반환한다
 * (docs/PlanningDoc.md 4.6 이력 보관/삭제 정책).
 */
export async function getActiveGroupById(id: string) {
  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return null;

  if (group.expiresAt.getTime() < Date.now()) {
    await prisma.group.delete({ where: { id } });
    return null;
  }

  return group;
}

/**
 * 열람 전용 결과 링크(/r/[token])로 모임을 조회한다. 만료 처리 정책은
 * getActiveGroupById와 동일.
 */
export async function getActiveGroupByViewToken(token: string) {
  const group = await prisma.group.findUnique({ where: { viewToken: token } });
  if (!group) return null;

  if (group.expiresAt.getTime() < Date.now()) {
    await prisma.group.delete({ where: { id: group.id } });
    return null;
  }

  return group;
}

/**
 * viewToken이 없는 기존 모임(스키마 변경 이전 생성분)에 접근하면
 * 그 자리에서 토큰을 발급한다.
 */
export async function ensureViewToken(group: { id: string; viewToken: string | null }): Promise<string> {
  if (group.viewToken) return group.viewToken;
  const token = randomUUID();
  await prisma.group.update({ where: { id: group.id }, data: { viewToken: token } });
  return token;
}
