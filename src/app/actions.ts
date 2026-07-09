"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateExpiresAt, getActiveGroupById } from "@/lib/group";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

interface ParticipantInput {
  name: string;
  email: string | null;
  bankAccount: string | null;
}

/**
 * 동명이인 정책(docs/DecisionLog.md §7): 이름만으로 등록 가능하되,
 * 같은 이름이 2명 이상이면 서로 다른 이메일로 구분되어야 한다.
 */
function validateDistinguishable(participants: ParticipantInput[]) {
  const byName = new Map<string, ParticipantInput[]>();
  for (const p of participants) {
    const list = byName.get(p.name) ?? [];
    list.push(p);
    byName.set(p.name, list);
  }

  for (const [name, group] of byName.entries()) {
    if (group.length < 2) continue;
    const emails = group.map((p) => p.email);
    if (emails.some((e) => !e)) {
      throw new Error(`같은 이름(${name})이 여러 명이면 각자 이메일을 입력해 구분해주세요.`);
    }
    if (new Set(emails).size !== emails.length) {
      throw new Error(`같은 이름(${name})의 참여자들은 서로 다른 이메일을 사용해야 해요.`);
    }
  }

  const nonEmptyEmails = participants.map((p) => p.email).filter(Boolean);
  if (new Set(nonEmptyEmails).size !== nonEmptyEmails.length) {
    throw new Error("같은 이메일을 여러 참여자에게 사용할 수 없어요.");
  }
}

export async function createGroup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const names = formData.getAll("participantName").map((v) => String(v).trim());
  const emails = formData.getAll("participantEmail").map((v) => String(v).trim());
  const accounts = formData.getAll("participantAccount").map((v) => String(v).trim());

  if (!name) throw new Error("모임 이름을 입력해주세요.");

  const participants: ParticipantInput[] = names
    .map((n, i) => ({
      name: n,
      email: emails[i] || null,
      bankAccount: accounts[i] || null,
    }))
    .filter((p) => p.name);

  if (participants.length < 2) {
    throw new Error("참여자 이름을 2명 이상 등록해주세요.");
  }
  validateDistinguishable(participants);

  const group = await prisma.group.create({
    data: {
      name,
      viewToken: randomUUID(),
      expiresAt: calculateExpiresAt(),
      participants: { create: participants },
    },
  });

  redirect(`/groups/${group.id}`);
}

export async function addParticipant(groupId: string, formData: FormData) {
  const group = await getActiveGroupById(groupId);
  if (!group) throw new Error("모임을 찾을 수 없습니다.");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const bankAccount = String(formData.get("bankAccount") ?? "").trim() || null;

  if (!name) throw new Error("이름을 입력해주세요.");

  const existing = await prisma.participant.findMany({ where: { groupId } });
  validateDistinguishable([
    ...existing.map((p) => ({ name: p.name, email: p.email, bankAccount: p.bankAccount })),
    { name, email, bankAccount },
  ]);

  await prisma.participant.create({ data: { groupId, name, email, bankAccount } });
  redirect(`/groups/${groupId}`);
}

export async function updateParticipant(groupId: string, participantId: string, formData: FormData) {
  const group = await getActiveGroupById(groupId);
  if (!group) throw new Error("모임을 찾을 수 없습니다.");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const bankAccount = String(formData.get("bankAccount") ?? "").trim() || null;

  if (!name) throw new Error("이름을 입력해주세요.");

  const others = await prisma.participant.findMany({
    where: { groupId, NOT: { id: participantId } },
  });
  validateDistinguishable([
    ...others.map((p) => ({ name: p.name, email: p.email, bankAccount: p.bankAccount })),
    { name, email, bankAccount },
  ]);

  await prisma.participant.update({
    where: { id: participantId },
    data: { name, email, bankAccount },
  });
  redirect(`/groups/${groupId}`);
}

