import type { CookingTask, KitchenEquipment } from '../types/recipe';
export function capacities(equipment: KitchenEquipment): Record<string, number> {
  return { burner: equipment.burners, pan: equipment.pans, pot: equipment.pots,
    oven: Number(equipment.oven), knife: 1, board: 1, attention: 1 };
}
export function resources(task: CookingTask): string[] {
  return [...task.equipment.filter(item => item !== 'none'), ...(task.requiresAttention ? ['attention'] : [])];
}
export function fits(task: CookingTask, others: CookingTask[], equipment: KitchenEquipment) {
  const limits = capacities(equipment);
  const usage: Record<string, number> = {};
  for (const item of [task, ...others]) for (const key of resources(item)) usage[key] = (usage[key] ?? 0) + 1;
  return Object.entries(usage).every(([key, count]) => count <= (limits[key] ?? 0));
}
