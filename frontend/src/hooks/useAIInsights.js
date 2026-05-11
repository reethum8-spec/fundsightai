import { api } from '@/lib/api'
import { insights as fallback } from '@/lib/mockData'
import { useResource } from './useResource'

async function fetchInsights() {
  try {
    return await api.get('/api/ai/insights')
  } catch (e) {
    if (e?.status === undefined) return fallback
    throw e
  }
}

export function useAIInsights() {
  const r = useResource(fetchInsights, [])
  return { ...r, insights: r.data || [] }
}
