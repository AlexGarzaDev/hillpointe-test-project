"use strict";
// ---------------------------------------------------------------------------
// Canonical domain types — single source of truth for API and web
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordTourOutcomeSchema = exports.scheduleTourSchema = exports.transitionProspectSchema = exports.createUnitSchema = exports.createProspectSchema = exports.PIPELINE_RULES = void 0;
exports.applyPipelineTransition = applyPipelineTransition;
// ---------------------------------------------------------------------------
// Pipeline rules — single registry consumed by both API and web
// ---------------------------------------------------------------------------
exports.PIPELINE_RULES = [
    {
        toStatus: 'contacted',
        effects: [
            {
                type: 'create_task',
                titleTemplate: 'Send tour availability to {prospect.name}',
                dueDaysOffset: 2,
                dueDateAnchor: 'now',
            },
        ],
    },
    {
        toStatus: 'tour_scheduled',
        effects: [
            {
                type: 'create_task',
                titleTemplate: 'Confirm tour 24h prior',
                dueDaysOffset: -1,
                dueDateAnchor: 'tour',
            },
        ],
    },
    {
        toStatus: 'toured',
        effects: [
            {
                type: 'create_task',
                titleTemplate: 'Send application link to {prospect.name}',
                dueDaysOffset: 1,
                dueDateAnchor: 'now',
            },
        ],
    },
    {
        toStatus: 'application',
        effects: [
            {
                type: 'create_task',
                titleTemplate: 'Review application for {prospect.name}',
                dueDaysOffset: 3,
                dueDateAnchor: 'now',
            },
        ],
    },
    {
        toStatus: 'leased',
        effects: [
            { type: 'update_unit', status: 'leased' },
            { type: 'close_tasks' },
        ],
    },
    {
        toStatus: 'lost',
        effects: [{ type: 'close_tasks' }],
    },
];
function addDays(base, days) {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString();
}
function resolveTitle(template, prospect) {
    return template.replace('{prospect.name}', prospect.name);
}
function applyPipelineTransition(prospect, toStatus, openTasks, nextTour, now = new Date()) {
    // Rule lookup is status-driven; missing rule means transition has no side effects.
    const rule = exports.PIPELINE_RULES.find((r) => r.toStatus === toStatus);
    const tasksToCreate = [];
    const taskIdsToClose = [];
    let unitStatusUpdate = null;
    if (rule) {
        // Resolve each effect deterministically so callers can apply operations in order.
        for (const effect of rule.effects) {
            switch (effect.type) {
                case 'create_task': {
                    // Tour-anchored due dates fall back to "now" if no upcoming tour exists.
                    const dueDate = effect.dueDateAnchor === 'tour' && nextTour
                        ? addDays(new Date(nextTour.scheduledTime), effect.dueDaysOffset)
                        : addDays(now, effect.dueDaysOffset);
                    tasksToCreate.push({
                        title: resolveTitle(effect.titleTemplate, prospect),
                        prospectId: prospect.id,
                        state: 'open',
                        dueDate,
                    });
                    break;
                }
                case 'close_tasks': {
                    // Caller can close these ids in bulk using store-specific implementation.
                    taskIdsToClose.push(...openTasks.filter((t) => t.state === 'open').map((t) => t.id));
                    break;
                }
                case 'update_unit': {
                    unitStatusUpdate = effect.status;
                    break;
                }
            }
        }
    }
    const activityEvent = {
        prospectId: prospect.id,
        type: 'status_changed',
        summary: `${prospect.name} moved to "${toStatus}"`,
        timestamp: now.toISOString(),
        previousStatus: prospect.status,
        newStatus: toStatus,
    };
    return { tasksToCreate, taskIdsToClose, unitStatusUpdate, activityEvent };
}
// ---------------------------------------------------------------------------
// Validation schemas — shared form validation using Zod
// ---------------------------------------------------------------------------
const zod_1 = require("zod");
exports.createProspectSchema = zod_1.z.object({
    // Keep prospect entry ergonomic while still enforcing contactability.
    name: zod_1.z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    phone: zod_1.z.string().optional().nullable(),
    assignedUnitId: zod_1.z.string().nullable().optional(),
});
exports.createUnitSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Unit name is required').min(1, 'Unit name must not be empty'),
    // Mirrors backend enum so form and API reject invalid statuses consistently.
    status: zod_1.z.enum(['available', 'held', 'leased']),
});
exports.transitionProspectSchema = zod_1.z.object({
    // Shared enum centralizes allowed pipeline destinations across UI and API.
    toStatus: zod_1.z.enum(['new', 'contacted', 'tour_scheduled', 'toured', 'application', 'leased', 'lost']),
});
exports.scheduleTourSchema = zod_1.z.object({
    prospectId: zod_1.z.string().uuid('Invalid prospect ID'),
    unitId: zod_1.z.string().uuid('Invalid unit ID'),
    scheduledTime: zod_1.z.string().datetime('Invalid date/time'),
});
exports.recordTourOutcomeSchema = zod_1.z.object({
    outcome: zod_1.z.enum(['completed', 'no_show', 'cancelled']).nullable(),
});
//# sourceMappingURL=index.js.map