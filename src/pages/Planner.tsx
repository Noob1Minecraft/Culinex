import { ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { recipeById } from '../data/recipes';
import { useCookingSession } from '../context/CookingSessionContext';
import { EquipmentSelector } from '../components/EquipmentSelector';
import { RecipeImage } from '../components/RecipeImage';

export function Planner() {
  const { t, local } = useI18n(); const { session, configure, generate, error } = useCookingSession();
  return <>
    <header className="page-heading"><h1>{t('plannerTitle')}</h1><p>{t('plannerDetail')}</p></header>
    <div className="planner-grid">
      <aside className="menu-summary"><h2>{t('menu')}</h2>{session.selectedRecipeIds.map((id, index) => <div className="summary-dish" key={id}>
        <RecipeImage recipe={recipeById[id]} /><div><span className="menu-index">0{index + 1}</span><strong>{local(recipeById[id].name)}</strong><small>{recipeById[id].estimatedMinutes} {t('min')} · {t(recipeById[id].difficulty)}</small></div>
      </div>)}</aside>
      <div className="planner-main">
        <section className="finish-setting"><h2>{t('finishQuestion')}</h2><label className="sr-only" htmlFor="finish-time">{t('finishQuestion')}</label><input id="finish-time" className="time-input" type="time" value={session.targetFinishTime} onChange={e => configure(e.target.value, session.equipment)} required /><p className="muted">{t('finishHint')}</p></section>
        <section className="equipment-setting"><h2>{t('equipment')}</h2><EquipmentSelector value={session.equipment} onChange={equipment => configure(session.targetFinishTime, equipment)} /><p className="fine-print">{t('equipmentHint')}</p></section>
      </div>
    </div>
    <div className="action-bar"><p className="muted">{t('plannerDetail')}</p><button className="primary" onClick={generate}>{t('createPlan')}<ArrowRight size={18} /></button></div>
    {error && <p role="alert" className="notice">{t(error)}</p>}
  </>;
}
