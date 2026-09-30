import { ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { recipes } from '../data/recipes';
import { useCookingSession } from '../context/CookingSessionContext';
import { RecipeCard } from '../components/RecipeCard';
export function Recipes() {
  const { t } = useI18n(); const { session, toggleRecipe, navigate } = useCookingSession();
  const count = session.selectedRecipeIds.length;
  return <><header className="page-heading"><h1>{t('choose')}</h1><p>{t('chooseDetail')}</p></header><p className="demo-note">{t('temporaryNote')}</p><div className="recipe-grid">{recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} selected={session.selectedRecipeIds.includes(recipe.id)} onSelect={() => toggleRecipe(recipe.id)} />)}</div><div className="action-bar"><div><strong>{t('selected')} <span className="orange">{count} / 3</span></strong><small>{t('selectionError')}</small></div><button className="primary" disabled={count < 2 || count > 3} onClick={() => navigate('planner')}>{t('continue')}<ArrowRight size={18} /></button></div></>;
}
