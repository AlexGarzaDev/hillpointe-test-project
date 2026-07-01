import { useState, useEffect, useCallback } from 'react'
import type { Prospect, ProspectStatus } from '../models/prospect'

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([])

  const fetchProspects = useCallback(async () => {
    try {
      const res = await fetch('/prospects')
      const json = await res.json() as { data: Prospect[] }
      setProspects(json.data ?? [])
    } catch (err) {
      console.error('Failed to fetch prospects', err)
    }
  }, [])

  useEffect(() => { void fetchProspects() }, [fetchProspects])

  const addProspect = useCallback(async (data: {
    name: string
    email: string
    phone?: string
    assignedUnitId: string | null
  }): Promise<Prospect> => {
    const res = await fetch('/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json() as { data: Prospect }
    const prospect = json.data
    setProspects((prev) => [...prev, prospect])
    return prospect
  }, [])

  const deleteProspect = useCallback(async (id: string): Promise<void> => {
    await fetch(`/prospects/${id}`, { method: 'DELETE' })
    setProspects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const transitionStatus = useCallback(async (
    prospectId: string,
    toStatus: ProspectStatus,
  ): Promise<void> => {
    const res = await fetch(`/prospects/${prospectId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStatus }),
    })
    const json = await res.json() as { data: { prospect: Prospect } }
    const updated = json.data.prospect
    setProspects((prev) => prev.map((p) => (p.id === prospectId ? updated : p)))
  }, [])

  return { prospects, addProspect, deleteProspect, transitionStatus, refetch: fetchProspects }
}
