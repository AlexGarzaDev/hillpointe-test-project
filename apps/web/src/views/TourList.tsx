import type { Tour, TourOutcome } from '../models/tour'
import type { Unit } from '../models/unit'

interface TourListProps {
  tours: Tour[]
  units: Unit[]
  prospectId: string
  onRecordOutcome: (tourId: string, outcome: TourOutcome) => Promise<void>
}

export function TourList({
  tours,
  units,
  prospectId,
  onRecordOutcome,
}: TourListProps) {
  const prospectTours = tours.filter((t) => t.prospectId === prospectId)

  if (prospectTours.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No tours scheduled.</p>
  }

  return (
    <div className="space-y-3">
      {prospectTours.map((tour) => {
        const unit = units.find((u) => u.id === tour.unitId)
        const scheduled = new Date(tour.scheduledTime)
        const timeStr = scheduled.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <div
            key={tour.id}
            className={`flex items-center justify-between rounded-xl border p-3 ${
              tour.outcome
                ? 'border-[var(--border)] bg-[var(--surface)] opacity-60'
                : 'border-[var(--border)] bg-white'
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--ink)]">
                {unit?.name || 'Unknown unit'} @ {timeStr}
              </p>
              {tour.outcome && (
                <p className="mt-1 text-xs font-semibold capitalize text-[var(--muted)]">
                  Outcome: {tour.outcome}
                </p>
              )}
            </div>

            {!tour.outcome && (
              <div className="ml-3 flex gap-1">
                <button
                  onClick={() =>
                    void onRecordOutcome(tour.id, 'completed')
                  }
                  className="text-xs rounded-lg bg-green-100 px-2 py-1 font-medium text-green-700 transition hover:bg-green-200"
                >
                  Done
                </button>
                <button
                  onClick={() =>
                    void onRecordOutcome(tour.id, 'no_show')
                  }
                  className="text-xs rounded-lg bg-amber-100 px-2 py-1 font-medium text-amber-700 transition hover:bg-amber-200"
                >
                  No Show
                </button>
                <button
                  onClick={() =>
                    void onRecordOutcome(tour.id, 'cancelled')
                  }
                  className="text-xs rounded-lg bg-red-100 px-2 py-1 font-medium text-red-700 transition hover:bg-red-200"
                >
                  ✕ Cancelled
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
