import { notFound } from "next/navigation";
import { ensureViewToken, getActiveGroupById } from "@/lib/group";
import SettlementView from "@/components/SettlementView";

export default async function SettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getActiveGroupById(id);
  if (!group) notFound();

  const viewToken = await ensureViewToken(group);

  return <SettlementView group={group} viewToken={viewToken} readOnly={false} />;
}
