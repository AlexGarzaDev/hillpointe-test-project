import request from "supertest";
import type { ActivityEvent, Prospect, Task, Tour, Unit } from "../types/domain";

const prospects = new Map<string, Prospect>();
const tours = new Map<string, Tour>();
const tasks = new Map<string, Task>();
const activityEvents = new Map<string, ActivityEvent>();
const units = new Map<string, Unit>();

let taskCounter = 1;
let activityCounter = 1;

const mockStore = {
  getUnit: jest.fn(async (id: string) => units.get(id)),
  getTour: jest.fn(async (id: string) => tours.get(id)),
  updateTour: jest.fn(async (id: string, patch: Partial<Omit<Tour, "id">>) => {
    const existing = tours.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    tours.set(id, updated);
    return updated;
  }),
  getProspect: jest.fn(async (id: string) => prospects.get(id)),
  updateProspect: jest.fn(async (id: string, patch: Partial<Omit<Prospect, "id">>) => {
    const existing = prospects.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    prospects.set(id, updated);
    return updated;
  }),
  listTasks: jest.fn(async (prospectId?: string) => {
    const all = Array.from(tasks.values());
    if (!prospectId) return all;
    return all.filter((task) => task.prospectId === prospectId);
  }),
  createTask: jest.fn(async (data: Omit<Task, "id">) => {
    const created: Task = {
      id: `created-task-${taskCounter++}`,
      ...data,
    };
    tasks.set(created.id, created);
    return created;
  }),
  closeOpenTasksForProspect: jest.fn(async (prospectId: string) => {
    const openTasks = Array.from(tasks.values()).filter(
      (task) => task.prospectId === prospectId && task.state === "open",
    );

    for (const task of openTasks) {
      tasks.set(task.id, { ...task, state: "done" });
    }

    return openTasks.map((task) => task.id);
  }),
  nextTourForProspect: jest.fn(async (prospectId: string) => {
    const next = Array.from(tours.values())
      .filter((tour) => tour.prospectId === prospectId && tour.outcome === null)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0];

    return next;
  }),
  updateUnit: jest.fn(async (id: string, patch: Partial<Omit<Unit, "id">>) => {
    const existing = units.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    units.set(id, updated);
    return updated;
  }),
  appendActivity: jest.fn(async (data: Omit<ActivityEvent, "id">) => {
    const event: ActivityEvent = {
      id: `activity-${activityCounter++}`,
      ...data,
    };
    activityEvents.set(event.id, event);
    return event;
  }),
  listActivity: jest.fn(async (prospectId?: string) => {
    const all = Array.from(activityEvents.values());
    if (!prospectId) return all;
    return all.filter((event) => event.prospectId === prospectId);
  }),
};

jest.mock("../database/store", () => ({
  store: mockStore,
}));

import { app } from "../app";

