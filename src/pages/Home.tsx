import { ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { useCookingSession } from '../context/CookingSessionContext';
import { recipes } from '../data/recipes';
import { RecipeCard } from '../components/RecipeCard';

export function Home() {
  const { t } = useI18n();
  const { navigate } = useCookingSession();
  return <>
    <section className="hero">
      <div className="hero-copy">
        <h1>{t('headline')}</h1>
        <p>{t('intro')}</p>
        <button className="primary" onClick={() => navigate('recipes')}>{t('start')}<ArrowRight size={18} /></button>
      </div>
      <ol className="home-steps" aria-label={t('explore')}>
        {(['feature1', 'feature2', 'feature3'] as const).map((key, index) => <li key={key}><span>0{index + 1}</span>{t(key)}</li>)}
      </ol>
    </section>
    <section className="menu-section">
      <div className="section-heading"><h2>{t('tonight')}</h2><span className="muted">{t('temporary')}</span></div>
      <div className="recipe-grid">{recipes.map(recipe => <RecipeCard recipe={recipe} key={recipe.id} />)}</div>
    </section>
  </>;
}
