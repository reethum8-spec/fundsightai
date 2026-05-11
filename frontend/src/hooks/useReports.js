import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useResource } from './useResource'

async function fetchReports() {
  try { return await api.get('/api/reports') }
  catch (e) {
    if (e?.status === undefined) return []
    throw e
  }
}

export function useReports() {
  const r = useResource(fetchReports, [])

  const generate = useCallback(async (payload = {}) => {
    const created = await api.post('/api/reports/generate', payload)
    r.setData(prev => [created, ...(prev || [])])
    return created
  }, [r])

  const download = useCallback(async (report) => {
    const safe = (report.title || 'fundsight-report').replace(/[^\w\-]+/g, '_')
    await api.download(`/api/reports/${report.id}/file`, `${safe}.pdf`)
  }, [])

  return { ...r, reports: r.data || [], generate, download }
}
