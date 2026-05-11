/**
 * Hybrid data layer for projects/funds.
 *  - Reads: Supabase JS in live mode (RLS-enforced); mock store via Flask in mock mode.
 *  - Writes: always through Flask (validation + auth + audit hooks).
 */
import { useCallback } from 'react'
import { supabase, USE_MOCK } from '@/lib/supabaseClient'
import { api } from '@/lib/api'
import { useResource } from './useResource'

const REAL = !!supabase && !USE_MOCK

// Local fallback used only when backend is unreachable in mock mode,
// so the UI keeps working frontend-only.
const LOCAL_FUNDS = [
  { id: 'f-edu-001', project_name: 'Rural Education Initiative', category: 'Education', budget: 320000, beneficiaries_count: 5000, deadline: '2026-12-31', spent: 184000, created_at: new Date().toISOString() },
  { id: 'f-hlt-002', project_name: 'Mobile Health Clinics',      category: 'Healthcare', budget: 240000, beneficiaries_count: 12000, deadline: '2026-09-30', spent: 142500, created_at: new Date().toISOString() },
  { id: 'f-ops-003', project_name: 'Operations 2026',            category: 'Operations', budget: 180000, beneficiaries_count: 0, deadline: '2026-12-31', spent: 96000, created_at: new Date().toISOString() },
  { id: 'f-rnd-004', project_name: 'R&D Pilots',                  category: 'R&D',        budget: 150000, beneficiaries_count: 0, deadline: '2026-10-31', spent: 71000, created_at: new Date().toISOString() },
  { id: 'f-out-005', project_name: 'Community Outreach',          category: 'Outreach',   budget: 110000, beneficiaries_count: 8000, deadline: '2026-11-30', spent: 49000, created_at: new Date().toISOString() },
  { id: 'f-mkt-006', project_name: 'Awareness Campaigns',         category: 'Marketing',  budget: 60000, beneficiaries_count: 0, deadline: '2026-12-31', spent: 24000, created_at: new Date().toISOString() },
]

async function fetchFunds() {
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
