import { Check, Hand, Timer } from 'lucide-react';
import { useI18n } from '../i18n';
import { recipeById, taskById } from '../data/recipes';
import type { Plan } from '../types/scheduler';
import type { TaskRun } from '../types/session';

export function Timeline({ plan, runs = {} }: { plan: Plan; runs?: Record<string, TaskRun> }) {
  const { t, local, time } = useI18n();
  // Group only the presentation. The scheduler's task order and timing stay intact.
  const groups = new Map<number, Plan['tasks']>();
  for (const scheduled of plan.tasks) {
    const group = groups.get(scheduled.startMinute) ?? [];
    group.push(scheduled);
    groups.set(scheduled.startMinute, group);
  }
  return <section className="timeline panel">
    <div className="panel-heading"><h2>{t('combined')}</h2><span className="muted">{plan.tasks.length} {t('steps')}</span></div>
    <p className="muted timeline-legend">{t('scheduleLegend')}</p>
    <ol className="time-rail">{Array.from(groups, ([minute, tasks]) => <li key={minute} className="time-group">
      <div className="timeline-time">{time(plan.startAt + minute * 60_000)}</div>
      <div className="group-tasks">
        {tasks.length > 1 && <span className="parallel-label">{t('parallel')}</span>}
        {tasks.map(scheduled => {
          const task = taskById[scheduled.taskId]; const recipe = recipeById[scheduled.recipeId]; const run = runs[task.id];
          const status = run?.completedAt !== undefined ? 'finished' : run ? 'running' : 'waiting';
          return <div key={task.id} className={`timeline-row ${status}`} style={{ '--dish-color': recipe.color } as React.CSSProperties}>
            <div className="timeline-task"><span className="dish-label">{local(recipe.name)}</span><h3>{local(task.name)}</h3>
              <div className="task-meta">{task.requiresAttention ? <Hand size={13} /> : <Timer size={13} />}<span>{t(task.requiresAttention ? 'active' : 'passive')}</span><span>·</span><span>{task.equipment.map(e => t(e)).join(', ')}</span>{run && <span className="run-status">{status === 'finished' && <Check size={12} />}{t(status)}</span>}</div>
            </div>
            <span className="task-duration">{task.durationMinutes} {t('min')}</span>
          </div>;
        })}
      </div>
    </li>)}</ol>
    <div className="timeline-end"><span>{time(plan.finishAt)}</span><Check size={16} /><strong>{t('finishAt')}</strong></div>
  </section>;
}
