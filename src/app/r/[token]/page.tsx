import { notFound } from "next/navigation";
import { getActiveGroupByViewToken } from "@/lib/group";
import SettlementView from "@/components/SettlementView";

/**
 * 결과 링크(열람 전용) 진입점. 대시보드를 거치지 않고 정산 결과로
 * 직행한다 (docs/IA.md §1 — 수아 페르소나의 "링크 클릭 한 번으로
 * 결과 확인").
 */
export default async function ReadOnlyResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const group = await getActiveGroupByViewToken(token);
  if (!group || !group.viewToken) notFound();

  return <SettlementView group={group} viewToken={group.viewToken} readOnly />;
}
