export default function SectionCard({ id, title, icon: Icon, action, children, className = '' }) {
  return (
    <section id={id} className={`section-anchor card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-700">
            <Icon size={18} strokeWidth={1.85} />
          </div>
          <div className="text-[15px] font-bold text-slate-900">{title}</div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
