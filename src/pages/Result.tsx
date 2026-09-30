import { ArrowRight, Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { useCookingSession } from '../context/CookingSessionContext';
import { recipeById } from '../data/recipes';
import { RecipeImage } from '../components/RecipeImage';
export function Result() {
  const { t, local, time, date } = useI18n(); const { session, reset } = useCookingSession(); const plan = session.plan!;
  return <section className="result-page"><div className="result-icon"><Check size={45} /></div><h1>{t('dinnerReady')}</h1><p>{t('resultDetail')}</p><div className="result-layout"><div className="result-dishes" aria-label={t('completedDishes')}>{session.selectedRecipeIds.map(id => <div key={id}><RecipeImage recipe={recipeById[id]} /><h3>{local(recipeById[id].name)}</h3><span className="success-kicker"><Check size={14} />{t('finished')}</span></div>)}</div><div className="result-stats panel"><div><span>{t('plannedFinish')}</span><strong>{time(plan.finishAt)}</strong><small>{date(plan.finishAt)}</small></div><div><span>{t('tasksDone')}</span><strong>{Object.values(session.runs).filter(run => run.completedAt !== undefined).length} / {plan.tasks.length}</strong></div><div><span>{t('actualDuration')}</span><strong>{Math.max(0, Math.ceil(((session.completedAt ?? 0) - (session.startedAt ?? 0)) / 60_000))} {t('min')}</strong><small>{t('duration')}: {plan.durationMinutes} {t('min')}</small></div></div></div><button className="primary" onClick={reset}>{t('finish')}<ArrowRight size={18} /></button></section>;
}
