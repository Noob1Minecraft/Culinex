import type { CookingSession } from '../types/session';
import type { CookingTask } from '../types/recipe';
import { fits } from '../scheduler/resources';
// Actual completion is authoritative. Late tasks retain resources; early
// confirmations can advance the demo without changing the saved schedule.
export function dispatchReady(session: CookingSession, taskById: Record<string, CookingTask>, now: number): CookingSession {
  if (!session.plan || session.status !== 'cooking') return session;
  const runs = { ...session.runs };
  const active = Object.entries(runs).filter(([, run]) => run.completedAt === undefined).map(([id]) => taskById[id]);
  for (const scheduled of session.plan.tasks) {
    const task = taskById[scheduled.taskId];
    if (runs[task.id] || !task.dependencies.every(id => runs[id]?.completedAt !== undefined)) continue;
    if (!fits(task, active, session.equipment)) continue;
    runs[task.id] = { startedAt: now };
    active.push(task);
  }
  const complete = session.plan.tasks.every(task => runs[task.taskId]?.completedAt !== undefined);
  return { ...session, runs, status: complete ? 'completed' : 'cooking', completedAt: complete ? now : undefined };
}
export function completeTask(session: CookingSession, id: string, tasks: Record<string, CookingTask>, now: number) {
  if (session.status !== 'cooking' || !session.runs[id] || session.runs[id].completedAt !== undefined) return session;
  return dispatchReady({ ...session, runs: { ...session.runs, [id]: { ...session.runs[id], completedAt: now } } }, tasks, now);
}
