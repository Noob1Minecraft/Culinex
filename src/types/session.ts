import type { KitchenEquipment } from './recipe';
import type { Plan } from './scheduler';
export type Page = 'home' | 'recipes' | 'planner' | 'schedule' | 'cooking' | 'result';
export interface TaskRun { startedAt: number; completedAt?: number }
export interface CookingSession {
  selectedRecipeIds: string[]; targetFinishTime: string; equipment: KitchenEquipment;
  plan: Plan | null; status: 'planning' | 'cooking' | 'completed';
  runs: Record<string, TaskRun>; startedAt?: number; completedAt?: number;
}
