import { setRequestLocale } from 'next-intl/server';
import { SignupForm } from '@/components/auth/AuthForms';

const one = (v: unknown) => (typeof v === "string" ? v : undefined);

/** /[locale]/signup */
export default async function SignupPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  return <SignupForm next={one(sp.next)} />;
}
