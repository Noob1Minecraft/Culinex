import { Check, Hand, Timer } from 'lucide-react';
import { useI18n } from '../i18n';
import { recipeById, taskById } from '../data/recipes';
import type { Plan } from '../types/scheduler';
import type { TaskRun } from '../types/session';
export function Timeline({ plan, runs = {} }: { plan: Plan; runs?: Record<string, TaskRun> }) {
  const { t, local, time } = useI18n();
  return <section className="timeline panel"><div className="panel-heading"><h2>{t('combined')}</h2><span className="muted">{plan.tasks.length} {t('steps')}</span></div>
    <p className="muted timeline-legend">{t('scheduleLegend')}</p>
    <div className="timeline-scale" aria-hidden="true"><span>{time(plan.startAt)}</span><span>{time(plan.startAt + plan.durationMinutes * 30_000)}</span><span>{time(plan.finishAt)}</span></div>
    <ol>{plan.tasks.map(scheduled => { const task = taskById[scheduled.taskId]; const recipe = recipeById[scheduled.recipeId]; const run = runs[task.id];
      const status = run?.completedAt !== undefined ? 'finished' : run ? 'running' : 'waiting';
      return <li key={task.id} className={`timeline-row ${status}`} style={{ '--dish-color': recipe.color } as React.CSSProperties}>
        <div className="timeline-time">{time(plan.startAt + scheduled.startMinute * 60_000)}<span>{task.durationMinutes} {t('min')}</span></div>
        <div className="timeline-task"><span className="dish-label">{local(recipe.name)}</span><h3>{local(task.name)}</h3><div className="task-meta">{task.requiresAttention ? <Hand size={13} /> : <Timer size={13} />}<span>{t(task.requiresAttention ? 'active' : 'passive')}</span><span>·</span><span>{task.equipment.map(e => t(e)).join(', ')}</span>{run && <span className="run-status">{status === 'finished' && <Check size={12} />}{t(status)}</span>}</div></div>
        <div className="timeline-track" aria-hidden="true"><div className={task.requiresAttention ? 'bar active-bar' : 'bar'} style={{ left: `${scheduled.startMinute / plan.durationMinutes * 100}%`, width: `${(scheduled.endMinute - scheduled.startMinute) / plan.durationMinutes * 100}%` }} /></div>
      </li>;
    })}</ol>
  </section>;
}
