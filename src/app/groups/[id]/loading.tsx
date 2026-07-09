export default function GroupLoading() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-token bg-surface p-5 shadow-card">
        <div className="skeleton h-7 w-40" />
        <div className="flex gap-6">
          <div className="skeleton h-6 w-16" />
          <div className="skeleton h-6 w-16" />
          <div className="skeleton h-6 w-16" />
        </div>
        <div className="skeleton h-9 w-48 rounded-full" />
      </div>

      <div className="flex flex-col divide-y divide-border rounded-token bg-surface shadow-card">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-4 w-16" />
          </div>
        ))}
      </div>
    </main>
  );
}
