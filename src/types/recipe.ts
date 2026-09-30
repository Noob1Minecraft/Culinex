export type Language = 'ru' | 'kk' | 'en';
export type LocalizedString = Record<Language, string>;
export type EquipmentType = 'burner' | 'pan' | 'pot' | 'oven' | 'knife' | 'board' | 'none';
export interface KitchenEquipment { burners: number; pans: number; pots: number; oven: boolean }
export interface CookingTask {
  id: string; recipeId: string; name: LocalizedString; durationMinutes: number;
  dependencies: string[]; equipment: EquipmentType[]; requiresAttention: boolean;
}
export interface Recipe {
  id: string; name: LocalizedString; description: LocalizedString; estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard'; image?: string; visual: string; color: string;
  tasks: CookingTask[];
}
