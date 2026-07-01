import { useState, useEffect, useCallback } from 'react'
import type { Unit, UnitStatus } from '../models/unit'
import { apiUrl } from '../models/api'

export function useUnits() {
  // Unit inventory is referenced by prospect assignment and tour scheduling.
  const [units, setUnits] = useState<Unit[]>([])

  const fetchUnits = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/units'))
      const json = await res.json() as { data: Unit[] }
      setUnits(json.data ?? [])
    } catch (err) {
      console.error('Failed to fetch units', err)
    }
  }, [])

  useEffect(() => { void fetchUnits() }, [fetchUnits])

  const addUnit = useCallback(async (data: { name: string; status?: UnitStatus }): Promise<Unit> => {
    // Default status is available so callers only provide a name in common case.
    const res = await fetch(apiUrl('/units'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, status: data.status ?? 'available' }),
    })
    const json = await res.json() as { data: Unit }
    const unit = json.data
    setUnits((prev) => [...prev, unit])
    return unit
  }, [])

  const updateUnitStatus = useCallback(async (id: string, status: UnitStatus): Promise<void> => {
    const res = await fetch(apiUrl(`/units/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const json = await res.json() as { data: Unit }
    setUnits((prev) => prev.map((u) => (u.id === id ? json.data : u)))
  }, [])

  const deleteUnit = useCallback(async (id: string): Promise<void> => {
    // Fire-and-forget delete; server enforces any relational constraints.
    await fetch(apiUrl(`/units/${id}`), { method: 'DELETE' })
    setUnits((prev) => prev.filter((u) => u.id !== id))
  }, [])

  return { units, addUnit, updateUnitStatus, deleteUnit, refetch: fetchUnits }
}
