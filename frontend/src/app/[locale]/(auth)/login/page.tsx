import { setRequestLocale } from 'next-intl/server';
import { LoginForm } from '@/components/auth/AuthForms';

const one = (v: unknown) => (typeof v === "string" ? v : undefined);

/** /[locale]/login — ?next=<path> after login, ?reset=1 after a password change, ?error=oauth|link from the callback. */
export default async function LoginPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  return <LoginForm next={one(sp.next)} notice={sp.reset ? 'reset' : undefined} urlError={one(sp.error)} />;
}
