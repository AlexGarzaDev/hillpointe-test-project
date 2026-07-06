import { applyPipelineTransition } from "../database/pipeline";
import type { Prospect, Task, Tour } from "../types/domain";

describe("applyPipelineTransition", () => {
  const baseProspect: Prospect = {
    id: "prospect-1",
    name: "Jane Prospect",
    email: "jane@example.com",
    phone: null,
    assignedUnitId: "unit-1",
    status: "new",
  };

  const now = new Date("2026-01-15T10:00:00.000Z");

  it("creates a contacted follow-up task with a now-anchored due date", () => {
    const result = applyPipelineTransition(baseProspect, "contacted", [], undefined, now);

    expect(result.tasksToCreate).toEqual([
      {
        title: "Send tour availability to Jane Prospect",
        prospectId: "prospect-1",
        state: "open",
        dueDate: "2026-01-17T10:00:00.000Z",
      },
    ]);
    expect(result.taskIdsToClose).toEqual([]);
    expect(result.unitStatusUpdate).toBeNull();
    expect(result.activityEvent).toEqual({
      prospectId: "prospect-1",
      type: "status_changed",
      summary: 'Jane Prospect moved to "contacted"',
      timestamp: "2026-01-15T10:00:00.000Z",
      previousStatus: "new",
      newStatus: "contacted",
    });
  });

  it("uses the next tour time for tour-anchored due dates", () => {
    const nextTour: Tour = {
      id: "tour-1",
      prospectId: "prospect-1",
      unitId: "unit-1",
      scheduledTime: "2026-01-20T15:30:00.000Z",
      outcome: null,
    };

    const result = applyPipelineTransition(
      baseProspect,
      "tour_scheduled",
      [],
      nextTour,
      now,
    );

    expect(result.tasksToCreate).toEqual([
      {
        title: "Confirm tour 24h prior",
        prospectId: "prospect-1",
        state: "open",
        dueDate: "2026-01-19T15:30:00.000Z",
      },
    ]);
    expect(result.taskIdsToClose).toEqual([]);
    expect(result.unitStatusUpdate).toBe("held");
  });

  it("falls back to now for tour-anchored rules when no next tour exists", () => {
    const result = applyPipelineTransition(baseProspect, "tour_scheduled", [], undefined, now);

    expect(result.tasksToCreate).toEqual([
      {
        title: "Confirm tour 24h prior",
        prospectId: "prospect-1",
        state: "open",
        dueDate: "2026-01-14T10:00:00.000Z",
      },
    ]);
  });

  it("closes only open tasks and updates unit status on leased transitions", () => {
    const openAndClosedTasks: Task[] = [
      {
        id: "task-open-1",
        prospectId: "prospect-1",
        title: "Collect docs",
        state: "open",
        dueDate: null,
      },
      {
        id: "task-done-1",
        prospectId: "prospect-1",
        title: "Old follow-up",
        state: "done",
        dueDate: null,
      },
      {
        id: "task-open-2",
        prospectId: "prospect-1",
        title: "Schedule signing",
        state: "open",
        dueDate: null,
      },
    ];

    const leasedProspect: Prospect = {
      ...baseProspect,
      status: "application",
    };

    const result = applyPipelineTransition(
      leasedProspect,
      "leased",
      openAndClosedTasks,
      undefined,
      now,
    );

    expect(result.tasksToCreate).toEqual([]);
    expect(result.taskIdsToClose).toEqual(["task-open-1", "task-open-2"]);
    expect(result.unitStatusUpdate).toBe("leased");
    expect(result.activityEvent).toEqual({
      prospectId: "prospect-1",
      type: "status_changed",
      summary: 'Jane Prospect moved to "leased"',
      timestamp: "2026-01-15T10:00:00.000Z",
      previousStatus: "application",
      newStatus: "leased",
    });
  });

  it("closes open tasks and releases the unit on lost transitions", () => {
    const openAndClosedTasks: Task[] = [
      {
        id: "task-open-1",
        prospectId: "prospect-1",
        title: "Confirm paperwork",
        state: "open",
        dueDate: null,
      },
      {
        id: "task-done-1",
        prospectId: "prospect-1",
        title: "Old follow-up",
        state: "done",
        dueDate: null,
      },
    ];

    const scheduledProspect: Prospect = {
      ...baseProspect,
      status: "tour_scheduled",
    };

    const result = applyPipelineTransition(
      scheduledProspect,
      "lost",
      openAndClosedTasks,
      undefined,
      now,
    );

    expect(result.tasksToCreate).toEqual([]);
    expect(result.taskIdsToClose).toEqual(["task-open-1"]);
    expect(result.unitStatusUpdate).toBe("available");
    expect(result.activityEvent).toEqual({
      prospectId: "prospect-1",
      type: "status_changed",
      summary: 'Jane Prospect moved to "lost"',
      timestamp: "2026-01-15T10:00:00.000Z",
      previousStatus: "tour_scheduled",
      newStatus: "lost",
    });
  });

  it("emits only an activity event when transitioning to a status without side-effect rules", () => {
    const activeProspect: Prospect = {
      ...baseProspect,
      status: "contacted",
    };

    const result = applyPipelineTransition(activeProspect, "new", [], undefined, now);

    expect(result.tasksToCreate).toEqual([]);
    expect(result.taskIdsToClose).toEqual([]);
    expect(result.unitStatusUpdate).toBeNull();
    expect(result.activityEvent).toEqual({
      prospectId: "prospect-1",
      type: "status_changed",
      summary: 'Jane Prospect moved to "new"',
      timestamp: "2026-01-15T10:00:00.000Z",
      previousStatus: "contacted",
      newStatus: "new",
    });
  });
});