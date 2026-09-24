export function formatBytes(bytes, decimals = 1) {
  const n = Number(bytes || 0)
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  const value = n / 1024 ** i
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : decimals)} ${units[i]}`
}

export function formatRate(bytesPerSec) {
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Number(totalSeconds || 0))
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  if (days) return `${days}d ${hours}h ${minutes}m`
  if (hours) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatDate(unixSeconds) {
  return new Date(Number(unixSeconds || 0) * 1000).toLocaleString([], {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function formatPercent(value) {
  const n = Number(value || 0)
  return `${n < 10 ? n.toFixed(1) : n.toFixed(0)}%`
}

export function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value || 0)))
}

export function deriveNetworkRate(previous, current, seconds) {
  if (!previous || !current || seconds <= 0) return 0
  const delta = Number(current) - Number(previous)
  return delta >= 0 ? delta / seconds : 0
}
