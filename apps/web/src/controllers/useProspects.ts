import { useState, useEffect, useCallback } from 'react'
import type { Prospect, ProspectStatus } from '../models/prospect'
import { apiUrl } from '../models/api'

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProspects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/prospects'))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { data: Prospect[] }
      setProspects(json.data ?? [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch prospects'
      setError(msg)
      console.error(msg, err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void fetchProspects() }, [fetchProspects])

  const addProspect = useCallback(async (data: {
    name: string
    email: string
    phone?: string
    assignedUnitId: string | null
  }): Promise<Prospect> => {
    try {
      const res = await fetch(apiUrl('/prospects'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { data: Prospect }
      const prospect = json.data
      setProspects((prev) => [...prev, prospect])
      return prospect
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add prospect'
      setError(msg)
      throw err
    }
  }, [])

  const deleteProspect = useCallback(async (id: string): Promise<void> => {
    // Optimistic UI: remove immediately
    const original = prospects
    setProspects((prev) => prev.filter((p) => p.id !== id))
    try {
      const res = await fetch(apiUrl(`/prospects/${id}`), { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      // Revert on error
      setProspects(original)
      const msg = err instanceof Error ? err.message : 'Failed to delete prospect'
      setError(msg)
      throw err
    }
  }, [prospects])

  const transitionStatus = useCallback(async (
    prospectId: string,
    toStatus: ProspectStatus,
  ): Promise<void> => {
    // Optimistic UI: update status immediately
    const original = prospects
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, status: toStatus } : p))
    )
    
    try {
      const res = await fetch(apiUrl(`/prospects/${prospectId}/transition`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { data: { prospect: Prospect } }
      const updated = json.data.prospect
      // Sync with server response (may have additional fields updated by pipeline)
      setProspects((prev) => prev.map((p) => (p.id === prospectId ? updated : p)))
    } catch (err) {
      // Revert on error
      setProspects(original)
      const msg = err instanceof Error ? err.message : 'Failed to transition prospect'
      setError(msg)
      throw err
    }
  }, [prospects])

  return {
    prospects,
    isLoading,
    error,
    addProspect,
    deleteProspect,
    transitionStatus,
    refetch: fetchProspects,
  }
}
