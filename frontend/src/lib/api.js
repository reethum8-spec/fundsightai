/**
 * Tiny fetch wrapper that:
 *  - Prefixes VITE_API_BASE_URL
 *  - Attaches the Supabase access token (in live mode)
 *  - Surfaces structured errors via ApiError
 */
import { supabase } from './supabaseClient'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export class ApiError extends Error {
  constructor(message, { status, code, fields } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

async function authHeader() {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(method, path, { body, query, isForm } = {}) {
  const url = new URL((path.startsWith('http') ? path : BASE + path))
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    })
  }
  const headers = { ...(await authHeader()) }
  let payload
  if (body !== undefined) {
    if (isForm) {
      payload = body
    } else {
      headers['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
    }
  }
  const res = await fetch(url, { method, headers, body: payload })
  const text = await res.text()
  const data = text ? safeJson(text) : null
  if (!res.ok) {
    throw new ApiError(data?.error || `HTTP ${res.status}`, {
      status: res.status,
      code: data?.error,
      fields: data?.fields,
    })
  }
  return data
}

function safeJson(s) {
  try { return JSON.parse(s) } catch { return s }
}

export const api = {
  get:    (path, opts) => request('GET',    path, opts),
  post:   (path, body, opts) => request('POST',   path, { ...opts, body }),
  put:    (path, body, opts) => request('PUT',    path, { ...opts, body }),
  del:    (path, opts) => request('DELETE', path, opts),
  upload: (path, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('POST', path, { body: fd, isForm: true })
  },
  /** Triggers a file download for binary endpoints (PDFs etc.). */
  download: async (path, suggestedName) => {
    const url = path.startsWith('http') ? path : ((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + path)
    const headers = { ...(await authHeader()) }
    const res = await fetch(url, { headers })
    if (!res.ok) {
      throw new ApiError(`HTTP ${res.status}`, { status: res.status })
    }
    const blob = await res.blob()
    const a = document.createElement('a')
    const objUrl = URL.createObjectURL(blob)
    a.href = objUrl
    a.download = suggestedName || 'download'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objUrl)
  },
}
