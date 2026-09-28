'use client';
/**
 * Building blocks for the auth forms. Everything is a plain <form> field so
 * the Server Actions receive FormData (works without JS, too).
 */
import { useId, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { signInWithProvider } from '@/lib/auth/actions';

export function Field({ label, hint, ...input }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...input} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

export function PasswordField({ label, hint, ...input }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const t = useTranslations('auth');
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input id={id} type={show ? 'text' : 'password'} {...input} aria-describedby={hint ? `${id}-hint` : undefined} />
        <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? t('hidePassword') : t('showPassword')} aria-pressed={show}>
          {show ? '🙈' : '👁'}
        </button>
      </div>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const t = useTranslations('auth');
  return (
    <button type="submit" className="btn-primary auth-submit" disabled={pending} aria-busy={pending}>
      {pending ? t('working') : children}
    </button>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  return <p className={`auth-alert ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</p>;
}

/** Google / Facebook buttons — each is its own form posting to the OAuth action. */
export function OAuthButtons({ next }: { next?: string }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  return (
    <div className="auth-oauth">
      {(['google', 'facebook'] as const).map(p => (
        <form key={p} action={signInWithProvider}>
          <input type="hidden" name="provider" value={p} />
          <input type="hidden" name="locale" value={locale} />
          {next && <input type="hidden" name="next" value={next} />}
          <OAuthSubmit provider={p} label={t(p)} />
        </form>
      ))}
    </div>
  );
}

function OAuthSubmit({ provider, label }: { provider: 'google' | 'facebook'; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`auth-oauth-btn ${provider}`} disabled={pending} aria-busy={pending}>
      <span aria-hidden="true" className="auth-oauth-icon">{provider === 'google' ? <GoogleIcon /> : <FacebookIcon />}</span>
      {label}
    </button>
  );
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.23 2.68.23v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
);
