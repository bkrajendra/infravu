export function normalizeHostInput(value) {
  let raw = value.trim()
  if (!raw) return ''
  if (!/^https?:\/\//i.test(raw)) raw = `http://${raw}`
  return raw.replace(/\/$/, '')
}

export function getResourceUrl(host) {
  return `${getHostOrigin(host)}${host.resourcePath || '/api/resources'}`
}

export function getHealthUrl(host) {
  return `${getHostOrigin(host)}/health`
}

function getHostOrigin(host) {
  const base = normalizeHostInput(host.host)
  const port = host.port ? `:${host.port}` : ''
  const parsed = new URL(base)
  return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : port}`
}

export async function fetchResources(host, timeoutMs = 5000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(getResourceUrl(host), {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchHealth(host, timeoutMs = 5000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(getHealthUrl(host), {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}
