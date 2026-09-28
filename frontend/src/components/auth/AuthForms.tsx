'use client';
/**
 * The four auth forms. Each posts to a Server Action (lib/auth/actions.ts)
 * via useActionState, which returns { error | ok } for inline messages;
 * successful logins/resets redirect on the server.
 */
import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Alert, Field, OAuthButtons, PasswordField, SubmitButton } from './AuthFields';
import {
  requestPasswordReset, resetPassword, signIn, signUp, type AuthState,
} from '@/lib/auth/actions';

const initial: AuthState = {};

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="auth-head">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}

function Divider() {
  const t = useTranslations('auth');
  return <div className="auth-or"><span>{t('or')}</span></div>;
}

function ErrorAlert({ state, extra }: { state: AuthState; extra?: string | null }) {
  const t = useTranslations('auth.errors');
  const key = state.error ?? extra;
  if (!key || !t.has(key)) return null;
  return <Alert kind="error">{t(key)}</Alert>;
}

// ------------------------------------------------------------------ login
export function LoginForm({ next, notice, urlError }: { next?: string; notice?: 'reset'; urlError?: string }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [state, action] = useActionState(signIn, initial);
  return (
    <>
      <Header title={t('login.title')} subtitle={t('login.subtitle')} />
      {notice === 'reset' && !state.error && <Alert kind="success">{t('login.resetDone')}</Alert>}
      <ErrorAlert state={state} extra={urlError} />
      <form action={action} className="auth-form" noValidate={false}>
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <Field label={t('email')} name="email" type="email" autoComplete="email" required placeholder={t('emailPh')} defaultValue={state.email} />
        <PasswordField label={t('password')} name="password" autoComplete="current-password" required placeholder={t('passwordPh')} />
        <div className="auth-row-end"><Link href="/forgot-password" className="auth-link">{t('login.forgot')}</Link></div>
        <SubmitButton>{t('login.submit')}</SubmitButton>
      </form>
      <Divider />
      <OAuthButtons next={next} />
      <p className="auth-foot">{t('login.noAccount')} <Link href={next ? { pathname: '/signup', query: { next } } : '/signup'} className="auth-link">{t('login.signupLink')}</Link></p>
    </>
  );
}

// ------------------------------------------------------------------ signup
export function SignupForm({ next }: { next?: string }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [state, action] = useActionState(signUp, initial);

  if (state.ok === 'checkEmail') {
    return (
      <div className="auth-done">
        <div className="auth-done-icon" aria-hidden="true">📧</div>
        <h1>{t('signup.checkEmailTitle')}</h1>
        <p>{t('signup.checkEmailBody', { email: state.email ?? '' })}</p>
        <Link href="/login" className="btn-primary">{t('signup.loginLink')}</Link>
      </div>
    );
  }
  return (
    <>
      <Header title={t('signup.title')} subtitle={t('signup.subtitle')} />
      <ErrorAlert state={state} />
      <form action={action} className="auth-form">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <Field label={t('name')} name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder={t('namePh')} />
        <Field label={t('email')} name="email" type="email" autoComplete="email" required placeholder={t('emailPh')} defaultValue={state.email} />
        <PasswordField label={t('password')} name="password" autoComplete="new-password" required minLength={8} placeholder={t('newPasswordPh')} hint={t('signup.passwordHint')} />
        <PasswordField label={t('confirmPassword')} name="confirm" autoComplete="new-password" required minLength={8} placeholder={t('confirmPh')} />
        <SubmitButton>{t('signup.submit')}</SubmitButton>
      </form>
      <Divider />
      <OAuthButtons next={next} />
      <p className="auth-foot">{t('signup.hasAccount')} <Link href="/login" className="auth-link">{t('signup.loginLink')}</Link></p>
    </>
  );
}

// ------------------------------------------------------------------ forgot password
export function ForgotForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [state, action] = useActionState(requestPasswordReset, initial);
  return (
    <>
      <Header title={t('forgot.title')} subtitle={t('forgot.subtitle')} />
      <ErrorAlert state={state} />
      <form action={action} className="auth-form">
        <input type="hidden" name="locale" value={locale} />
        <Field label={t('email')} name="email" type="email" autoComplete="email" required placeholder={t('emailPh')} defaultValue={state.email} />
        <SubmitButton>{t('forgot.submit')}</SubmitButton>
      </form>
      <p className="auth-foot"><Link href="/login" className="auth-link">← {t('forgot.back')}</Link></p>
    </>
  );
}

// ------------------------------------------------------------------ reset password (code + new password)
export function ResetForm({ email, sent }: { email?: string; sent?: boolean }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [state, action] = useActionState(resetPassword, initial);
  const addr = state.email ?? email ?? '';
  return (
    <>
      <Header title={t('reset.title')} subtitle={t('reset.subtitle')} />
      {sent && !state.error && addr && <Alert kind="info">{t('reset.sent', { email: addr })}</Alert>}
      <ErrorAlert state={state} />
      <form action={action} className="auth-form">
        <input type="hidden" name="locale" value={locale} />
        <Field label={t('email')} name="email" type="email" autoComplete="email" required placeholder={t('emailPh')} defaultValue={addr} />
        <Field label={t('reset.code')} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}"
          required placeholder={t('reset.codePh')} className="auth-code" maxLength={12} />
        <PasswordField label={t('newPassword')} name="password" autoComplete="new-password" required minLength={8} placeholder={t('newPasswordPh')} />
        <PasswordField label={t('confirmPassword')} name="confirm" autoComplete="new-password" required minLength={8} placeholder={t('confirmPh')} />
        <SubmitButton>{t('reset.submit')}</SubmitButton>
      </form>
      <p className="auth-foot"><Link href="/forgot-password" className="auth-link">{t('reset.resend')}</Link></p>
    </>
  );
}
