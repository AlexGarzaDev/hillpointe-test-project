import { useState, useCallback } from 'react'
import type { Prospect, ProspectStatus } from '../models/prospect'
import type { Unit } from '../models/unit'
import { useProspects } from '../controllers/useProspects'
import { useTasks } from '../controllers/useTasks'
import { useUnits } from '../controllers/useUnits'
import { useActivityFeed } from '../controllers/useActivityFeed'
import { ProspectBoard } from './ProspectBoard'
import { TaskList } from './TaskList'
import { ActivityFeed } from './ActivityFeed'
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
  const { prospects, addProspect, deleteProspect, transitionStatus } = useProspects()

  const [selected, setSelected] = useState<Prospect | null>(null)
  const [showAddProspect, setShowAddProspect] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [newUnitName, setNewUnitName] = useState('')

  const handleTransition = useCallback(
    async (prospectId: string, toStatus: ProspectStatus) => {
      await transitionStatus(prospectId, toStatus)
      await Promise.all([refetchTasks(), refetchActivity(), refetchUnits()])
      setSelected((prev) => (prev?.id === prospectId ? { ...prev, status: toStatus } : prev))
    },
    [transitionStatus, refetchTasks, refetchActivity, refetchUnits],
  )

  const handleAddProspect = useCallback(async () => {
    if (!newName.trim() || !newEmail.trim()) return
    await addProspect({ name: newName.trim(), email: newEmail.trim(), assignedUnitId: null })
    setNewName('')
    setNewEmail('')
    setShowAddProspect(false)
  }, [addProspect, newName, newEmail])

  const handleDeleteProspect = useCallback(async (id: string) => {
    await deleteProspect(id)
    setSelected((prev) => (prev?.id === id ? null : prev))
  }, [deleteProspect])

  const handleAddUnit = useCallback(async () => {
    if (!newUnitName.trim()) return
    await addUnit({ name: newUnitName.trim(), status: 'available' })
    setNewUnitName('')
    setShowAddUnit(false)
  }, [addUnit, newUnitName])

  const selectedTasks = selected ? tasks.filter((t) => t.prospectId === selected.id) : []
  const selectedEvents = selected ? eventsFor(selected.id) : []

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Leasing CRM
          </h1>
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
              <input
                className="flex-1 min-w-[180px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ink)]"
                placeholder="Full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="flex-1 min-w-[180px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ink)]"
                placeholder="Email address"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <button
                className="rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 disabled:opacity-40"
                disabled={!newName.trim() || !newEmail.trim()}
                onClick={() => { void handleAddProspect() }}
              >
                Add
              </button>
            </div>
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
              <input
                className="flex-1 min-w-[160px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ink)]"
                placeholder="Unit name (e.g. 301A)"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
              />
              <button
                className="rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 disabled:opacity-40"
                disabled={!newUnitName.trim()}
                onClick={() => { void handleAddUnit() }}
              >
                Add
              </button>
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

        {/* Pipeline board */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Pipeline
          </h2>
          <ProspectBoard
            prospects={prospects}
            onTransition={handleTransition}
            onSelectProspect={setSelected}
          />
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

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Tasks</p>
                <TaskList
                  tasks={selectedTasks}
                  onStateChange={(id, state: TaskState) => { void setTaskState(id, state) }}
                />
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
