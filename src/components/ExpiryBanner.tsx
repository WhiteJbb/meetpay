export default function ExpiryBanner({ expiresAt }: { expiresAt: Date }) {
  const dateLabel = expiresAt.toISOString().slice(0, 10);
  return (
    <div className="rounded-token bg-accent-soft px-3 py-2 font-body text-sm text-accent-hover">
      이 모임 데이터는 <span className="font-data font-semibold">{dateLabel}</span> 이후
      자동 삭제됩니다. 필요한 정산 결과는 미리 저장해두세요.
    </div>
  );
}
