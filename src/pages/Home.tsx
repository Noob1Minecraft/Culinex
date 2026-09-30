import { ArrowRight, Layers3, ListChecks, Timer } from 'lucide-react';
import { useI18n } from '../i18n';
import { useCookingSession } from '../context/CookingSessionContext';
import { recipes } from '../data/recipes';
import { RecipeCard } from '../components/RecipeCard';
export function Home() {
  const { t, local } = useI18n(); const { navigate } = useCookingSession();
  return <><section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="status-dot" />{t('greeting')}</span><h1>{t('headline')}</h1><p>{t('intro')}</p><button className="primary" onClick={() => navigate('recipes')}>{t('start')}<ArrowRight size={19} /></button><div className="hero-footnote"><span className="mini-avatars">◷</span>{t('sync')}</div></div>
    <div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-caption"><span className="status-dot" />CULINEX / {t('coordinated')}</div><div className="hero-plate"><span aria-hidden="true">{recipes[2].visual}</span></div><div className="floating-dish dish-top"><span aria-hidden="true">{recipes[0].visual}</span><div>{local(recipes[0].name)}<small><span className="status-dot" />{t('finished')}</small></div><span className="dish-tick">✓</span></div><div className="floating-dish dish-bottom"><span aria-hidden="true">{recipes[1].visual}</span><div>{local(recipes[1].name)}<small>{t('parallelValue')}</small></div><Timer size={23} /></div><div className="art-footer"><Layers3 size={17} />{t('syncDetail')}</div></div>
  </section><section className="how-grid" aria-label={t('explore')}>{([['feature1', 'feature1Text', Layers3], ['feature2', 'feature2Text', ListChecks], ['feature3', 'feature3Text', Timer]] as const).map(([title, detail, Icon], i) => <div className="how-item" key={title}><span className="how-icon"><Icon size={23} /></span><div><span className="step-number">0{i + 1}</span><h3>{t(title)}</h3><p>{t(detail)}</p></div></div>)}</section>
  <section className="menu-section"><div className="section-heading"><div><span className="eyebrow">CULINEX / {t('menu')}</span><h2>{t('tonight')}</h2></div><span className="subtle-tag">{t('temporary')}</span></div><div className="recipe-grid">{recipes.map(recipe => <RecipeCard recipe={recipe} key={recipe.id} />)}</div></section></>;
}
