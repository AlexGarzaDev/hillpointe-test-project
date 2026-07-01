import { useState, useCallback, useEffect } from 'react'
import type { Tour, TourOutcome } from '../models/tour'
import { apiUrl } from '../models/api'

export function useTours() {
  // Tour timeline drives scheduling UI and post-tour pipeline transitions.
  const [tours, setTours] = useState<Tour[]>([])

  const fetchTours = useCallback(async () => {
    const res = await fetch(apiUrl('/tours'))
    const json = await res.json()
    setTours(json.data ?? [])
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTours()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchTours])

  const scheduleTour = useCallback(async (data: { prospectId: string; unitId: string; scheduledTime: string }) => {
    const res = await fetch(apiUrl('/tours'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || 'Failed to schedule tour')
    }
    const tour = (await res.json()).data
    setTours((prev) => [...prev, tour])
    return tour
  }, [])

  const recordOutcome = useCallback(async (id: string, outcome: TourOutcome) => {
    const res = await fetch(apiUrl(`/tours/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome }),
    })
    const updated = (await res.json()).data
    setTours((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }, [])

  const nextTourFor = useCallback(
    // Pick nearest upcoming unscored tour for a prospect.
    (prospectId: string): Tour | undefined =>
      tours
        .filter((t) => t.prospectId === prospectId && t.outcome === null)
        .sort(
          (a, b) =>
            new Date(a.scheduledTime).getTime() -
            new Date(b.scheduledTime).getTime(),
        )[0],
    [tours],
  )

  return { tours, scheduleTour, recordOutcome, nextTourFor, refetch: fetchTours }
}

