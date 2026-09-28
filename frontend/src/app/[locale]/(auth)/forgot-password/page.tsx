import { setRequestLocale } from 'next-intl/server';
import { ForgotForm } from '@/components/auth/AuthForms';

/** /[locale]/forgot-password — step 1: request a 6-digit reset code by email. */
export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <ForgotForm />;
}
