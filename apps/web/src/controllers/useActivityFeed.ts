import { useState, useEffect, useCallback } from 'react'
import type { ActivityEvent } from '../models/activity-event'

export function useActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/activity')
      const json = await res.json() as { data: ActivityEvent[] }
      setEvents(json.data ?? [])
    } catch (err) {
      console.error('Failed to fetch activity', err)
    }
  }, [])

  useEffect(() => { void fetchEvents() }, [fetchEvents])

  const eventsFor = useCallback(
    (prospectId: string) => events.filter((e) => e.prospectId === prospectId),
    [events],
  )

  return { events, eventsFor, refetch: fetchEvents }
}
