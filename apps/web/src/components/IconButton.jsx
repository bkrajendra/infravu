export function IconButton({ icon: Icon, title, onClick, className = '' }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 ${className}`}
    >
      <Icon size={17} strokeWidth={1.9} />
    </button>
  )
}
