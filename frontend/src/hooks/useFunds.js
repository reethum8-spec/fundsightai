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
// so the UI keeps working frontend-only. Updated to match overspending scenario.
const LOCAL_FUNDS = [
  { id: 'f-edu', project_name: 'Rural Education Initiative', category: 'Education', budget: 56_00_000, beneficiaries_count: 5200, deadline: '2026-12-31', spent: 68_20_000, created_at: new Date().toISOString() },
  { id: 'f-hlt', project_name: 'Mobile Health Clinics', category: 'Healthcare', budget: 42_00_000, beneficiaries_count: 11800, deadline: '2026-09-30', spent: 51_30_000, created_at: new Date().toISOString() },
  { id: 'f-ops', project_name: 'Field Operations', category: 'Operations', budget: 32_00_000, beneficiaries_count: 0, deadline: '2026-12-31', spent: 41_80_000, created_at: new Date().toISOString() },
  { id: 'f-rnd', project_name: 'Curriculum R&D', category: 'R&D', budget: 26_00_000, beneficiaries_count: 0, deadline: '2026-11-30', spent: 31_40_000, created_at: new Date().toISOString() },
  { id: 'f-out', project_name: 'Community Outreach', category: 'Outreach', budget: 24_00_000, beneficiaries_count: 8400, deadline: '2026-12-31', spent: 28_90_000, created_at: new Date().toISOString() },
  { id: 'f-oth', project_name: 'Administration & Compliance', category: 'Other', budget: 20_00_000, beneficiaries_count: 0, deadline: '2026-12-31', spent: 16_90_000, created_at: new Date().toISOString() },
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
