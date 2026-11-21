import { useEffect, useRef } from 'react'
import type { SSEEvent } from '@/types/api'

export function useSSE(url: string | null, onEvent: (e: SSEEvent) => void, deps: unknown[] = []) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!url) return
    const es = new EventSource(url)
    es.onmessage = (e) => {
      try { onEventRef.current(JSON.parse(e.data as string) as SSEEvent) } catch { /* ignore */ }
    }
    es.onerror = () => es.close()
    return () => es.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])
}
