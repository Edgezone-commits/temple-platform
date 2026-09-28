import { setRequestLocale } from 'next-intl/server';
import { ResetForm } from '@/components/auth/AuthForms';

const one = (v: unknown) => (typeof v === "string" ? v : undefined);

/** /[locale]/reset-password — step 2: email + code + new password (?email=&sent=1 from step 1). */
export default async function ResetPasswordPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  return <ResetForm email={one(sp.email)} sent={sp.sent === '1'} />;
}
