import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveGroupById } from "@/lib/group";
import { deleteExpense, updateExpense } from "@/app/actions";
import ExpenseForm from "@/components/ExpenseForm";
import AppBar from "@/components/AppBar";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id, expenseId } = await params;
  const group = await getActiveGroupById(id);
  if (!group) notFound();

  const [participants, expense] = await Promise.all([
    prisma.participant.findMany({ where: { groupId: id }, orderBy: { name: "asc" } }),
    prisma.expense.findUnique({ where: { id: expenseId }, include: { shares: true } }),
  ]);

  if (!expense || expense.groupId !== id) notFound();

  return (
    <main className="flex flex-col gap-6">
      <AppBar title="지출 수정" subtitle={group.name} backHref={`/groups/${id}`} />
      <ExpenseForm
        action={updateExpense.bind(null, id, expenseId)}
        participants={participants}
        defaultValues={{
          title: expense.title,
          amount: expense.amount,
          currency: expense.currency,
          payerId: expense.payerId,
          date: expense.date.toISOString().slice(0, 10),
          shareParticipantIds: expense.shares.map((s) => s.participantId),
        }}
        submitLabel="수정 저장"
        deleteAction={deleteExpense.bind(null, id, expenseId)}
      />
    </main>
  );
}
