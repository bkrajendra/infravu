import { Activity, Box, Cpu, Database, HardDrive, LayoutDashboard, MemoryStick, Network, Plus, Server, Settings, TerminalSquare } from 'lucide-react'

const nav = [
  ['overview','Overview',LayoutDashboard],
  ['system','System',Server],
  ['cpu','CPU',Cpu],
  ['memory','Memory',MemoryStick],
  ['disks','Disks',HardDrive],
  ['network','Network',Network],
  ['processes','Processes',TerminalSquare],
  ['vms','VMs',Box],
]

export default function Sidebar({ hosts, selectedId, onSelectHost, onAddHost }) {
  return (
    <aside className="sticky top-0 flex h-screen w-[242px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-slate-900 text-white shadow-sm"><Activity size={21} strokeWidth={2}/></div>
        <div><div className="text-[15px] font-bold text-slate-900">Server Monitor</div><div className="text-xs text-slate-400">Host Resource Monitoring</div></div>
      </div>

      <nav className="px-3">
        {nav.map(([id,label,Icon]) => (
          <a key={id} href={`#${id}`} className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
            <Icon size={18} strokeWidth={1.8}/><span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-8 px-4">
        <div className="mb-2 flex items-center justify-between px-2"><span className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Servers</span><button onClick={onAddHost} title="Add server" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-800"><Plus size={15}/></button></div>
        <div className="space-y-1">
          {hosts.map((host) => (
            <button key={host.id} onClick={()=>onSelectHost(host.id)} className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${host.id===selectedId ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span className={`h-2 w-2 rounded-full ${host.id===selectedId ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{host.name}</span><span className="block truncate text-[11px] text-slate-400">{host.host}:{host.port}</span></span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Settings size={14}/> Local workspace</div>
          <div className="mt-1 text-[11px] leading-5 text-slate-400">Server definitions are stored in browser localStorage.</div>
        </div>
      </div>
    </aside>
  )
}
