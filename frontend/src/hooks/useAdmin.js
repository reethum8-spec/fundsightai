import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useResource } from './useResource'

async function fetchUsers() {
  try { return await api.get('/api/admin/users') }
  catch (e) { if (e?.status === undefined) return []; throw e }
}

async function fetchMetrics() {
  try { return await api.get('/api/admin/metrics') }
  catch (e) { if (e?.status === undefined) return null; throw e }
}

async function fetchAudit(limit = 100) {
  try { return await api.get(`/api/admin/audit?limit=${limit}`) }
  catch (e) { if (e?.status === undefined) return []; throw e }
}

async function fetchFlagged() {
  try { return await api.get('/api/admin/flagged') }
  catch (e) { if (e?.status === undefined) return []; throw e }
}

export function useAdmin() {
  const u = useResource(fetchUsers, [])
  const m = useResource(fetchMetrics, [])
  const a = useResource(fetchAudit, [])
  const f = useResource(fetchFlagged, [])

  const setRole = useCallback(async (uid, role) => {
    const updated = await api.put(`/api/admin/users/${uid}/role`, { role })
    u.setData(prev => prev.map(x => x.id === uid ? updated : x))
    return updated
  }, [u])

  const removeUser = useCallback(async (uid) => {
    await api.del(`/api/admin/users/${uid}`)
    u.setData(prev => prev.filter(x => x.id !== uid))
  }, [u])

  return {
    users: { ...u, data: u.data || [] },
    metrics: { ...m, data: m.data },
    audit: { ...a, data: a.data || [] },
    flagged: { ...f, data: f.data || [] },
    setRole, removeUser,
  }
}
