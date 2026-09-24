import { useEffect, useState } from 'react'
import { X, Server, Wifi } from 'lucide-react'
import { normalizeHostInput } from '../lib/api'

const EMPTY = { id: '', name: '', host: '', port: 9100, protocol: 'http', resourcePath: '/api/resources', color: 'blue' }

export default function HostModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setForm(EMPTY); setError('') }
  }, [open])

  if (!open) return null

  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }))

  function submit(e) {
    e.preventDefault()
    const normalized = normalizeHostInput(form.host)
    if (!normalized) return setError('Enter an IP address, hostname or domain.')
    try {
      const parsed = new URL(normalized)
      const host = parsed.hostname
      const finalPort = Number(form.port || parsed.port || 9100)
      if (!Number.isFinite(finalPort) || finalPort < 1 || finalPort > 65535) throw new Error()
      onSave({ ...form, id: crypto.randomUUID(), host, port: finalPort, protocol: parsed.protocol.replace(':',''), name: form.name.trim() || host })
      onClose()
    } catch {
      setError('The host value is not valid.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-6 backdrop-blur-[3px]">
      <div className="w-full max-w-lg rounded-[22px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Server size={19}/></div>
              <div><div className="text-lg font-bold text-slate-900">Add server</div><div className="text-sm text-slate-500">Connect to a resource-monitor agent.</div></div>
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700"><X size={18}/></button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Display name</label>
            <input value={form.name} onChange={(e)=>update('name',e.target.value)} placeholder="Production KVM" className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-slate-400">IP / hostname / domain</label>
            <input value={form.host} onChange={(e)=>update('host',e.target.value)} placeholder="192.168.1.11 or host.example.com" autoFocus className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Protocol</label>
              <select value={form.protocol} onChange={(e)=>update('protocol',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option>http</option><option>https</option></select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Port</label>
              <input value={form.port} onChange={(e)=>update('port',e.target.value)} type="number" min="1" max="65535" className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Resource API path</label>
            <input value={form.resourcePath} onChange={(e)=>update('resourcePath',e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3.5 font-mono text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
          </div>

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</div>}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400"><Wifi size={14}/> Browser fetch requires agent CORS.</div>
            <div className="flex gap-2"><button type="button" onClick={onClose} className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Add server</button></div>
          </div>
        </form>
      </div>
    </div>
  )
}
