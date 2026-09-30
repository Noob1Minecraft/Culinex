import { ArrowRight, Check, Clock3, Flag, Timer } from 'lucide-react';
import { useI18n } from '../i18n';
import { useCookingSession } from '../context/CookingSessionContext';
import { Timeline } from '../components/Timeline';
export function Schedule() {
  const { t, time, date } = useI18n(); const { session, start, navigate } = useCookingSession(); const plan = session.plan!;
  return <><header className="page-heading"><span className="success-kicker"><Check size={16} />{t('coordinated')}</span><h1>{t('planReady')}</h1><p>{t('planDetail')}</p></header><div className="stat-grid"><div className="stat"><Clock3 /><span>{t('startAt')}</span><strong>{time(plan.startAt)}</strong><small>{date(plan.startAt)}</small></div><div className="stat"><Flag /><span>{t('finishAt')}</span><strong>{time(plan.finishAt)}</strong><small>{date(plan.finishAt)}</small></div><div className="stat"><Timer /><span>{t('duration')}</span><strong>{plan.durationMinutes} <small>{t('min')}</small></strong><small>{session.selectedRecipeIds.length} {t('dishes')} · {plan.tasks.length} {t('steps')}</small></div></div><Timeline plan={plan} /><div className="action-bar"><div><button className="text-button" onClick={() => navigate('planner')}>{t('edit')}</button><small>{t('startNote')}</small></div><button className="primary" onClick={start}>{t('startNow')}<ArrowRight size={18} /></button></div></>;
}
