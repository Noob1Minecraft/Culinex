import { useState } from 'react';
import { Check, ChevronRight, ListChecks, Sparkles, Timer as TimerIcon } from 'lucide-react';
import { useI18n } from '../i18n';
import { useCookingSession } from '../context/CookingSessionContext';
import { recipeById, taskById } from '../data/recipes';
import { useClock, remainingSeconds } from '../hooks/useTimer';
import { Timer } from '../components/Timer';
import { Timeline } from '../components/Timeline';
import { AiAssistant } from '../components/AiAssistant';
export function CookingMode() {
  const { t, local } = useI18n(); const { session, complete } = useCookingSession(); const now = useClock();
  const [showPlan, setShowPlan] = useState(false); const [showAi, setShowAi] = useState(false);
  const plan = session.plan!;
  const running = plan.tasks.filter(s => session.runs[s.taskId] && session.runs[s.taskId].completedAt === undefined).map(s => taskById[s.taskId]);
  const current = running.find(task => task.requiresAttention) ?? running[0];
  const parallel = running.filter(task => task.id !== current?.id);
  const upcoming = plan.tasks.filter(task => !session.runs[task.taskId]).slice(0, 2);
  const completed = Object.values(session.runs).filter(run => run.completedAt !== undefined).length;
  const currentRun = current ? session.runs[current.id] : undefined;
  return <><header className="cooking-heading"><div><h1>{t('cooking')}</h1></div><div className="session-progress"><span>{t('tasksDone')}<strong>{completed} / {plan.tasks.length}</strong></span><progress aria-label={t('progress')} max={plan.tasks.length} value={completed} /></div></header><div className="cooking-grid"><section className="current-card"><div className="current-top"><span className="live-badge"><span className="status-dot" />{t('now')}</span><span className="muted">{current && t(current.requiresAttention ? 'active' : 'passive')}</span></div>{current && currentRun ? <><span className="current-recipe" style={{ color: recipeById[current.recipeId].color }}>{local(recipeById[current.recipeId].name)}</span><h2>{local(current.name)}</h2><div className="current-timer"><Timer startedAt={currentRun.startedAt} durationMinutes={current.durationMinutes} now={now} large /></div><progress aria-label={t('progress')} value={current.durationMinutes * 60 - remainingSeconds(currentRun.startedAt, current.durationMinutes, now)} max={current.durationMinutes * 60} /><p className="current-equipment">{current.equipment.map(e => t(e)).join(' · ')}</p><button className="primary complete-button" onClick={() => complete(current.id)}><Check size={21} />{t('done')}</button><p className="fine-print">{t('liveHint')}</p></> : <p>{t('sessionError')}</p>}</section>
    <aside className="cooking-sidebar"><section className="panel parallel-panel"><h2><TimerIcon size={18} />{t('parallel')}</h2>{parallel.length ? parallel.map(task => <div className="parallel-task" key={task.id}><span className="dish-label" style={{ color: recipeById[task.recipeId].color }}>{local(recipeById[task.recipeId].name)}</span><h3>{local(task.name)}</h3><div className="parallel-bottom"><Timer startedAt={session.runs[task.id].startedAt} durationMinutes={task.durationMinutes} now={now} /><button className="secondary small" aria-label={`${t('done')}: ${local(task.name)}`} onClick={() => complete(task.id)}><Check size={15} />{t('done')}</button></div></div>) : <p className="muted">{t('parallelText')}</p>}</section><section className="panel next-panel"><h2>{t('next')}</h2>{upcoming.length ? upcoming.map((scheduled, index) => <div className="next-task" key={scheduled.taskId}><span className="next-number">{index + 1}</span><div><small>{local(recipeById[scheduled.recipeId].name)}</small><h3>{local(taskById[scheduled.taskId].name)}</h3><span>{taskById[scheduled.taskId].durationMinutes} {t('min')}</span></div><ChevronRight size={16} /></div>) : <p className="muted">{t('allStarted')}</p>}</section><button className="ai-trigger" onClick={() => setShowAi(true)}><Sparkles size={21} />{t('askAi')}<ChevronRight size={17} /></button></aside></div><button className="text-button plan-toggle" onClick={() => setShowPlan(!showPlan)}><ListChecks size={18} />{t(showPlan ? 'hidePlan' : 'fullPlan')}</button>{showPlan && <Timeline plan={plan} runs={session.runs} />}{showAi && <AiAssistant currentTaskId={current?.id} onClose={() => setShowAi(false)} />}</>;
}
