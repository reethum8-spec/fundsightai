import { api } from '@/lib/api'
import { useResource } from './useResource'

async function fetchStatus() {
  try {
    return await api.get('/api/ai/status')
  } catch {
    return { available: false, engine_loaded: false }
  }
}

export function useAIStatus() {
  const r = useResource(fetchStatus, [])
  return { ...r, status: r.data || { available: false } }
}
