import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Generic data-fetching hook with abort, mounted-guard, and refresh().
 * `fetcher` must return a Promise<data>. It's recreated on `deps` change.
 */
export function useResource(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const tick = useRef(0)

  const load = useCallback(async () => {
    const myTick = ++tick.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (!mounted.current || myTick !== tick.current) return
      setData(result)
    } catch (e) {
      if (!mounted.current || myTick !== tick.current) return
      setError(e)
    } finally {
      if (mounted.current && myTick === tick.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mounted.current = true
    load()
    return () => { mounted.current = false }
  }, [load])

  return { data, error, loading, refresh: load, setData }
}
