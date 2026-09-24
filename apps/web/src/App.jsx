import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Box, CalendarClock, ChevronDown, Clock3, Cpu, Database, Gauge, HardDrive, Layers3, MemoryStick, Network, Pencil, Plus, RefreshCw, Server, ShieldCheck, SlidersHorizontal, Thermometer, Trash2, Wifi } from 'lucide-react'
import Sidebar from './components/Sidebar'
import HostModal from './components/HostModal'
import MetricCard from './components/MetricCard'
import SectionCard from './components/SectionCard'
import LineChart from './components/LineChart'
import { DEFAULT_HOSTS, STORAGE_KEY, SELECTED_HOST_KEY } from './data/defaultHosts'
import { fetchResources, getResourceUrl } from './lib/api'
import { clampPercent, deriveNetworkRate, formatBytes, formatDate, formatDuration, formatPercent, formatRate } from './lib/format'

const SAMPLE_URL = '/arundhati-sample.json'

function readHosts() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return Array.isArray(value) && value.length ? value : DEFAULT_HOSTS
  } catch { return DEFAULT_HOSTS }
}

function readSelected(hosts) {
  const saved = localStorage.getItem(SELECTED_HOST_KEY)
  return hosts.some((h) => h.id === saved) ? saved : hosts[0]?.id
}

function toHistory(sample, previous) {
  const next = {
    ts: Number(sample?.timestamp_unix || Math.floor(Date.now()/1000)),
    cpu: Number(sample?.cpu?.global_usage_percent || 0),
    memory: Number(sample?.memory?.used_percent || 0),
    networkRx: 0,
    networkTx: 0,
  }
  if (previous) {
    const prevNet = previous.networks || []
    const currentNet = sample?.networks || []
    const rx = currentNet.reduce((a,n)=>a+Number(n.received_bytes||0),0)
    const tx = currentNet.reduce((a,n)=>a+Number(n.transmitted_bytes||0),0)
    const prevRx = prevNet.reduce((a,n)=>a+Number(n.received_bytes||0),0)
    const prevTx = prevNet.reduce((a,n)=>a+Number(n.transmitted_bytes||0),0)
    const elapsed = Math.max(.5, next.ts - Number(previous.timestamp_unix || next.ts))
    next.networkRx = deriveNetworkRate(prevRx, rx, elapsed)
    next.networkTx = deriveNetworkRate(prevTx, tx, elapsed)
  }
  return next
}

