import { ArrowLeft, ChefHat } from 'lucide-react';
import { useI18n } from './i18n';
import { useCookingSession } from './context/CookingSessionContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Home } from './pages/Home';
import { Recipes } from './pages/Recipes';
import { Planner } from './pages/Planner';
import { Schedule } from './pages/Schedule';
import { CookingMode } from './pages/CookingMode';
import { Result } from './pages/Result';
export default function App() {
  const { t } = useI18n(); const { page, session, navigate, reset } = useCookingSession();
  const effectivePage = session.status === 'completed' ? 'result' : page;
  const steps = ['recipes', 'planner', 'schedule', 'cooking', 'result'] as const;
  const currentIndex = steps.indexOf(effectivePage as typeof steps[number]);
  const invalid = (['schedule', 'cooking', 'result'].includes(effectivePage) && !session.plan) || (effectivePage === 'planner' && session.selectedRecipeIds.length < 2);
  return <div className="app-shell"><header className="site-header"><div className="header-inner"><div className="brand"><span className="brand-mark"><ChefHat size={23} /></span><span>CULINEX<span className="brand-dot">.</span></span></div><nav className="header-nav" aria-label="Culinex">{effectivePage === 'home' ? <><span className="nav-current">{t('home')}</span><button onClick={() => navigate('recipes')}>{t('recipes')}</button></> : <span>{t(effectivePage)}</span>}</nav><div className="header-right"><span className="demo-label">{t('demo')}</span><LanguageSwitcher /></div></div></header><main id="main-content">{effectivePage !== 'home' && effectivePage !== 'result' && <div className="flow-header">{session.status === 'planning' ? <button className="back-button" onClick={() => navigate(effectivePage === 'recipes' ? 'home' : effectivePage === 'planner' ? 'recipes' : 'planner')}><ArrowLeft size={16} />{t('back')}</button> : <span className="success-kicker"><span className="status-dot" />{t('running')}</span>}<ol className="flow-steps">{steps.slice(0, 4).map((step, i) => <li key={step} className={i <= currentIndex ? 'reached' : ''} aria-current={step === effectivePage ? 'step' : undefined}><span>{i + 1}</span>{t(step)}</li>)}</ol></div>}{invalid ? <section className="panel"><p role="alert">{t('sessionError')}</p><button className="primary" onClick={reset}>{t('recover')}</button></section> : effectivePage === 'home' ? <Home /> : effectivePage === 'recipes' ? <Recipes /> : effectivePage === 'planner' ? <Planner /> : effectivePage === 'schedule' ? <Schedule /> : effectivePage === 'cooking' ? <CookingMode /> : <Result />}</main><footer className="site-footer"><span>CULINEX<span className="orange">.</span></span><span>{t('footer')}</span><span>{t('demo')}</span></footer></div>;
}
