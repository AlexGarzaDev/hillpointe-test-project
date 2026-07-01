import type { ModelStatic } from "sequelize";
import { Op } from "sequelize";
import sequelize from "./sequelize";
import type {
  Unit,
  Prospect,
  Tour,
  Task,
  ActivityEvent,
  ProspectStatus,
  TourOutcome,
} from "../types/domain";
import _UnitModel from "./models/Unit";
import _ProspectModel from "./models/Prospect";
import _TourModel from "./models/Tour";
import _TaskModel from "./models/Task";
import _ActivityEventModel from "./models/ActivityEvent";

type UnitInstance = InstanceType<typeof _UnitModel>;
type ProspectInstance = InstanceType<typeof _ProspectModel>;
type TourInstance = InstanceType<typeof _TourModel>;
type TaskInstance = InstanceType<typeof _TaskModel>;
type ActivityEventInstance = InstanceType<typeof _ActivityEventModel>;

// Sequelize static methods (findAll, findByPk, create, findOne) are typed
// with `this: ModelStatic<M>`. Declaring the models with that type makes
// the polymorphic `this` constraint visible to TypeScript.
const UnitModel = _UnitModel as ModelStatic<UnitInstance>;
const ProspectModel = _ProspectModel as ModelStatic<ProspectInstance>;
const TourModel = _TourModel as ModelStatic<TourInstance>;
const TaskModel = _TaskModel as ModelStatic<TaskInstance>;
const ActivityEventModel = _ActivityEventModel as ModelStatic<ActivityEventInstance>;

// ---------------------------------------------------------------------------
// Sequelize-backed store
// ---------------------------------------------------------------------------

class Store {
  // --- Units ----------------------------------------------------------------

  async listUnits(): Promise<Unit[]> {
    const units = await UnitModel.findAll({
      order: [['createdAt', 'DESC']],
    });
    return units.map((u) => this.unitToDTO(u));
  }

  async getUnit(id: string): Promise<Unit | undefined> {
    const unit = await UnitModel.findByPk(id);
    return unit ? this.unitToDTO(unit) : undefined;
  }

  async createUnit(data: Omit<Unit, "id">): Promise<Unit> {
    const unit = await UnitModel.create({
      name: data.name,
      status: data.status,
    });
    return this.unitToDTO(unit);
  }

  async updateUnit(
    id: string,
    patch: Partial<Omit<Unit, "id">>
  ): Promise<Unit | undefined> {
    const unit = await UnitModel.findByPk(id);
    if (!unit) return undefined;

    await unit.update(patch);
    return this.unitToDTO(unit);
  }

  async deleteUnit(id: string): Promise<boolean> {
    const unit = await UnitModel.findByPk(id);
    if (!unit) return false;
    await unit.destroy();
    return true;
  }

  private unitToDTO(unit: UnitInstance): Unit {
    return {
      id: unit.id,
      name: unit.name,
      status: unit.status,
    };
  }

  // --- Prospects ------------------------------------------------------------

  async listProspects(): Promise<Prospect[]> {
    const prospects = await ProspectModel.findAll({
      order: [['createdAt', 'DESC']],
    });
    return prospects.map((p) => this.prospectToDTO(p));
  }

  async getProspect(id: string): Promise<Prospect | undefined> {
    const prospect = await ProspectModel.findByPk(id);
    return prospect ? this.prospectToDTO(prospect) : undefined;
  }

