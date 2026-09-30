import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LanguageProvider, storedLanguage } from './i18n';
import { CookingSessionProvider } from './context/CookingSessionContext';
import { ru } from './i18n/ru';
import { kk } from './i18n/kk';
import { en } from './i18n/en';
import './styles.css';
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { const t = { ru, kk, en }[storedLanguage()]; return this.state.failed ? <main className="panel"><h1>Culinex</h1><p>{t.unexpectedError}</p><button className="primary" onClick={() => window.location.reload()}>{t.recover}</button></main> : this.props.children; }
}
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><LanguageProvider><CookingSessionProvider><App /></CookingSessionProvider></LanguageProvider></ErrorBoundary></StrictMode>);