describe("PATCH /tours/:id integration", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-01T14:00:00.000Z"));
    jest.clearAllMocks();

    prospects.clear();
    tours.clear();
    tasks.clear();
    activityEvents.clear();
    units.clear();

    taskCounter = 1;
    activityCounter = 1;

    units.set("unit-1", {
      id: "unit-1",
      name: "Unit 101",
      status: "available",
    });

    prospects.set("prospect-1", {
      id: "prospect-1",
      name: "Jane Prospect",
      email: "jane@example.com",
      phone: null,
      assignedUnitId: "unit-1",
      status: "tour_scheduled",
    });

    tours.set("tour-1", {
      id: "tour-1",
      prospectId: "prospect-1",
      unitId: "unit-1",
      scheduledTime: "2026-07-02T14:00:00.000Z",
      outcome: null,
    });

    tasks.set("task-existing-open", {
      id: "task-existing-open",
      prospectId: "prospect-1",
      title: "Bring brochure",
      state: "open",
      dueDate: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("moves linked prospect to toured and persists transition side effects when outcome is completed", async () => {
    const patchResponse = await request(app)
      .patch("/tours/tour-1")
      .send({ outcome: "completed" });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body).toEqual({
      success: true,
      data: {
        id: "tour-1",
        prospectId: "prospect-1",
        unitId: "unit-1",
        scheduledTime: "2026-07-02T14:00:00.000Z",
        outcome: "completed",
      },
    });

    const updatedProspectResponse = await request(app).get("/prospects/prospect-1");
    expect(updatedProspectResponse.status).toBe(200);
    expect(updatedProspectResponse.body).toEqual({
      success: true,
      data: expect.objectContaining({
        id: "prospect-1",
        status: "toured",
      }),
    });

    const tasksResponse = await request(app).get("/tasks").query({ prospectId: "prospect-1" });
    expect(tasksResponse.status).toBe(200);
    expect(tasksResponse.body).toEqual({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({
          id: "task-existing-open",
          state: "open",
          title: "Bring brochure",
        }),
        expect.objectContaining({
          title: "Send application link to Jane Prospect",
          state: "open",
          dueDate: "2026-07-02T14:00:00.000Z",
          prospectId: "prospect-1",
        }),
      ]),
    });

    const activityResponse = await request(app)
      .get("/activity")
      .query({ prospectId: "prospect-1" });

    expect(activityResponse.status).toBe(200);
    expect(activityResponse.body).toEqual({
      success: true,
      data: [
        {
          id: "activity-1",
          prospectId: "prospect-1",
          type: "status_changed",
          summary: 'Jane Prospect moved to "toured"',
          timestamp: "2026-07-01T14:00:00.000Z",
          previousStatus: "tour_scheduled",
          newStatus: "toured",
        },
      ],
    });

    expect(mockStore.updateProspect).toHaveBeenCalledWith("prospect-1", { status: "toured" });
    expect(mockStore.createTask).toHaveBeenCalledWith({
      title: "Send application link to Jane Prospect",
      prospectId: "prospect-1",
      state: "open",
      dueDate: "2026-07-02T14:00:00.000Z",
    });
    expect(mockStore.appendActivity).toHaveBeenCalledWith({
      prospectId: "prospect-1",
      type: "status_changed",
      summary: 'Jane Prospect moved to "toured"',
      timestamp: "2026-07-01T14:00:00.000Z",
      previousStatus: "tour_scheduled",
      newStatus: "toured",
    });

    expect(mockStore.closeOpenTasksForProspect).not.toHaveBeenCalled();
    expect(mockStore.updateUnit).not.toHaveBeenCalled();
  });

  it("moves linked prospect to lost, closes open tasks, and releases the unit when outcome is cancelled", async () => {
    units.set("unit-1", {
      id: "unit-1",
      name: "Unit 101",
      status: "held",
    });

    const patchResponse = await request(app)
      .patch("/tours/tour-1")
      .send({ outcome: "cancelled" });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body).toEqual({
      success: true,
      data: {
        id: "tour-1",
        prospectId: "prospect-1",
        unitId: "unit-1",
        scheduledTime: "2026-07-02T14:00:00.000Z",
        outcome: "cancelled",
      },
    });

    const updatedProspectResponse = await request(app).get("/prospects/prospect-1");
    expect(updatedProspectResponse.status).toBe(200);
    expect(updatedProspectResponse.body).toEqual({
      success: true,
      data: expect.objectContaining({
        id: "prospect-1",
        status: "lost",
      }),
    });

    const tasksResponse = await request(app).get("/tasks").query({ prospectId: "prospect-1" });
    expect(tasksResponse.status).toBe(200);
    expect(tasksResponse.body).toEqual({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({
          id: "task-existing-open",
          state: "done",
        }),
      ]),
    });

    const updatedUnitResponse = await request(app).get("/units/unit-1");
    expect(updatedUnitResponse.status).toBe(200);
    expect(updatedUnitResponse.body).toEqual({
      success: true,
      data: expect.objectContaining({
        id: "unit-1",
        status: "available",
      }),
    });

    expect(mockStore.closeOpenTasksForProspect).toHaveBeenCalledWith("prospect-1");
    expect(mockStore.updateUnit).toHaveBeenCalledWith("unit-1", { status: "available" });
    expect(mockStore.updateProspect).toHaveBeenCalledWith("prospect-1", { status: "lost" });
  });
});
