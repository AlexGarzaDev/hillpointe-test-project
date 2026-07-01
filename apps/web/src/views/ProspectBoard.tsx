import type { Prospect, ProspectStatus } from '../models/prospect'

const PIPELINE_STAGES: ProspectStatus[] = [
  'new',
  'contacted',
  'tour_scheduled',
  'toured',
  'application',
  'leased',
  'lost',
]

const STAGE_LABELS: Record<ProspectStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  tour_scheduled: 'Tour Scheduled',
  toured: 'Toured',
  application: 'Application',
  leased: 'Leased',
  lost: 'Lost',
}

const STAGE_COLORS: Record<ProspectStatus, string> = {
  new: 'bg-slate-100 border-slate-300',
  contacted: 'bg-blue-50 border-blue-200',
  tour_scheduled: 'bg-violet-50 border-violet-200',
  toured: 'bg-amber-50 border-amber-200',
  application: 'bg-orange-50 border-orange-200',
  leased: 'bg-green-50 border-green-200',
  lost: 'bg-red-50 border-red-200',
}

interface ProspectBoardProps {
  prospects: Prospect[]
  onTransition: (prospectId: string, toStatus: ProspectStatus) => void
  onSelectProspect: (prospect: Prospect) => void
}

export function ProspectBoard({
  prospects,
  onTransition,
  onSelectProspect,
}: ProspectBoardProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const cards = prospects.filter((p) => p.status === stage)
        return (
          <div
            key={stage}
            className={`flex min-w-[200px] flex-col rounded-2xl border p-3 ${STAGE_COLORS[stage]}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {STAGE_LABELS[stage]}
              </span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-[var(--ink)]">
                {cards.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {cards.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onTransition={onTransition}
                  onClick={() => onSelectProspect(prospect)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline card — kept here since it's only used by the board
// ---------------------------------------------------------------------------

const NEXT_STATUSES: Partial<Record<ProspectStatus, ProspectStatus[]>> = {
  new: ['contacted', 'lost'],
  contacted: ['tour_scheduled', 'lost'],
  tour_scheduled: ['toured', 'lost'],
  toured: ['application', 'lost'],
  application: ['leased', 'lost'],
}

interface ProspectCardProps {
  prospect: Prospect
  onTransition: (id: string, toStatus: ProspectStatus) => void
  onClick: () => void
}

function ProspectCard({ prospect, onTransition, onClick }: ProspectCardProps) {
  const nextStatuses = NEXT_STATUSES[prospect.status] ?? []

  return (
    <div
      className="cursor-pointer rounded-xl border border-white/60 bg-white/80 p-3 shadow-sm transition hover:shadow-md"
      onClick={onClick}
    >
      <p className="mb-1 text-sm font-semibold text-[var(--ink)]">
        {prospect.name}
      </p>
      <p className="mb-3 truncate text-xs text-[var(--muted)]">
        {prospect.email}
      </p>

      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {nextStatuses.map((s) => (
            <button
              key={s}
              className="rounded-lg bg-[var(--ink)] px-2 py-0.5 text-[10px] font-medium text-white transition hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation()
                onTransition(prospect.id, s)
              }}
            >
              → {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
