import { expect, it } from 'vitest';
import { recipes, taskById } from '../../src/data/recipes';
import { buildSchedule } from '../../src/scheduler/scheduler';
import { completeTask, dispatchReady } from '../../src/context/engine';
import { capacities, resources } from '../../src/scheduler/resources';
import type { CookingSession } from '../../src/types/session';
import { remainingSeconds, formatTimer } from '../../src/hooks/useTimer';
it('completes every task while respecting live dependencies and resource ownership', () => {
  const equipment = { burners: 1, pans: 1, pots: 1, oven: false };
  let state: CookingSession = { equipment, targetFinishTime: '19:00', selectedRecipeIds: recipes.map(r => r.id), status: 'cooking', runs: {}, startedAt: 1, plan: buildSchedule(recipes, equipment, '19:00') };
  state = dispatchReady(state, taskById, 1);
  let count = 0;
  while (state.status !== 'completed' && count < 20) {
    const active = Object.keys(state.runs).filter(id => state.runs[id].completedAt === undefined);
    expect(active.length).toBeGreaterThan(0);
    const usage: Record<string, number> = {};
    for (const id of active) {
      for (const dep of taskById[id].dependencies) expect(state.runs[dep].completedAt).toBeDefined();
      for (const key of resources(taskById[id])) usage[key] = (usage[key] ?? 0) + 1;
    }
    for (const [key, value] of Object.entries(usage)) expect(value).toBeLessThanOrEqual(capacities(equipment)[key]);
    // Large delay never auto-releases equipment or auto-completes a step.
    expect(dispatchReady(state, taskById, 100_000_000).runs).toEqual(state.runs);
    state = completeTask(state, active[0], taskById, ++count * 1000);
  }
  expect(state.status).toBe('completed'); expect(count).toBe(13); expect(state.completedAt).toBeDefined();
  expect(completeTask(state, 'missing', taskById, 99)).toBe(state);
});
it('timers use wall time and clamp at zero', () => {
  expect(remainingSeconds(1000, 1, 2000)).toBe(59);
  expect(remainingSeconds(1000, 1, 500)).toBe(60);
  expect(remainingSeconds(1000, 1, 99_000)).toBe(0);
  expect(formatTimer(0)).toBe('00:00'); expect(formatTimer(125)).toBe('02:05');
});
