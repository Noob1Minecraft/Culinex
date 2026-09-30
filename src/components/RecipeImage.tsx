import { useI18n } from '../i18n';
import type { Recipe } from '../types/recipe';

const photography: Record<string, string> = {
  steak: '/images/steak-editorial.png',
  pasta: '/images/pasta-editorial.png',
  salad: '/images/salad-editorial.png',
};

/** Presentation assets only; recipe.image can replace the demo photograph. */
export function RecipeImage({ recipe }: { recipe: Recipe }) {
  const { local } = useI18n();
  const source = recipe.image || photography[recipe.id];
  return source ? <img src={source} alt={local(recipe.name)} /> : <span aria-hidden="true">{recipe.visual}</span>;
}
