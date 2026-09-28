/**
 * Layout for login / signup / forgot-password / reset-password.
 * Deliberately has no site header, nav or footer: just the temple mark, a
 * language switch and a centred ivory card on the maroon/gold background.
 */
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import NamamDivider from '@/components/ui/NamamDivider';
import AuthLocaleSwitch from '@/components/auth/AuthLocaleSwitch';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [t, th] = await Promise.all([getTranslations('auth'), getTranslations('header')]);
  return (
    <div className="auth-shell">
      <div className="auth-topbar">
        <Link href="/" className="auth-back">{t('backToSite')}</Link>
        <AuthLocaleSwitch />
      </div>
      <div className="auth-column">
        <Link href="/" className="auth-brand" aria-label={th('templeName')}>
          <Image src="/images/logo.png" alt="" width={260} height={110} priority className="auth-logo" />
          <span className="auth-brand-name">{th('templeName')}</span>
          <span className="auth-brand-alt">{th('templeNameNe')}</span>
        </Link>
        <NamamDivider center light />
        <main className="auth-card">{children}</main>
      </div>
    </div>
  );
}
