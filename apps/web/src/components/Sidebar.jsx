import { Activity, ArrowLeft, Box, LayoutDashboard, Server, Settings, SlidersHorizontal } from 'lucide-react'

const landingNav = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['settings', 'Settings', Settings],
  ['about', 'About', SlidersHorizontal],
]

const serverNav = [
  ['general', 'General', LayoutDashboard],
  ['vms', 'Virtual Machines', Box],
]

export default function Sidebar({ mode = 'landing', activeSection, onNavigate, onBack }) {
  const nav = mode === 'server' ? serverNav : landingNav

  return (
    <aside className="sticky top-0 flex h-screen w-[242px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-slate-900 text-white shadow-sm"><Activity size={21} strokeWidth={2}/></div>
        <div><div className="text-[15px] font-bold text-slate-900">InfraVu</div><div className="text-xs text-slate-400">Infrastructure inventory</div></div>
      </div>

      <nav className="px-3">
        {nav.map(([id,label,Icon]) => (
          <button key={id} onClick={()=>onNavigate(id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${activeSection === id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Icon size={18} strokeWidth={1.8}/><span>{label}</span>
          </button>
        ))}
      </nav>

      {mode === 'server' && <button onClick={onBack} className="mx-6 mt-8 flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-slate-800"><ArrowLeft size={15}/> All servers</button>}

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Server size={14}/> Local workspace</div>
          <div className="mt-1 text-[11px] leading-5 text-slate-400">Inventory definitions are stored in browser localStorage.</div>
        </div>
      </div>
    </aside>
  )
}
