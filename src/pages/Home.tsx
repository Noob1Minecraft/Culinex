import { ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { useCookingSession } from '../context/CookingSessionContext';
import { recipes } from '../data/recipes';
import { RecipeImage } from '../components/RecipeImage';

export function Home() {
  const { t, local } = useI18n();
  const { navigate } = useCookingSession();
  return <>
    <section className="home-editorial">
      <div className="home-intro">
        <span className="eyebrow">{t('tonight')} / 01</span>
        <h1>{t('headline')}</h1>
        <p>{t('intro')}</p>
        <button className="primary" onClick={() => navigate('recipes')}>{t('start')}<ArrowRight size={18} /></button>
        <div className="home-menu">
          {recipes.map((recipe, index) => <div key={recipe.id}><span className="menu-index">0{index + 1}</span><div><strong>{local(recipe.name)}</strong><small>{recipe.estimatedMinutes} {t('min')} · {t(recipe.difficulty)}</small></div></div>)}
        </div>
      </div>
      <figure className="home-feature">
        <RecipeImage recipe={recipes[0]} />
        <figcaption><span>{local(recipes[0].name)}</span><span>01 / 03</span></figcaption>
      </figure>
    </section>
    <section className="home-bottom">
      <ol className="home-steps" aria-label={t('explore')}>
        {(['feature1', 'feature2', 'feature3'] as const).map((key, index) => <li key={key}><span>0{index + 1}</span>{t(key)}</li>)}
      </ol>
      <div className="home-sides">{recipes.slice(1).map(recipe => <figure key={recipe.id}><RecipeImage recipe={recipe} /><figcaption>{local(recipe.name)}</figcaption></figure>)}</div>
    </section>
    <p className="demo-note home-note">{t('temporary')}</p>
  </>;
}
