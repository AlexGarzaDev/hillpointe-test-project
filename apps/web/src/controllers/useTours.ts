import { useState, useCallback } from 'react'
import type { Tour, TourOutcome } from '../models/tour'

export function useTours(initial: Tour[] = []) {
  const [tours, setTours] = useState<Tour[]>(initial)

  const scheduleTour = useCallback((tour: Omit<Tour, 'id' | 'outcome'>) => {
    const next: Tour = { ...tour, id: crypto.randomUUID(), outcome: null }
    setTours((prev) => [...prev, next])
    return next
  }, [])

  const recordOutcome = useCallback((id: string, outcome: TourOutcome) => {
    setTours((prev) =>
      prev.map((t) => (t.id === id ? { ...t, outcome } : t)),
    )
  }, [])

  const nextTourFor = useCallback(
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

  return { tours, scheduleTour, recordOutcome, nextTourFor }
}
