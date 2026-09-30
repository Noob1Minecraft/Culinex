import { ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { useCookingSession } from '../context/CookingSessionContext';
import { Timeline } from '../components/Timeline';
export function Schedule() {
  const { t, time, date } = useI18n();
  const { session, start, navigate } = useCookingSession();
  const plan = session.plan!;
  return <>
    <header className="page-heading"><h1>{t('planReady')}</h1><p>{t('planDetail')}</p></header>
    <div className="schedule-layout"><aside className="stat-grid">
      <div className="stat"><strong>{time(plan.startAt)}</strong><span>{t('startAt')}</span><small>{date(plan.startAt)}</small></div>
      <div className="stat"><strong>{time(plan.finishAt)}</strong><span>{t('finishAt')}</span><small>{date(plan.finishAt)}</small></div>
      <div className="stat"><strong>{plan.durationMinutes} <small>{t('min')}</small></strong><span>{t('duration')}</span><small>{session.selectedRecipeIds.length} {t('dishes')} · {plan.tasks.length} {t('steps')}</small></div>
    </aside>
    <Timeline plan={plan} />
    </div>
    <div className="action-bar"><div><button className="text-button" onClick={() => navigate('planner')}>{t('edit')}</button><small>{t('startNote')}</small></div><button className="primary" onClick={start}>{t('startNow')}<ArrowRight size={18} /></button></div>
  </>;
}
