import type { CookingTask, LocalizedString, Recipe } from '../types/recipe';
// TEMPORARY DEMO DATA
// Replace with final culinary-team recipes before Demo Day.
// IDs must be globally unique. All durations are positive whole minutes.
const l = (ru: string, kk: string, en: string): LocalizedString => ({ ru, kk, en });
const task = (recipeId: string, id: string, name: LocalizedString, durationMinutes: number,
  dependencies: string[], equipment: CookingTask['equipment'], requiresAttention: boolean): CookingTask =>
  ({ recipeId, id, name, durationMinutes, dependencies, equipment, requiresAttention });
export const recipes: Recipe[] = [
  { id: 'steak', name: l('Стейк с травами', 'Шөп қосылған стейк', 'Herb butter steak'),
    description: l('Румяная корочка, аромат трав и немного терпения.', 'Қызарған қабық, хош иісті шөптер және сәл шыдамдылық.', 'A golden crust, fragrant herbs, and a little patience.'),
    estimatedMinutes: 18, difficulty: 'medium', visual: '🥩', color: '#ff9478',
    tasks: [task('steak', 'steak-prep', l('Подготовить и приправить стейк', 'Стейкті дайындап, дәмдеуіш қосу', 'Prepare and season the steak'), 4, [], ['knife', 'board'], true),
      task('steak', 'steak-fry', l('Обжарить стейк', 'Стейкті қуыру', 'Sear the steak'), 8, ['steak-prep'], ['burner', 'pan'], true),
      task('steak', 'steak-rest', l('Дать стейку отдохнуть', 'Стейкті тынықтыру', 'Let the steak rest'), 5, ['steak-fry'], ['none'], false),
      task('steak', 'steak-serve', l('Подать стейк', 'Стейкті ұсыну', 'Plate the steak'), 1, ['steak-rest'], ['none'], true)] },
  { id: 'pasta', name: l('Паста с томатами', 'Қызанақ қосылған паста', 'Tomato garden pasta'),
    description: l('Простая паста с тёплым томатным соусом.', 'Жылы қызанақ тұздығы қосылған қарапайым паста.', 'Comforting pasta tossed in a warm tomato sauce.'),
    estimatedMinutes: 20, difficulty: 'easy', visual: '🍝', color: '#e6ba71',
    tasks: [task('pasta', 'pasta-prep', l('Налить воду и подготовить томаты', 'Су құйып, қызанақты дайындау', 'Fill the pot and prepare tomatoes'), 3, [], ['knife', 'board', 'pot'], true),
      task('pasta', 'pasta-boil', l('Довести воду до кипения', 'Суды қайнату', 'Bring the water to a boil'), 5, ['pasta-prep'], ['burner', 'pot'], false),
      task('pasta', 'pasta-add', l('Добавить пасту в воду', 'Пастаны суға салу', 'Add pasta to the water'), 1, ['pasta-boil'], ['burner', 'pot'], true),
      task('pasta', 'pasta-cook', l('Варить пасту', 'Пастаны пісіру', 'Simmer the pasta'), 8, ['pasta-add'], ['burner', 'pot'], false),
      task('pasta', 'pasta-finish', l('Слить воду, добавить соус и подать', 'Суын төгіп, тұздық қосып ұсыну', 'Drain, toss with sauce, and serve'), 3, ['pasta-cook'], ['pot'], true)] },
  { id: 'salad', name: l('Зелёный салат', 'Жасыл салат', 'Crisp green salad'),
    description: l('Свежая зелень, хрустящие овощи и лёгкая заправка.', 'Балғын көк, қытырлақ көкөністер және жеңіл тұздық.', 'Fresh leaves, crunchy vegetables, and a bright dressing.'),
    estimatedMinutes: 10, difficulty: 'easy', visual: '🥗', color: '#86cba6',
    tasks: [task('salad', 'salad-cut', l('Вымыть и нарезать овощи', 'Көкөністерді жуып, турау', 'Wash and chop the vegetables'), 5, [], ['knife', 'board'], true),
      task('salad', 'salad-dress', l('Смешать заправку', 'Тұздықты араластыру', 'Mix the dressing'), 2, ['salad-cut'], ['none'], true),
      task('salad', 'salad-rest', l('Дать заправке настояться', 'Тұздықты тұндыру', 'Let the dressing infuse'), 2, ['salad-dress'], ['none'], false),
      task('salad', 'salad-serve', l('Заправить и подать салат', 'Салатқа тұздық қосып ұсыну', 'Dress and serve the salad'), 1, ['salad-rest'], ['none'], true)] },
];
export const recipeById = Object.fromEntries(recipes.map(recipe => [recipe.id, recipe]));
export const taskById = Object.fromEntries(recipes.flatMap(recipe => recipe.tasks).map(task => [task.id, task]));
