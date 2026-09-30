export interface ScheduledTask { taskId: string; recipeId: string; startMinute: number; endMinute: number }
export interface Plan { tasks: ScheduledTask[]; durationMinutes: number; startAt: number; finishAt: number }
