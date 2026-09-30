import { Check, Clock3, Plus, Utensils } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Recipe } from '../types/recipe';
export function RecipeCard({ recipe, selected, onSelect }: { recipe: Recipe; selected?: boolean; onSelect?: () => void }) {
  const { t, local } = useI18n();
  return <article className={`recipe-card ${selected ? 'is-selected' : ''}`}>
    <div className="recipe-visual" style={{ '--dish-color': recipe.color } as React.CSSProperties}>
      <span className="recipe-badge">{t('temporary')}</span>
      {recipe.image ? <img src={recipe.image} alt={local(recipe.name)} /> : <div className="plate"><span aria-hidden="true">{recipe.visual}</span><i /><i /></div>}
      {selected && <span className="selected-check"><Check size={17} /></span>}
    </div>
    <div className="recipe-body"><div className="recipe-meta"><span><Clock3 size={14} />{recipe.estimatedMinutes} {t('min')}</span><span><Utensils size={14} />{t(recipe.difficulty)}</span></div>
      <h3>{local(recipe.name)}</h3><p>{local(recipe.description)}</p>
      {onSelect && <button className={`select-button ${selected ? 'selected' : ''}`} onClick={onSelect} aria-pressed={!!selected} aria-label={`${selected ? t('selectedLabel') : t('select')}: ${local(recipe.name)}`}>{selected ? <Check size={17} /> : <Plus size={17} />}{selected ? t('selectedLabel') : t('select')}</button>}
    </div>
  </article>;
}
