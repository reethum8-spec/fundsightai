/**
 * Hybrid data layer for projects/funds.
 *  - Reads: Supabase JS in live mode (RLS-enforced); mock store via Flask in mock mode.
 *  - Writes: always through Flask (validation + auth + audit hooks).
 *
 * TEMPORARY: Disabled API fetching to use mock data permanently.
 */
import { useCallback } from 'react'
import { supabase, USE_MOCK } from '@/lib/supabaseClient'
import { api } from '@/lib/api'
import { useResource } from './useResource'
import { demoFunds } from '@/lib/mockData'

const REAL = !!supabase && !USE_MOCK

async function fetchFunds() {
  // TEMPORARY: Always return mock data to prevent API overrides
  return demoFunds
  
  // Original API fetching logic (disabled):
  /*
  if (REAL) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
  try {
    return await api.get('/api/funds')
  } catch (e) {
    // Backend unreachable → frontend-only mock fallback
    if (e?.status === undefined) return LOCAL_FUNDS
    throw e
  }
  */
}

export function useFunds() {
  const r = useResource(fetchFunds, [])

  const create = useCallback(async (payload) => {
    const created = await api.post('/api/funds', payload)
    r.setData(prev => [created, ...(prev || [])])
    return created
  }, [r])

  const update = useCallback(async (id, payload) => {
    const updated = await api.put(`/api/funds/${id}`, payload)
    r.setData(prev => (prev || []).map(f => f.id === id ? updated : f))
    return updated
  }, [r])

  const remove = useCallback(async (id) => {
    await api.del(`/api/funds/${id}`)
    r.setData(prev => (prev || []).filter(f => f.id !== id))
  }, [r])

  return { ...r, funds: r.data || [], create, update, remove }
}
