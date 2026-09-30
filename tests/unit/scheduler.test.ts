import { describe, expect, it } from 'vitest';
import { buildSchedule } from '../../src/scheduler/scheduler';
import { recipes } from '../../src/data/recipes';
import { capacities, resources } from '../../src/scheduler/resources';
import type { KitchenEquipment, Recipe } from '../../src/types/recipe';
const equipment: KitchenEquipment = { burners: 2, pans: 1, pots: 1, oven: true };
const now = new Date(2026, 8, 30, 10).getTime();
function verify(selected: Recipe[], kitchen: KitchenEquipment) {
  const plan = buildSchedule(selected, kitchen, '19:00', now);
  const tasks = new Map(selected.flatMap(r => r.tasks).map(t => [t.id, t]));
  expect(plan.tasks).toHaveLength(tasks.size);
  for (const task of plan.tasks) {
    expect(task.endMinute - task.startMinute).toBe(tasks.get(task.taskId)!.durationMinutes);
    expect(task.startMinute).toBeGreaterThanOrEqual(0);
    for (const dependency of tasks.get(task.taskId)!.dependencies) expect(plan.tasks.find(t => t.taskId === dependency)!.endMinute).toBeLessThanOrEqual(task.startMinute);
  }
  for (let minute = 0; minute < plan.durationMinutes; minute++) {
    const usage: Record<string, number> = {};
    for (const row of plan.tasks.filter(t => t.startMinute <= minute && t.endMinute > minute)) for (const key of resources(tasks.get(row.taskId)!)) usage[key] = (usage[key] ?? 0) + 1;
    for (const [key, count] of Object.entries(usage)) expect(count, `${key} capacity at ${minute}`).toBeLessThanOrEqual(capacities(kitchen)[key]);
  }
  return plan;
}
describe('deterministic coordinated schedule', () => {
  it.each([1, 2, 3])('respects all constraints with %i burners and every selection', burners => {
    for (const selected of [recipes, recipes.slice(0, 2), recipes.slice(1), [recipes[0], recipes[2]]]) verify(selected, { ...equipment, burners });
  });
  it('overlaps compatible passive tasks and ends dishes near the target', () => {
    const plan = verify(recipes, equipment);
    expect(plan.tasks.some(a => plan.tasks.some(b => a.taskId !== b.taskId && a.startMinute < b.endMinute && b.startMinute < a.endMinute))).toBe(true);
    const ends = recipes.map(r => Math.max(...plan.tasks.filter(t => t.recipeId === r.id).map(t => t.endMinute)));
    expect(Math.max(...ends) - Math.min(...ends)).toBeLessThanOrEqual(5);
    expect(new Date(plan.finishAt).getHours()).toBe(19);
  });
  it('is unchanged by recipe order and display-language data', () => {
    const plan = buildSchedule(recipes, equipment, '19:00', now);
    expect(buildSchedule([...recipes].reverse(), equipment, '19:00', now)).toEqual(plan);
    const renamed = structuredClone(recipes); renamed.forEach(r => { r.name.ru = 'Другое имя'; r.tasks.forEach(t => { t.name.en = 'Another name'; }); });
    expect(buildSchedule(renamed, equipment, '19:00', now)).toEqual(plan);
  });
  it('rolls too-close and past targets forward with an explicit date', () => {
    const plan = buildSchedule(recipes, equipment, '10:01', now);
    expect(new Date(plan.finishAt).getDate()).toBe(1);
    expect(plan.startAt).toBeGreaterThan(now);
    const late = new Date(2026, 8, 30, 23, 59).getTime();
    expect(buildSchedule(recipes, equipment, '00:05', late).startAt).toBeGreaterThan(late);
  });
  it('rejects missing equipment and invalid counts', () => {
    for (const kitchen of [{ ...equipment, pans: 0 }, { ...equipment, burners: 0 }, { ...equipment, pots: 0 }, { ...equipment, pans: -1 }, { ...equipment, pots: NaN }]) expect(() => buildSchedule(recipes, kitchen, '19:00', now)).toThrow('equipmentError');
  });
  it('serializes oven tasks and rejects a missing oven', () => {
    const baked = structuredClone(recipes.slice(0, 2)); baked.forEach(r => r.tasks.forEach(t => { t.equipment = ['oven']; t.requiresAttention = false; }));
    verify(baked, equipment);
    expect(() => buildSchedule(baked, { ...equipment, oven: false }, '19:00', now)).toThrow('equipmentError');
  });
  it('rejects cycles, missing dependencies, duplicate IDs and invalid durations', () => {
    for (const mutate of [
      (r: Recipe[]) => { r[0].tasks[0].dependencies = [r[0].tasks.at(-1)!.id]; },
      (r: Recipe[]) => { r[0].tasks[0].dependencies = ['missing']; },
      (r: Recipe[]) => { r[0].tasks[0].id = r[1].tasks[0].id; },
      (r: Recipe[]) => { r[0].tasks[0].durationMinutes = 0; },
    ]) { const data = structuredClone(recipes); mutate(data); expect(() => buildSchedule(data, equipment, '19:00', now)).toThrow('scheduleError'); }
  });
  it('validates selections and wall-clock time', () => {
    for (const selection of [[], recipes.slice(0, 1), [...recipes, recipes[0]], [recipes[0], recipes[0]]]) expect(() => buildSchedule(selection, equipment, '19:00', now)).toThrow('selectionError');
    for (const target of ['', '24:00', '19:99', 'noon']) expect(() => buildSchedule(recipes, equipment, target, now)).toThrow('timeError');
  });
});
