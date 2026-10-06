'use client';
/**
 * "Ask the Pandit" floating chat widget (on every public page, via (site)/layout).
 *
 * Talks ONLY to our FastAPI backend (POST /api/v1/chat) — the Gemini API
 * key never reaches the browser. The backend keeps the real conversation
 * history (chat_history) keyed by the random session id stored here; the
 * copy in localStorage is just so the panel survives page loads.
 *
 * Other components can open it with: window.dispatchEvent(new Event('pandit:open'))
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getBrowserClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/env';
import { API_BASE } from '@/lib/apiUrl';

const STORE_KEY = 'pandit-chat-v1';
const MAX_KEEP = 40;
const MAX_LEN = 1000;

interface Source { n: number; title: string; type: string; url: string }
interface Msg { role: 'user' | 'assistant'; content: string; sources?: Source[]; error?: 'error' | 'busy' | 'offline' }
interface Saved { sessionId: string; messages: Msg[] }

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch { return null; }
}
function save(s: Saved) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...s, messages: s.messages.slice(-MAX_KEEP) })); } catch { /* storage unavailable */ }
}
const newSession = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`);

/** Render answer text: keep line breaks, turn [n] citations into small superscripts. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return <>{parts.map((p, i) => (/^\[\d+\]$/.test(p) ? <sup key={i} className="pc-cite">{p.slice(1, -1)}</sup> : <span key={i}>{p}</span>))}</>;
}

export default function PanditChat() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  // restore after mount (localStorage is browser-only)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const s = load();
      setSessionId(s?.sessionId || newSession());
      if (s?.messages?.length) setMessages(s.messages);
    });
    const onOpen = () => setOpen(true);
    window.addEventListener('pandit:open', onOpen);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pandit:open', onOpen); };
  }, []);

  useEffect(() => { if (sessionId) save({ sessionId, messages }); }, [sessionId, messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 180);
  }, [open]);

  const close = useCallback(() => { setOpen(false); launcherRef.current?.focus(); }, []);

  async function ask(question: string, retry = false) {
    const q = question.trim();
    if (!q || pending || q.length > MAX_LEN) return;
    setInput('');
    setMessages(m => (retry ? m.filter(x => !x.error) : [...m, { role: 'user', content: q }]));
    setPending(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (supabaseConfigured) {
        const { data } = await getBrowserClient().auth.getSession();
        if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
      }
      const res = await fetch(`${API_BASE}/api/v1/chat/`, {
        method: 'POST', headers,
        body: JSON.stringify({ message: q, session_id: sessionId, locale }),
      });
      if (!res.ok) {
        const kind = res.status === 429 ? 'busy' : res.status === 503 ? 'offline' : 'error';
        setMessages(m => [...m, { role: 'assistant', content: '', error: kind }]);
        return;
      }
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: data.answer, sources: data.sources }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: '', error: 'error' }]);
    } finally {
      setPending(false);
    }
  }

  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
  const suggestions = t.raw('suggestions') as string[];

  return (
    <>
      <button ref={launcherRef} className={`pc-launcher${open ? ' hidden' : ''}`} onClick={() => setOpen(true)}
        aria-haspopup="dialog" aria-expanded={open} aria-controls="pandit-chat">
        <span className="pc-launcher-icon" aria-hidden="true">🙏</span>
        <span className="pc-launcher-label">{t('open')}</span>
      </button>

      <section id="pandit-chat" className={`pc-panel${open ? ' open' : ''}`} role="dialog" aria-modal="false"
        aria-label={t('title')} aria-hidden={!open} inert={!open}
        onKeyDown={e => { if (e.key === 'Escape') close(); }}>
        <header className="pc-head">
          <span className="pc-avatar" aria-hidden="true">🕉</span>
          <div className="pc-head-text">
            <h2>{t('title')}</h2>
            <p>{t('subtitle')}</p>
          </div>
          {messages.length > 0 && (
            <button className="pc-icon-btn" onClick={() => { setMessages([]); setSessionId(newSession()); }} title={t('newChat')} aria-label={t('newChat')}>↺</button>
          )}
          <button className="pc-icon-btn" onClick={close} aria-label={t('close')}>✕</button>
        </header>

        <div className="pc-list" ref={listRef} aria-live="polite">
          <div className="pc-msg assistant">
            <span className="pc-bubble">{t('welcome')}</span>
          </div>
          {messages.length === 0 && (
            <div className="pc-suggest">
              {suggestions.map(s => <button key={s} onClick={() => ask(s)} className="pc-chip">{s}</button>)}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`pc-msg ${m.role}${m.error ? ' error' : ''}`}>
              <span className="sr-only">{m.role === 'user' ? t('you') : t('pandit')}: </span>
              {m.error ? (
                <span className="pc-bubble">
                  {t(m.error)}
                  {m.error !== 'offline' && i === messages.length - 1 && (
                    <button className="pc-retry" onClick={() => ask(lastUser, true)}>{t('retry')}</button>
                  )}
                </span>
              ) : (
                <span className="pc-bubble"><Rich text={m.content} /></span>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="pc-sources">
                  <span>{t('sources')}:</span>
                  {m.sources.map(s => (
                    s.url ? <a key={s.n} href={s.url.startsWith('/') ? `/${locale}${s.url}` : s.url} target={s.url.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer">[{s.n}] {s.title}</a>
                      : <span key={s.n}>[{s.n}] {s.title}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {pending && (
            <div className="pc-msg assistant" role="status">
              <span className="pc-bubble pc-typing"><i /><i /><i /><span>{t('thinking')}</span></span>
            </div>
          )}
        </div>

        <form className="pc-form" onSubmit={e => { e.preventDefault(); ask(input); }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} rows={1}
            placeholder={t('placeholder')} aria-label={t('placeholder')} maxLength={MAX_LEN}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }} />
          <button type="submit" className="pc-send" disabled={pending || !input.trim()} aria-label={t('send')}>➤</button>
        </form>
        <p className="pc-disclaimer">{t('disclaimer')}</p>
      </section>
    </>
  );
}
