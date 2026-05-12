import { useCallback } from 'react'
import { supabase, USE_MOCK } from '@/lib/supabaseClient'
import { api } from '@/lib/api'
import { heatmapExpenses, recentExpenses } from '@/lib/mockData'
import { useResource } from './useResource'

const REAL = !!supabase && !USE_MOCK

async function fetchExpenses(filters = {}) {
  // TEMPORARY: Always return mock data to prevent API overrides
  return recentExpenses
  
  // Original API fetching logic (disabled):
  /*
  if (REAL) {
    let q = supabase.from('expenses').select('*').order('occurred_at', { ascending: false })
    if (filters.category) q = q.eq('category', filters.category)
    if (filters.from) q = q.gte('occurred_at', filters.from)
    if (filters.to) q = q.lte('occurred_at', filters.to)
    const { data, error } = await q
    if (error) throw error
    return data
  }
  try {
    return await api.get('/api/expenses', { query: filters })
  } catch (e) {
    if (e?.status === undefined) return heatmapExpenses
    throw e
  }
  */
}

export function useExpenses(filters = {}) {
  const filterKey = JSON.stringify(filters)
  const r = useResource(() => fetchExpenses(filters), [filterKey])

  const create = useCallback(async (payload) => {
    const created = await api.post('/api/expenses', payload)
    r.setData(prev => [created, ...(prev || [])])
    return created
  }, [r])

  const update = useCallback(async (id, payload) => {
    const updated = await api.put(`/api/expenses/${id}`, payload)
    r.setData(prev => (prev || []).map(e => e.id === id ? updated : e))
    return updated
  }, [r])

  const remove = useCallback(async (id) => {
    await api.del(`/api/expenses/${id}`)
    r.setData(prev => (prev || []).filter(e => e.id !== id))
  }, [r])

  const importCsv = useCallback(async (file) => {
    const result = await api.upload('/api/expenses/import', file)
    await r.refresh()
    return result
  }, [r])

  return { ...r, expenses: r.data || [], create, update, remove, importCsv }
}
