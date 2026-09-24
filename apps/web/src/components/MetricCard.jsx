export default function MetricCard({ icon: Icon, title, value, subtitle, tone = 'blue', sparkline, progress }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone] || tones.blue}`}>
          <Icon size={20} strokeWidth={1.9} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[.18em] text-slate-400">Live</span>
      </div>
      <div className="mt-5 text-sm font-semibold text-slate-500">{title}</div>
      <div className="mt-1 text-[31px] font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
      {progress != null && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
      {sparkline && <div className="pointer-events-none absolute bottom-0 left-0 right-0 opacity-10">{sparkline}</div>}
    </div>
  )
}
