import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CookingSession, Page } from '../types/session';
import type { KitchenEquipment } from '../types/recipe';
import { recipes, taskById } from '../data/recipes';
import { buildSchedule, ScheduleError } from '../scheduler/scheduler';
import { completeTask, dispatchReady } from './engine';
import type { TranslationKey } from '../i18n/ru';
const initial = (): CookingSession => ({ selectedRecipeIds: [], targetFinishTime: '19:00', equipment: { burners: 2, pans: 1, pots: 1, oven: false }, plan: null, status: 'planning', runs: {} });
function useSessionState() {
  const [session, setSession] = useState<CookingSession>(initial);
  const [page, setPage] = useState<Page>('home');
  const [error, setError] = useState<TranslationKey | null>(null);
  const navigate = (next: Page) => { setError(null); setPage(next); window.scrollTo({ top: 0 }); };
  return { session, page, error, navigate,
    toggleRecipe(id: string) { setSession(s => {
      if (s.status !== 'planning' || !recipes.some(r => r.id === id)) return s;
      const selected = s.selectedRecipeIds.includes(id) ? s.selectedRecipeIds.filter(value => value !== id) : [...s.selectedRecipeIds, id];
      return selected.length > 3 ? s : { ...s, selectedRecipeIds: selected, plan: null };
    }); },
    configure(targetFinishTime: string, equipment: KitchenEquipment) { setError(null); setSession(s => ({ ...s, targetFinishTime, equipment, plan: null })); },
    generate() { try {
      const plan = buildSchedule(recipes.filter(recipe => session.selectedRecipeIds.includes(recipe.id)), session.equipment, session.targetFinishTime);
      setSession(s => ({ ...s, plan })); navigate('schedule');
    } catch (err) { setError(err instanceof ScheduleError ? err.code : 'scheduleError'); } },
    start() { if (!session.plan) { setError('sessionError'); return; }
      const now = Date.now(); setSession(s => dispatchReady({ ...s, status: 'cooking', runs: {}, startedAt: now }, taskById, now)); navigate('cooking'); },
    complete(id: string) { setSession(s => completeTask(s, id, taskById, Date.now())); },
    reset() { setSession(initial()); navigate('home'); },
  };
}
const SessionContext = createContext<ReturnType<typeof useSessionState> | null>(null);
export function CookingSessionProvider({ children }: { children: ReactNode }) {
  const value = useSessionState(); return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useCookingSession() { const value = useContext(SessionContext); if (!value) throw new Error('CookingSessionProvider missing'); return value; }
