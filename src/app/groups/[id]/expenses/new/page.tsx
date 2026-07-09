import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveGroupById } from "@/lib/group";
import { createExpense } from "@/app/actions";
import ExpenseForm from "@/components/ExpenseForm";
import AppBar from "@/components/AppBar";

export default async function NewExpensePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string }>;
}) {
  const { id } = await params;
  const { added } = await searchParams;
  const group = await getActiveGroupById(id);
  if (!group) notFound();

  const participants = await prisma.participant.findMany({
    where: { groupId: id },
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex flex-col gap-6">
      <AppBar title="지출 추가" subtitle={group.name} backHref={`/groups/${id}`} />
      {added && (
        <p className="rounded-token bg-accent-soft px-3 py-2 font-body text-sm text-accent-hover">
          지출이 저장되었어요. 이어서 다음 지출을 입력하세요.
        </p>
      )}
      <ExpenseForm
        action={createExpense.bind(null, id)}
        participants={participants}
        submitLabel="지출 등록"
        allowContinue
      />
    </main>
  );
}
