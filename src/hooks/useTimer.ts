import { useEffect, useState } from 'react';
export function useClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const interval = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(interval); }, []);
  return now;
}
export function remainingSeconds(startedAt: number, durationMinutes: number, now: number) {
  // A newly dispatched task can be newer than the last one-second clock tick.
  return Math.min(durationMinutes * 60, Math.max(0, Math.ceil((startedAt + durationMinutes * 60_000 - now) / 1000)));
}
export function formatTimer(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