  async createProspect(
    data: Omit<Prospect, "id" | "status">
  ): Promise<Prospect> {
    const prospect = await ProspectModel.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      assignedUnitId: data.assignedUnitId,
      status: "new",
    });
    return this.prospectToDTO(prospect);
  }

  async updateProspect(
    id: string,
    patch: Partial<Omit<Prospect, "id">>
  ): Promise<Prospect | undefined> {
    const prospect = await ProspectModel.findByPk(id);
    if (!prospect) return undefined;

    await prospect.update(patch);
    return this.prospectToDTO(prospect);
  }

  async deleteProspect(id: string): Promise<boolean> {
    const prospect = await ProspectModel.findByPk(id);
    if (!prospect) return false;
    await prospect.destroy();
    return true;
  }

  private prospectToDTO(prospect: ProspectInstance): Prospect {
    return {
      id: prospect.id,
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone ?? null,
      status: prospect.status as ProspectStatus,
      assignedUnitId: prospect.assignedUnitId ?? null,
    };
  }

  // --- Tours ----------------------------------------------------------------

  async listTours(): Promise<Tour[]> {
    const tours = await TourModel.findAll({
      order: [['createdAt', 'DESC']],
    });
    return tours.map((t) => this.tourToDTO(t));
  }

  async getTour(id: string): Promise<Tour | undefined> {
    const tour = await TourModel.findByPk(id);
    return tour ? this.tourToDTO(tour) : undefined;
  }

  async createTour(data: Omit<Tour, "id" | "outcome">): Promise<Tour> {
    const tour = await TourModel.create({
      prospectId: data.prospectId,
      unitId: data.unitId,
      scheduledTime: data.scheduledTime,
      outcome: null,
    });
    return this.tourToDTO(tour);
  }

  async updateTour(
    id: string,
    patch: Partial<Omit<Tour, "id">>
  ): Promise<Tour | undefined> {
    const tour = await TourModel.findByPk(id);
    if (!tour) return undefined;

    await tour.update(patch);
    return this.tourToDTO(tour);
  }

  async nextTourForProspect(prospectId: string): Promise<Tour | undefined> {
    const tour = await TourModel.findOne({
      where: { prospectId, outcome: null },
      order: [['scheduledTime', 'ASC']],
    });
    return tour ? this.tourToDTO(tour) : undefined;
  }

  async checkTourConflict(
    unitId: string,
    scheduledTime: string,
    excludeTourId?: string
  ): Promise<boolean> {
    // Check for tours within ±2 hours of the scheduled time
    const scheduled = new Date(scheduledTime);
    const windowStart = new Date(scheduled.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(scheduled.getTime() + 2 * 60 * 60 * 1000).toISOString();

    const conflictingTour = await TourModel.findOne({
      where: {
        unitId,
        scheduledTime: {
          [Op.between]: [windowStart, windowEnd],
        },
        ...(excludeTourId ? { id: { [Op.ne]: excludeTourId } } : {}),
      },
    });

    return !!conflictingTour;
  }

  private tourToDTO(tour: TourInstance): Tour {
    return {
      id: tour.id,
      prospectId: tour.prospectId as string,
      unitId: tour.unitId as string,
      scheduledTime: tour.scheduledTime,
      outcome: (tour.outcome ?? null) as TourOutcome,
    };
  }

  // --- Tasks ----------------------------------------------------------------

  async listTasks(prospectId?: string): Promise<Task[]> {
    const where = prospectId ? { prospectId } : {};
    const tasks = await TaskModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    return tasks.map((t) => this.taskToDTO(t));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const task = await TaskModel.findByPk(id);
    return task ? this.taskToDTO(task) : undefined;
  }

  async createTask(data: Omit<Task, "id">): Promise<Task> {
    const task = await TaskModel.create({
      prospectId: data.prospectId,
      title: data.title,
      state: data.state,
      dueDate: data.dueDate,
    });
    return this.taskToDTO(task);
  }

  async updateTask(
    id: string,
    patch: Partial<Omit<Task, "id">>
  ): Promise<Task | undefined> {
    const task = await TaskModel.findByPk(id);
    if (!task) return undefined;

    await task.update(patch);
    return this.taskToDTO(task);
  }

  async closeOpenTasksForProspect(prospectId: string): Promise<string[]> {
    const tasks = await TaskModel.findAll({
      where: { prospectId, state: 'open' },
    });

    const ids = tasks.map((t) => t.id);
    await Promise.all(tasks.map((t) => t.update({ state: 'done' })));
    return ids;
  }

  private taskToDTO(task: TaskInstance): Task {
    return {
      id: task.id,
      prospectId: task.prospectId as string,
      title: task.title,
      state: task.state,
      dueDate: task.dueDate ?? null,
    };
  }

  // --- Activity events ------------------------------------------------------

  async listActivity(prospectId?: string): Promise<ActivityEvent[]> {
    const where = prospectId ? { prospectId } : {};
    const events = await ActivityEventModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    return events.map((e) => this.activityToDTO(e));
  }

  async appendActivity(data: Omit<ActivityEvent, "id">): Promise<ActivityEvent> {
    const event = await ActivityEventModel.create({
      prospectId: data.prospectId,
      eventType: data.type,
      description: data.summary,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
    });
    return this.activityToDTO(event);
  }

  private activityToDTO(event: ActivityEventInstance): ActivityEvent {
    return {
      id: event.id,
      prospectId: event.prospectId ?? "",
      type: event.eventType,
      summary: event.description ?? "",
      timestamp: event.createdAt ? event.createdAt.toISOString() : new Date().toISOString(),
      previousStatus: event.previousStatus ?? null,
      newStatus: event.newStatus ?? null,
    };
  }
}

export const store = new Store();
