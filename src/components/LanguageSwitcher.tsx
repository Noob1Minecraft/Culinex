import { useI18n } from '../i18n';
import type { Language } from '../types/recipe';
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return <div className="language-switcher" role="group" aria-label={t('language')}>
    {(['ru', 'kk', 'en'] as Language[]).map(value => <button key={value} aria-pressed={value === language} onClick={() => setLanguage(value)}>{value === 'kk' ? 'KZ' : value.toUpperCase()}</button>)}
  </div>;
}