function StatBar({ value, tone='blue' }) {
  const toneClass = tone === 'rose' ? 'bg-rose-400' : tone === 'amber' ? 'bg-amber-400' : tone === 'emerald' ? 'bg-emerald-400' : 'bg-blue-500'
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${toneClass}`} style={{width:`${clampPercent(value)}%`}}/></div>
}

function EmptyVM({ hasSignals }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-6">
    <div className="flex items-start gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-500"><Box size={17}/></div><div><div className="font-semibold text-slate-800">VM details are not available</div><div className="mt-1 text-sm text-slate-500">{hasSignals ? 'The host exposes QEMU/libvirt signals, but the agent could not read its libvirt domain list. Check that virsh is installed and that the agent service user can access the libvirt connection.' : 'The agent did not report virtualization details for this host.'}</div></div></div>
  </div>
}

function LandingPage({ hosts, section, onNavigate, onAdd, onOpen, onEdit, onDelete }) {
  if (section === 'settings') {
    return <LandingShell section={section} onNavigate={onNavigate}>
      <div className="max-w-3xl">
        <PageHeading eyebrow="Workspace" title="Settings" description="Manage how this local inventory workspace behaves." />
        <div className="card mt-8 divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-6 p-5"><div><div className="font-semibold text-slate-800">Local inventory</div><div className="mt-1 text-sm text-slate-500">Server entries are stored in this browser and are not sent to a central service.</div></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Enabled</span></div>
          <div className="flex items-center justify-between gap-6 p-5"><div><div className="font-semibold text-slate-800">Refresh interval</div><div className="mt-1 text-sm text-slate-500">Server dashboards poll their agent every five seconds.</div></div><span className="text-sm font-semibold text-slate-700">5 seconds</span></div>
        </div>
      </div>
    </LandingShell>
  }

  if (section === 'about') {
    return <LandingShell section={section} onNavigate={onNavigate}>
      <div className="max-w-3xl">
        <PageHeading eyebrow="InfraVu" title="About" description="A focused inventory and monitoring workspace for data centers, hosts, and virtual machines." />
        <div className="card mt-8 p-6"><div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white"><Activity size={20}/></div><div><div className="font-semibold text-slate-800">Phase 1 workspace</div><p className="mt-2 text-sm leading-6 text-slate-500">InfraVu keeps your inventory close at hand and connects directly to the Rust resource agent installed on each server. API synchronization and richer virtualization workflows are planned for the next phase.</p></div></div></div>
      </div>
    </LandingShell>
  }

  return <LandingShell section={section} onNavigate={onNavigate}>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <PageHeading eyebrow="Infrastructure inventory" title="Servers" description="All registered hosts in this workspace." />
      <button onClick={onAdd} className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Plus size={17}/>Add server</button>
    </div>

    <div className="mt-8 grid grid-cols-3 gap-4">
      <InventoryStat label="Registered servers" value={hosts.length} icon={Server}/>
      <InventoryStat label="Agent endpoint" value="Direct" icon={Activity}/>
      <InventoryStat label="Storage" value="Local" icon={SlidersHorizontal}/>
    </div>

    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-[.14em] text-slate-400">Registered servers</h2><span className="text-xs text-slate-400">{hosts.length} total</span></div>
      <div className="space-y-3">
        {hosts.map((item) => <ServerListItem key={item.id} host={item} onOpen={()=>onOpen(item.id)} onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item.id)}/>) }
        {!hosts.length && <div className="card border-dashed p-10 text-center"><Server size={25} className="mx-auto text-slate-300"/><div className="mt-3 font-semibold text-slate-700">No servers registered</div><div className="mt-1 text-sm text-slate-400">Add your first agent endpoint to start monitoring.</div><button onClick={onAdd} className="mt-5 h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Add server</button></div>}
      </div>
    </section>
  </LandingShell>
}

function LandingShell({ section, onNavigate, children }) {
  return <div className="flex min-h-screen bg-[#f6f8fb]"><Sidebar mode="landing" activeSection={section} onNavigate={onNavigate}/><main className="min-w-0 flex-1"><header className="border-b border-slate-200/70 bg-[#f6f8fb]/90 px-8 py-5"><div className="mx-auto max-w-[1500px] text-sm font-semibold text-slate-400">InfraVu <span className="px-2 text-slate-300">/</span> Inventory</div></header><div className="mx-auto max-w-[1500px] px-8 pb-12 pt-10">{children}</div></main></div>
}

function PageHeading({ eyebrow, title, description }) {
  return <div><div className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">{eyebrow}</div><h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>
}

function InventoryStat({ label, value, icon: Icon }) {
  return <div className="card flex items-center gap-4 p-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={18}/></div><div><div className="text-2xl font-bold text-slate-900">{value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-[.1em] text-slate-400">{label}</div></div></div>
}

function ServerListItem({ host, onOpen, onEdit, onDelete }) {
  return <div className="card group flex items-center gap-4 p-4 transition hover:border-blue-200 hover:shadow-md"><button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-4 text-left"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white"><Server size={20}/></div><span className="min-w-0"><span className="block truncate font-bold text-slate-800">{host.name}</span><span className="mt-1 block truncate text-sm text-slate-400">{host.protocol || 'http'}://{host.host}:{host.port}{host.resourcePath || '/api/resources'}</span></span></button><span className="hidden items-center gap-2 text-xs text-slate-400 md:flex"><span className="h-2 w-2 rounded-full bg-slate-300"/>Agent endpoint</span><button onClick={onEdit} title={`Edit ${host.name}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={15}/></button><button onClick={onDelete} title={`Delete ${host.name}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15}/></button><button onClick={onOpen} className="hidden rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 sm:block">Open dashboard</button></div>
}

export default function App() {
  const [hosts, setHosts] = useState(readHosts)
  const [selectedId, setSelectedId] = useState(() => readSelected(readHosts()))
  const [view, setView] = useState('landing')
  const [landingSection, setLandingSection] = useState('dashboard')
  const [serverTab, setServerTab] = useState('general')
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastError, setLastError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showHostModal, setShowHostModal] = useState(false)
  const [editingHost, setEditingHost] = useState(null)
  const [sampleMode, setSampleMode] = useState(false)

  const host = useMemo(() => hosts.find((h)=>h.id===selectedId) || hosts[0], [hosts, selectedId])

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(hosts)) },[hosts])
  useEffect(()=>{ if(selectedId) localStorage.setItem(SELECTED_HOST_KEY, selectedId) },[selectedId])

  const load = useCallback(async ({initial=false}={}) => {
    if (!host) return
    setRefreshing(true)
    if (initial) setLoading(true)
    try {
      const result = sampleMode ? await fetch('/arundhati-sample.json', {cache:'no-store'}).then(r=>r.json()) : await fetchResources(host)
      const nextHistory = toHistory(result, data)
      setData(result)
      setHistory((items)=>[...items, nextHistory].slice(-36))
      setLastRefresh(new Date())
      setLastError('')
    } catch (error) {
      setLastError(error?.message || 'Unable to reach agent')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [host, sampleMode, data])

  useEffect(()=>{
    if (view === 'server') load({initial:true})
  }, [view, selectedId, sampleMode])
  useEffect(()=>{
    if (view !== 'server') return undefined
    const timer=setInterval(()=>load(), 5000)
    return ()=>clearInterval(timer)
  }, [load, view])

  const diskUsed = useMemo(()=>{
    const disks=data?.disks||[]
    const total=disks.reduce((a,d)=>a+Number(d.total_bytes||0),0)
    const used=disks.reduce((a,d)=>a+Number(d.used_bytes||0),0)
    return {total,used,percent: total?used/total*100:0}
  },[data])

  const totalNetwork = useMemo(()=>{
    return (data?.networks||[]).reduce((a,n)=>({rx:a.rx+Number(n.received_bytes||0),tx:a.tx+Number(n.transmitted_bytes||0)}),{rx:0,tx:0})
  },[data])

  const netCurrent = history.at(-1) || {}
  const labels = history.map((h)=>new Date(h.ts*1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))
  const cpuValues = history.map((h)=>h.cpu)
  const memValues = history.map((h)=>h.memory)
  const rxValues = history.map((h)=>h.networkRx/1024/1024)
  const txValues = history.map((h)=>h.networkTx/1024/1024)

  const topProcesses = useMemo(()=>[...(data?.processes||[])].sort((a,b)=>Number(b.cpu_percent||0)-Number(a.cpu_percent||0)).slice(0,7),[data])
  const hasVMSignals = useMemo(()=>Boolean((data?.virtualization) || (data?.networks||[]).some((n)=>String(n.interface).startsWith('vnet')) || (data?.processes||[]).some((p)=>String(p.name).includes('qemu-system'))),[data])

  function saveHost(item) {
    if (editingHost) {
      setHosts((current)=>current.map((entry)=>entry.id===item.id ? item : entry))
    } else {
      setHosts((current)=>[...current,item])
    }
    setSelectedId(item.id)
    setEditingHost(null)
  }

  function removeHost(id) {
    const target = hosts.find((entry)=>entry.id===id)
    if (!target || !window.confirm(`Delete ${target.name} from this inventory?`)) return
    const remaining=hosts.filter((entry)=>entry.id!==id)
    setHosts(remaining)
    if (selectedId === id) {
      setSelectedId(remaining[0]?.id)
      setView('landing')
      setLandingSection('dashboard')
    }
  }

  function openHost(id) {
    setSelectedId(id)
    setServerTab('general')
    setHistory([])
    setData(null)
    setView('server')
  }

  function navigateLanding(section) {
    setLandingSection(section)
    setView('landing')
  }

  if (view === 'landing' || !host) return <>
    <LandingPage hosts={hosts} section={landingSection} onNavigate={navigateLanding} onAdd={()=>{setEditingHost(null);setShowHostModal(true)}} onOpen={openHost} onEdit={(item)=>{setEditingHost(item);setShowHostModal(true)}} onDelete={removeHost}/>
    <HostModal open={showHostModal} onClose={()=>{setShowHostModal(false);setEditingHost(null)}} onSave={saveHost} initialHost={editingHost}/>
  </>

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar mode="server" activeSection={serverTab} onNavigate={setServerTab} onBack={()=>navigateLanding('dashboard')} />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f6f8fb]/90 px-8 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative min-w-0"><div className="text-xl font-bold tracking-tight text-slate-900">Overview</div><div className="text-xs text-slate-400">Real-time view of your server resources</div></div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={()=>setSampleMode((v)=>!v)} className={`h-9 rounded-xl border px-3 text-xs font-semibold transition ${sampleMode?'border-blue-200 bg-blue-50 text-blue-700':'border-slate-200 bg-white text-slate-500 hover:text-slate-800'}`}>{sampleMode?'Demo data':'Live API'}</button>
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 xl:flex"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>{host.name}<span className="text-slate-300">•</span><span className="max-w-[190px] truncate text-xs text-slate-400">{host.host}:{host.port}</span><ChevronDown size={14} className="text-slate-400"/></div>
              <button onClick={()=>load()} disabled={refreshing} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 disabled:opacity-60" title="Refresh"><RefreshCw size={16} className={refreshing?'animate-spin':''}/></button>
              <button onClick={()=>{setEditingHost(null);setShowHostModal(true)}} className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Plus size={16}/>Add server</button>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-200/70 bg-white px-8">
          <div className="mx-auto flex max-w-[1500px] items-center gap-6">
            {[['general', 'General'], ['vms', 'Virtual Machines']].map(([id, label]) => <button key={id} onClick={()=>setServerTab(id)} className={`border-b-2 px-1 py-3 text-sm font-semibold transition ${serverTab===id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>{label}</button>)}
          </div>
        </div>

        <div className="mx-auto max-w-[1500px] px-8 pb-10 pt-6">
          {lastError && <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><div className="flex items-center gap-2"><AlertTriangle size={16}/><span><strong>Agent unavailable.</strong> {lastError}</span></div><div className="text-xs text-amber-700">{getResourceUrl(host)}</div></div>}

          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-[14px] bg-slate-900 text-white"><Server size={20}/></div><div><div className="text-lg font-bold text-slate-900">{data?.system?.hostname || host.name}</div><div className="text-sm text-slate-500">{data?.system?.os_name || 'Linux'} {data?.system?.os_version || ''} · {data?.system?.kernel_version || ''}</div></div></div>
            <div className="flex items-center gap-4 text-xs text-slate-400"><span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${lastError?'bg-rose-500':'bg-emerald-500'}`}></span>{lastError?'Offline':'Connected'}</span><span>Last updated {lastRefresh?lastRefresh.toLocaleTimeString():'--:--:--'}</span><button onClick={()=>removeHost(host.id)} title="Delete server" className="rounded-lg p-2 text-slate-300 hover:bg-white hover:text-rose-500"><Trash2 size={15}/></button></div>
          </div>

          <div className={`grid grid-cols-4 gap-4 ${serverTab==='general'?'':'hidden'}`}>
            <MetricCard title="CPU Usage" value={formatPercent(data?.cpu?.global_usage_percent)} subtitle={`${data?.system?.physical_core_count ?? '--'} / ${data?.system?.logical_cpu_count ?? '--'} cores`} tone="emerald" icon={Cpu} progress={data?.cpu?.global_usage_percent}/>
            <MetricCard title="Memory Usage" value={formatPercent(data?.memory?.used_percent)} subtitle={`${formatBytes(data?.memory?.used_bytes)} / ${formatBytes(data?.memory?.total_bytes)}`} tone="violet" icon={MemoryStick} progress={data?.memory?.used_percent}/>
            <MetricCard title="Disk Usage" value={formatPercent(diskUsed.percent)} subtitle={`${formatBytes(diskUsed.used)} / ${formatBytes(diskUsed.total)}`} tone="blue" icon={HardDrive} progress={diskUsed.percent}/>
            <MetricCard title="Network" value={formatRate(netCurrent.networkRx+netCurrent.networkTx)} subtitle={`↓ ${formatRate(netCurrent.networkRx)}  ↑ ${formatRate(netCurrent.networkTx)}`} tone="rose" icon={Network}/>
          </div>

          <div id="overview" className={`section-anchor mt-4 grid grid-cols-[1.05fr_.95fr] gap-4 ${serverTab==='general'?'':'hidden'}`}>
            <SectionCard id="system" title="System Information" icon={Server} action={<span className="text-xs font-semibold text-blue-600">Host details</span>}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {[
                  ['Hostname', data?.system?.hostname],
                  ['Operating system', `${data?.system?.os_name||'--'} ${data?.system?.os_version||''}`],
                  ['Kernel', data?.system?.kernel_long_version || data?.system?.kernel_version],
                  ['Uptime', formatDuration(data?.system?.uptime_seconds)],
                  ['CPU', data?.cpu?.cpus?.[0]?.brand || '--'],
                  ['Logical CPUs', data?.system?.logical_cpu_count],
                  ['Memory', formatBytes(data?.memory?.total_bytes)],
                  ['Boot time', data?.system?.boot_time_unix ? formatDate(data.system.boot_time_unix) : '--'],
                ].map(([k,v])=><div key={k} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2"><span className="text-slate-400">{k}</span><span className="max-w-[68%] text-right font-semibold text-slate-700">{v ?? '--'}</span></div>)}
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-500"><CalendarClock size={15}/><span>Snapshot timestamp</span><span className="ml-auto font-semibold text-slate-700">{data?.timestamp_unix ? formatDate(data.timestamp_unix) : '--'}</span></div>
            </SectionCard>

            <SectionCard id="cpu" title="CPU Usage" icon={Gauge} action={<span className="text-xl font-bold text-slate-900">{formatPercent(data?.cpu?.global_usage_percent)}</span>}>
              <div className="h-[260px]"><LineChart labels={labels.length?labels:['Now']} values={cpuValues.length?cpuValues:[Number(data?.cpu?.global_usage_percent||0)]}/></div>
              <div className="mt-4 grid grid-cols-3 gap-3"><div className="rounded-xl bg-slate-50 px-3 py-2"><div className="text-[11px] text-slate-400">1 min load</div><div className="mt-1 font-semibold text-slate-700">{data?.cpu?.load_average?.one_minute ?? '--'}</div></div><div className="rounded-xl bg-slate-50 px-3 py-2"><div className="text-[11px] text-slate-400">5 min load</div><div className="mt-1 font-semibold text-slate-700">{data?.cpu?.load_average?.five_minutes ?? '--'}</div></div><div className="rounded-xl bg-slate-50 px-3 py-2"><div className="text-[11px] text-slate-400">15 min load</div><div className="mt-1 font-semibold text-slate-700">{data?.cpu?.load_average?.fifteen_minutes ?? '--'}</div></div></div>
            </SectionCard>
          </div>

          <div id="memory" className={`section-anchor mt-4 grid grid-cols-2 gap-4 ${serverTab==='general'?'':'hidden'}`}>
            <SectionCard title="Memory Usage" icon={MemoryStick} action={<span className="text-xl font-bold text-slate-900">{formatPercent(data?.memory?.used_percent)}</span>}>
              <div className="h-[240px]"><LineChart labels={labels.length?labels:['Now']} values={memValues.length?memValues:[Number(data?.memory?.used_percent||0)]} lineColor="#7c5cff" fillColor="rgba(124,92,255,.10)"/></div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm"><div><div className="text-xs text-slate-400">Available</div><div className="mt-1 font-semibold text-slate-700">{formatBytes(data?.memory?.available_bytes)}</div></div><div><div className="text-xs text-slate-400">Free</div><div className="mt-1 font-semibold text-slate-700">{formatBytes(data?.memory?.free_bytes)}</div></div><div><div className="text-xs text-slate-400">Swap used</div><div className="mt-1 font-semibold text-slate-700">{formatPercent(data?.swap?.used_percent)}</div></div></div>
            </SectionCard>

            <SectionCard id="disks" title="Disk Usage" icon={HardDrive} action={<span className="text-sm font-bold text-slate-800">{formatPercent(diskUsed.percent)}</span>}>
              <div className="space-y-4">
                {(data?.disks||[]).map((disk)=><div key={disk.mount_point} className="grid grid-cols-[130px_1fr_52px] items-center gap-4"><div><div className="font-semibold text-slate-700">{disk.mount_point}</div><div className="text-[11px] text-slate-400">{disk.kind} · {disk.filesystem}</div></div><div><div className="mb-1.5 flex justify-between text-xs text-slate-500"><span>{formatBytes(disk.used_bytes)} / {formatBytes(disk.total_bytes)}</span><span>{formatPercent(disk.used_percent)}</span></div><StatBar value={disk.used_percent} tone={disk.used_percent>85?'rose':disk.used_percent>70?'amber':'blue'}/></div><div className="text-right text-xs text-slate-400">{disk.read_only?'RO':'RW'}</div></div>)}
              </div>
            </SectionCard>
          </div>

          <div id="network" className={`section-anchor mt-4 grid grid-cols-[1.15fr_.85fr] gap-4 ${serverTab==='general'?'':'hidden'}`}>
            <SectionCard title="Network Traffic" icon={Network} action={<span className="text-xl font-bold text-slate-900">{formatRate(netCurrent.networkRx+netCurrent.networkTx)}</span>}>
              <div className="h-[260px]"><LineChart labels={labels.length?labels:['Now']} values={rxValues.length?rxValues:[0]} unit=" MB/s" max={Math.max(100, ...rxValues, ...txValues, 1)} lineColor="#3478f6" fillColor="rgba(52,120,246,.08)"/></div>
              <div className="mt-4 flex gap-5 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500"></span>Download {formatRate(netCurrent.networkRx)}</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-400"></span>Upload {formatRate(netCurrent.networkTx)}</span></div>
            </SectionCard>

            <SectionCard title="Interfaces" icon={Wifi} action={<span className="text-xs text-slate-400">{data?.networks?.length||0} interfaces</span>}>
              <div className="space-y-2.5">
                {(data?.networks||[]).filter(n=>n.operational_state==='Up').slice(0,6).map((n)=><div key={n.interface} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-slate-700">{n.interface}</div><div className="truncate text-[11px] text-slate-400">{n.ip_addresses?.[0]||n.mac_address}</div></div><div className="text-right text-[11px] text-slate-400"><div>↓ {formatBytes(n.received_bytes)}</div><div>↑ {formatBytes(n.transmitted_bytes)}</div></div></div>)}
                {(data?.networks||[]).filter(n=>n.operational_state==='Up').length===0 && <div className="text-sm text-slate-400">No interface marked Up.</div>}
              </div>
            </SectionCard>
          </div>

          <div id="processes" className={`section-anchor mt-4 grid grid-cols-[1.1fr_.9fr] gap-4 ${serverTab==='general'?'':'hidden'}`}>
            <SectionCard title="Top Processes by CPU" icon={Activity} action={<span className="text-xs font-semibold text-blue-600">{data?.processes?.length||0} processes</span>}>
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <div className="grid grid-cols-[74px_1fr_100px_100px] gap-3 bg-slate-50 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[.1em] text-slate-400"><span>PID</span><span>Name</span><span>CPU</span><span>Memory</span></div>
                {topProcesses.map((p)=><div key={p.pid} className="grid grid-cols-[74px_1fr_100px_100px] items-center gap-3 border-t border-slate-100 px-3 py-3 text-sm"><span className="font-mono text-xs text-slate-500">{p.pid}</span><span className="min-w-0 truncate font-semibold text-slate-700" title={p.name}>{p.name}</span><span className="flex items-center gap-2"><span className="h-1.5 flex-1 rounded-full bg-slate-100"><span className="block h-full rounded-full bg-rose-400" style={{width:`${Math.min(100,Number(p.cpu_percent||0)*2)}%`}}></span></span><span className="w-12 text-right text-xs text-slate-500">{Number(p.cpu_percent||0).toFixed(1)}%</span></span><span className="text-right text-xs text-slate-500">{formatBytes(p.memory_bytes)}</span></div>)}
              </div>
            </SectionCard>

            <SectionCard title="Temperature Sensors" icon={Thermometer} action={<span className="text-xs text-slate-400">{data?.temperatures?.length||0} sensors</span>}>
              <div className="space-y-2.5">
                {(data?.temperatures||[]).map((t)=><div key={t.label} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0 truncate text-sm font-semibold text-slate-700">{t.label}</div><div className="text-sm font-bold text-slate-900">{t.temperature_celsius==null?'--':`${t.temperature_celsius.toFixed(1)}°C`}</div></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-400" style={{width:`${Math.min(100,Number(t.temperature_celsius||0)/100*100)}%`}}/></div><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>max {t.max_celsius==null?'--':`${t.max_celsius.toFixed(1)}°C`}</span><span>{t.critical_celsius==null?'no critical':`critical ${t.critical_celsius}°C`}</span></div></div>)}
              </div>
            </SectionCard>
          </div>

          <div id="vms" className={`section-anchor mt-4 ${serverTab==='vms'?'':'hidden'}`}>
            <SectionCard title="Virtual Machines" icon={Box} action={<span className="text-xs font-semibold text-blue-600">{data?.virtualization ? `${data.virtualization.vm_count} VMs` : 'Agent data'}</span>}>
              {data?.virtualization?.vms?.length ? <div className="overflow-auto rounded-xl border border-slate-100"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[.1em] text-slate-400"><tr><th className="px-3 py-2.5">Name</th><th>State</th><th>vCPUs</th><th>Memory</th><th>Memory usage</th><th>CPU</th><th>Disk</th></tr></thead><tbody>{data.virtualization.vms.map((vm)=><tr key={vm.uuid||vm.name} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold text-slate-700">{vm.name}</td><td><span className={`rounded-full px-2 py-1 text-xs font-semibold ${vm.state==='running'?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{vm.state}</span></td><td>{vm.allocation?.vcpus??'--'}</td><td>{formatBytes(vm.allocation?.memory_max_bytes)}</td><td className="min-w-[160px]"><div className="flex items-center gap-2"><div className="flex-1"><StatBar value={vm.usage?.memory_usage_percent||0} tone={(vm.usage?.memory_usage_percent||0)>85?'rose':'emerald'}/></div><span className="w-10 text-right text-xs text-slate-500">{formatPercent(vm.usage?.memory_usage_percent)}</span></div></td><td>{formatPercent(vm.usage?.cpu_usage_percent)}</td><td>{formatBytes(vm.disks?.[0]?.capacity_bytes)}</td></tr>)}</tbody></table></div> : <EmptyVM hasSignals={hasVMSignals}/>} 
            </SectionCard>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-slate-400"><span className="flex items-center gap-2"><ShieldCheck size={14}/> Read-only monitoring dashboard</span><span>Endpoint: {getResourceUrl(host)}</span></div>
        </div>
      </main>

      <HostModal open={showHostModal} onClose={()=>{setShowHostModal(false);setEditingHost(null)}} onSave={saveHost} initialHost={editingHost}/>
    </div>
  )
}