export async function deleteParticipant(groupId: string, participantId: string) {
  const group = await getActiveGroupById(groupId);
  if (!group) throw new Error("모임을 찾을 수 없습니다.");

  const [participantCount, involvement] = await Promise.all([
    prisma.participant.count({ where: { groupId } }),
    prisma.participant.findUnique({
      where: { id: participantId },
      include: { _count: { select: { paid: true, shares: true } } },
    }),
  ]);

  if (!involvement || involvement.groupId !== groupId) {
    throw new Error("참여자를 찾을 수 없습니다.");
  }
  if (participantCount <= 2) {
    throw new Error("참여자는 최소 2명이 필요해 더 삭제할 수 없어요.");
  }
  if (involvement._count.paid > 0 || involvement._count.shares > 0) {
    // 지출 이력이 있는 참여자를 지우면 정산 정합성이 깨지므로 보수적으로 차단
    throw new Error("지출 내역이 있는 참여자는 삭제할 수 없어요. 먼저 해당 지출을 정리해주세요.");
  }

  await prisma.participant.delete({ where: { id: participantId } });
  redirect(`/groups/${groupId}`);
}

async function saveReceiptIfPresent(file: File | null): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/receipts/${filename}`;
}

function parseExpenseDate(formData: FormData): Date {
  const raw = String(formData.get("date") ?? "").trim();
  // 화면 표시가 toISOString() 기반이므로 UTC 자정으로 저장해야
  // 타임존과 무관하게 입력한 날짜 그대로 표시된다
  const parsed = raw ? new Date(`${raw}T00:00:00Z`) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function createExpense(groupId: string, formData: FormData) {
  const group = await getActiveGroupById(groupId);
  if (!group) throw new Error("모임을 찾을 수 없습니다.");

  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "KRW");
  const payerId = String(formData.get("payerId") ?? "");
  const shareParticipantIds = formData.getAll("shareParticipantIds").map(String);
  const receiptFile = formData.get("receipt") as File | null;
  const continueAdding = formData.get("continueAdding") === "1";

  if (!title) throw new Error("항목명을 입력해주세요.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("올바른 금액을 입력해주세요.");
  if (!SUPPORTED_CURRENCIES.includes(currency as (typeof SUPPORTED_CURRENCIES)[number])) {
    throw new Error("지원하지 않는 통화입니다.");
  }
  if (!payerId) throw new Error("지출자를 선택해주세요.");
  if (shareParticipantIds.length === 0) throw new Error("참여자를 한 명 이상 선택해주세요.");

  const receiptUrl = await saveReceiptIfPresent(receiptFile);

  await prisma.expense.create({
    data: {
      groupId,
      title,
      amount,
      currency,
      payerId,
      date: parseExpenseDate(formData),
      receiptUrl,
      shares: {
        create: shareParticipantIds.map((participantId) => ({ participantId })),
      },
    },
  });

  // "저장 후 계속 추가": 여행처럼 지출을 몰아 입력할 때 대시보드 왕복 제거
  redirect(continueAdding ? `/groups/${groupId}/expenses/new?added=1` : `/groups/${groupId}`);
}

export async function updateExpense(groupId: string, expenseId: string, formData: FormData) {
  const group = await getActiveGroupById(groupId);
  if (!group) throw new Error("모임을 찾을 수 없습니다.");

  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "KRW");
  const payerId = String(formData.get("payerId") ?? "");
  const shareParticipantIds = formData.getAll("shareParticipantIds").map(String);
  const receiptFile = formData.get("receipt") as File | null;

  if (!title) throw new Error("항목명을 입력해주세요.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("올바른 금액을 입력해주세요.");
  if (!payerId) throw new Error("지출자를 선택해주세요.");
  if (shareParticipantIds.length === 0) throw new Error("참여자를 한 명 이상 선택해주세요.");

  const receiptUrl = await saveReceiptIfPresent(receiptFile);

  await prisma.$transaction([
    prisma.expenseShare.deleteMany({ where: { expenseId } }),
    prisma.expense.update({
      where: { id: expenseId },
      data: {
        title,
        amount,
        currency,
        payerId,
        date: parseExpenseDate(formData),
        ...(receiptUrl ? { receiptUrl } : {}),
        shares: { create: shareParticipantIds.map((participantId) => ({ participantId })) },
      },
    }),
  ]);

  redirect(`/groups/${groupId}`);
}

export async function deleteExpense(groupId: string, expenseId: string) {
  const group = await getActiveGroupById(groupId);
  if (!group) throw new Error("모임을 찾을 수 없습니다.");

  await prisma.expense.delete({ where: { id: expenseId } });
  redirect(`/groups/${groupId}`);
}
