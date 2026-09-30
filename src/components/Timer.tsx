import { formatTimer, remainingSeconds } from '../hooks/useTimer';
import { useI18n } from '../i18n';
export function Timer({ startedAt, durationMinutes, now, large = false }: { startedAt: number; durationMinutes: number; now: number; large?: boolean }) {
  const { t } = useI18n();
  const remaining = remainingSeconds(startedAt, durationMinutes, now);
  return <div className={large ? 'timer timer-large' : 'timer'}><span role="timer" aria-label={t('remaining')}>{formatTimer(remaining)}</span>{remaining === 0 && <small role="status">{t('timerFinished')}</small>}</div>;
}
