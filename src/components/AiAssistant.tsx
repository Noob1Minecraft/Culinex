import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { useCookingSession } from '../context/CookingSessionContext';
import { recipeById, taskById } from '../data/recipes';
export function AiAssistant({ currentTaskId, onClose }: { currentTaskId?: string; onClose: () => void }) {
  const { t, local, language } = useI18n();
  const { session } = useCookingSession();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); return () => controller.current?.abort(); }, []);
  useEffect(() => { controller.current?.abort(); controller.current = null; setAnswer(''); setLoading(false); setFailed(false); }, [language]);
  async function ask(event: React.FormEvent) {
    event.preventDefault(); if (!question.trim() || loading) return;
    setLoading(true); setFailed(false); setAnswer('');
    const requestController = new AbortController(); controller.current = requestController;
    const timeout = window.setTimeout(() => requestController.abort(), 25_000);
    try {
      const task = currentTaskId ? taskById[currentTaskId] : undefined;
      const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: requestController.signal,
        body: JSON.stringify({ question: question.trim(), language, context: { selectedRecipes: session.selectedRecipeIds.map(id => local(recipeById[id].name)), recipe: task ? local(recipeById[task.recipeId].name) : '', currentTask: task ? local(task.name) : '' } }) });
      if (!response.ok) throw new Error('unavailable');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('answer' in data) || typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('invalid response');
      if (controller.current === requestController && !requestController.signal.aborted) setAnswer(data.answer);
    } catch { if (controller.current === requestController) setFailed(true); }
    finally { window.clearTimeout(timeout); if (controller.current === requestController) setLoading(false); }
  }
  return <dialog ref={dialog} className="ai-dialog" aria-labelledby="ai-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="ai-header"><span className="icon-tile"><Sparkles size={23} /></span><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={22} /></button></div>
    <h2 id="ai-title">{t('aiTitle')}</h2><p className="muted">{t('aiSubtitle')}</p>
    <form onSubmit={ask}><label htmlFor="question">{t('question')}</label><textarea id="question" autoFocus value={question} onChange={e => setQuestion(e.target.value)} placeholder={t('questionPlaceholder')} maxLength={1000} required rows={3} /><button className="primary" disabled={loading || !question.trim()}>{loading ? t('thinking') : t('send')}<ArrowUp size={18} /></button></form>
    {failed && <p className="notice" role="alert">{t('aiUnavailable')}</p>}{answer && <div className="ai-answer" role="status">{answer}</div>}
    <p className="fine-print">{t('aiNote')}</p>
  </dialog>;
}
