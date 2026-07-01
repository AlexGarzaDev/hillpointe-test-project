import { useState, useCallback } from 'react'
import type { Prospect, ProspectStatus } from '../models/prospect'
import type { Unit } from '../models/unit'
import { createProspectSchema, createUnitSchema } from '@hillpointe/shared'
import { useProspects } from '../controllers/useProspects'
import { useTasks } from '../controllers/useTasks'
import { useUnits } from '../controllers/useUnits'
import { useActivityFeed } from '../controllers/useActivityFeed'
import { useTours } from '../controllers/useTours'
import { ProspectBoard } from './ProspectBoard'
import { TaskList } from './TaskList'
import { ActivityFeed } from './ActivityFeed'
import { TourList } from './TourList'
import type { TaskState } from '../models/task'

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-50 border-green-200 text-green-700',
  held: 'bg-amber-50 border-amber-200 text-amber-700',
  leased: 'bg-slate-100 border-slate-300 text-slate-500',
}

export function CrmView() {
  const { units, addUnit, deleteUnit, refetch: refetchUnits } = useUnits()
  const { tasks, setTaskState, refetch: refetchTasks } = useTasks()
  const { eventsFor, refetch: refetchActivity } = useActivityFeed()
  const { tours, scheduleTour, recordOutcome, refetch: refetchTours } = useTours()
  const { prospects, isLoading, error, addProspect, deleteProspect, transitionStatus } = useProspects()

  const [selected, setSelected] = useState<Prospect | null>(null)
  const [showAddProspect, setShowAddProspect] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [prospectErrors, setProspectErrors] = useState<Record<string, string>>({})
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [newUnitName, setNewUnitName] = useState('')
  const [unitErrors, setUnitErrors] = useState<Record<string, string>>({})
  const [showScheduleTour, setShowScheduleTour] = useState(false)
  const [tourUnitId, setTourUnitId] = useState('')
  const [tourTime, setTourTime] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | ''>('')
  const [filterUnitId, setFilterUnitId] = useState('')

  const handleTransition = useCallback(
    async (prospectId: string, toStatus: ProspectStatus) => {
      await transitionStatus(prospectId, toStatus)
      await Promise.all([refetchTasks(), refetchActivity(), refetchUnits()])
      setSelected((prev) => (prev?.id === prospectId ? { ...prev, status: toStatus } : prev))
    },
    [transitionStatus, refetchTasks, refetchActivity, refetchUnits],
  )

  const handleAddProspect = useCallback(async () => {
    setProspectErrors({})
    const result = createProspectSchema.safeParse({
      name: newName.trim(),
      email: newEmail.trim(),
      assignedUnitId: null,
    })
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string
        errors[path] = err.message
      })
      setProspectErrors(errors)
      return
    }
    try {
      await addProspect({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone ?? undefined,
        assignedUnitId: result.data.assignedUnitId ?? null,
      })
      setNewName('')
      setNewEmail('')
      setShowAddProspect(false)
    } catch {
      setProspectErrors({ submit: 'Failed to add prospect' })
    }
  }, [newName, newEmail, addProspect])

  const handleDeleteProspect = useCallback(async (id: string) => {
    await deleteProspect(id)
    setSelected((prev) => (prev?.id === id ? null : prev))
  }, [deleteProspect])

  const handleAddUnit = useCallback(async () => {
    setUnitErrors({})
    const result = createUnitSchema.safeParse({
      name: newUnitName.trim(),
      status: 'available' as const,
    })
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string
        errors[path] = err.message
      })
      setUnitErrors(errors)
      return
    }
    try {
      await addUnit(result.data)
      setNewUnitName('')
      setShowAddUnit(false)
    } catch {
      setUnitErrors({ submit: 'Failed to add unit' })
    }
  }, [newUnitName, addUnit])

  const handleScheduleTour = useCallback(async () => {
    if (!selected || !tourUnitId || !tourTime) return
    try {
      await scheduleTour({
        prospectId: selected.id,
        unitId: tourUnitId,
        scheduledTime: new Date(tourTime).toISOString(),
      })
      setShowScheduleTour(false)
      setTourUnitId('')
      setTourTime('')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to schedule tour')
    }
  }, [selected, tourUnitId, tourTime, scheduleTour])

  const handleRecordOutcome = useCallback(
    async (tourId: string, outcome: any) => {
      await recordOutcome(tourId, outcome)
      await Promise.all([refetchTasks(), refetchActivity(), refetchTours()])
    },
    [recordOutcome, refetchTasks, refetchActivity, refetchTours],
  )

  const selectedTasks = selected ? tasks.filter((t) => t.prospectId === selected.id) : []
  const selectedEvents = selected ? eventsFor(selected.id) : []

  // Filter prospects by search query and status/unit filters
  const filteredProspects = prospects.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !filterStatus || p.status === filterStatus
    const matchesUnit = !filterUnitId || p.assignedUnitId === filterUnitId
    return matchesSearch && matchesStatus && matchesUnit
  })

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              Leasing CRM
            </h1>
            {isLoading && <p className="mt-1 text-xs text-[var(--muted)]">Loading prospects...</p>}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
          <button
            className="rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
            onClick={() => setShowAddProspect((v) => !v)}
          >
            + Add Prospect
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Add prospect form */}
        {showAddProspect && (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold">New Prospect</h2>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[180px]">
                <input
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ink)] ${
                    prospectErrors.name ? 'border-red-300 bg-red-50' : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                  placeholder="Full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                {prospectErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{prospectErrors.name}</p>
                )}
              </div>
              <div className="flex-1 min-w-[180px]">
                <input
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ink)] ${
                    prospectErrors.email ? 'border-red-300 bg-red-50' : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                  placeholder="Email address"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                {prospectErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{prospectErrors.email}</p>
                )}
              </div>
              <button
                className="rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 disabled:opacity-40"
                disabled={!newName.trim() || !newEmail.trim()}
                onClick={() => { void handleAddProspect() }}
              >
                Add
              </button>
            </div>
            {prospectErrors.submit && (
              <p className="mt-3 text-sm text-red-600">{prospectErrors.submit}</p>
            )}
          </div>
        )}

        {/* Units panel */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Units
            </h2>
            <button
              className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-80"
              onClick={() => setShowAddUnit((v) => !v)}
            >
              + Add Unit
            </button>
          </div>

          {showAddUnit && (
            <div className="mb-3 flex flex-wrap gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <div className="flex-1 min-w-[160px]">
                <input
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ink)] ${
                    unitErrors.name ? 'border-red-300 bg-red-50' : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                  placeholder="Unit name (e.g. 301A)"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                />
                {unitErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{unitErrors.name}</p>
                )}
              </div>
              <button
                className="rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 disabled:opacity-40"
                disabled={!newUnitName.trim()}
                onClick={() => { void handleAddUnit() }}
              >
                Add
              </button>
              {unitErrors.submit && (
                <p className="w-full text-sm text-red-600">{unitErrors.submit}</p>
              )}
            </div>
          )}

          {units.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No units yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {units.map((unit: Unit) => (
                <div
                  key={unit.id}
                  className={`relative rounded-2xl border p-3 ${STATUS_COLORS[unit.status] ?? ''}`}
                >
                  <button
                    className="absolute right-2 top-2 text-[10px] opacity-40 hover:opacity-80"
                    onClick={() => { void deleteUnit(unit.id) }}
                    aria-label="Delete unit"
                  >
                    ✕
                  </button>
                  <p className="truncate pr-4 text-sm font-semibold">{unit.name}</p>
                  <p className="mt-1 text-xs capitalize">{unit.status}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pipeline board with search and filters */}
        <section>
          <div className="mb-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Pipeline
            </h2>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[200px] rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ink)]"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ProspectStatus | '')}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ink)]"
              >
                <option value="">All statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="tour_scheduled">Tour Scheduled</option>
                <option value="toured">Toured</option>
                <option value="application">Application</option>
                <option value="leased">Leased</option>
                <option value="lost">Lost</option>
              </select>
              <select
                value={filterUnitId}
                onChange={(e) => setFilterUnitId(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ink)]"
              >
                <option value="">All units</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {(searchQuery || filterStatus || filterUnitId) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('')
                    setFilterUnitId('')
                  }}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--surface)]"
                >
                  Clear filters
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--muted)]">
              Showing {filteredProspects.length} of {prospects.length} prospects
            </p>
          </div>
          {isLoading ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
              <p className="text-sm text-[var(--muted)]">Loading prospects...</p>
            </div>
          ) : filteredProspects.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
              <p className="text-sm text-[var(--muted)]">
                {searchQuery || filterStatus || filterUnitId
                  ? 'No prospects match your filters'
                  : 'No prospects yet. Add one to get started!'}
              </p>
            </div>
          ) : (
            <ProspectBoard
              prospects={filteredProspects}
              onTransition={handleTransition}
              onSelectProspect={setSelected}
            />
          )}
        </section>

        {/* Detail panel for selected prospect */}
        {selected && (
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{selected.name}</h2>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                  onClick={() => { void handleDeleteProspect(selected.id) }}
                >
                  Delete
                </button>
                <button
                  className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
                  onClick={() => setSelected(null)}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Tasks</p>
                <TaskList
                  tasks={selectedTasks}
                  onStateChange={(id, state: TaskState) => { void setTaskState(id, state) }}
                />
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Tours</p>
                <div className="space-y-3">
                  <TourList
                    tours={tours}
                    units={units}
                    prospectId={selected.id}
                    onRecordOutcome={handleRecordOutcome}
                  />
                  <button
                    className="w-full rounded-lg bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-80"
                    onClick={() => setShowScheduleTour((v) => !v)}
                  >
                    {showScheduleTour ? 'Cancel' : '+ Schedule Tour'}
                  </button>
                  {showScheduleTour && (
                    <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                      <select
                        value={tourUnitId}
                        onChange={(e) => setTourUnitId(e.target.value)}
                        className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs"
                      >
                        <option value="">Select unit...</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="datetime-local"
                        value={tourTime}
                        onChange={(e) => setTourTime(e.target.value)}
                        className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => { void handleScheduleTour() }}
                        disabled={!tourUnitId || !tourTime}
                        className="rounded-lg bg-green-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-40"
                      >
                        Schedule
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Activity</p>
                <ActivityFeed events={selectedEvents} />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
