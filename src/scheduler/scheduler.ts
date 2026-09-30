import type { KitchenEquipment, Recipe } from '../types/recipe';
import type { Plan, ScheduledTask } from '../types/scheduler';
import { fits } from './resources';
export class ScheduleError extends Error {
  constructor(public code: 'selectionError' | 'timeError' | 'equipmentError' | 'scheduleError') { super(code); }
}
export function buildSchedule(recipes: Recipe[], equipment: KitchenEquipment, target: string, now = Date.now()): Plan {
  if (recipes.length < 2 || recipes.length > 3 || new Set(recipes.map(r => r.id)).size !== recipes.length) throw new ScheduleError('selectionError');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(target)) throw new ScheduleError('timeError');
  if (![equipment.burners, equipment.pans, equipment.pots].every(n => Number.isInteger(n) && n >= 0 && n <= 8) || typeof equipment.oven !== 'boolean') throw new ScheduleError('equipmentError');
  const tasks = recipes.flatMap(recipe => recipe.tasks);
  const byId = new Map(tasks.map(task => [task.id, task]));
  if (!tasks.length || byId.size !== tasks.length || recipes.some(r => !r.tasks.length || r.tasks.some(t => t.recipeId !== r.id))) throw new ScheduleError('scheduleError');
  for (const task of tasks) {
    if (!Number.isInteger(task.durationMinutes) || task.durationMinutes <= 0 || task.durationMinutes > 1440 || task.dependencies.some(id => !byId.has(id))) throw new ScheduleError('scheduleError');
    if (!fits(task, [], equipment)) throw new ScheduleError('equipmentError');
  }
  const pending = new Set(tasks.map(task => task.id));
  const placed: ScheduledTask[] = [];
  // Reverse serial scheduling: successors first, latest feasible resource slot.
  // Stable ID ordering means recipe order and UI language never change the plan.
  while (pending.size) {
    const ready = tasks.filter(task => pending.has(task.id) && tasks.filter(t => t.dependencies.includes(task.id)).every(t => !pending.has(t.id)))
      .sort((a, b) => a.id.localeCompare(b.id, 'en'));
    if (!ready.length) throw new ScheduleError('scheduleError');
    const task = ready[0];
    const successors = placed.filter(p => byId.get(p.taskId)!.dependencies.includes(task.id));
    let end = successors.length ? Math.min(...successors.map(p => p.startMinute)) : 0;
    const feasible = (endMinute: number) => {
      for (let minute = endMinute - task.durationMinutes; minute < endMinute; minute++) {
        const concurrent = placed.filter(p => p.startMinute <= minute && p.endMinute > minute).map(p => byId.get(p.taskId)!);
        if (!fits(task, concurrent, equipment)) return false;
      }
      return true;
    };
    while (!feasible(end)) end--;
    placed.push({ taskId: task.id, recipeId: task.recipeId, startMinute: end - task.durationMinutes, endMinute: end });
    pending.delete(task.id);
  }
  const durationMinutes = -Math.min(...placed.map(task => task.startMinute));
  const date = new Date(now);
  const [hours, minutes] = target.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  // Select the next feasible occurrence of this local wall-clock time.
  while (date.getTime() - durationMinutes * 60_000 < now) date.setDate(date.getDate() + 1);
  return { tasks: placed.map(task => ({ ...task, startMinute: task.startMinute + durationMinutes, endMinute: task.endMinute + durationMinutes }))
    .sort((a, b) => a.startMinute - b.startMinute || a.taskId.localeCompare(b.taskId, 'en')),
    durationMinutes, startAt: date.getTime() - durationMinutes * 60_000, finishAt: date.getTime() };
}
