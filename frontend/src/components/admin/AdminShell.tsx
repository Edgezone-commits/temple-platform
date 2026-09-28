/**
 * Admin chrome: dark sidebar (collapsible on phones) + slim top bar with the
 * admin's name, language switch, "view website" and log out.
 */
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { signOut } from '@/lib/auth/actions';
import AdminNav from './AdminNav';
import AuthLocaleSwitch from '@/components/auth/AuthLocaleSwitch';

export default async function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const [t, th, locale] = await Promise.all([getTranslations('admin'), getTranslations('header'), getLocale()]);
  return (
    <div className="adm">
      <AdminNav title={t('title')} />
      <div className="adm-main">
        <header className="adm-top">
          <span className="adm-user" title={t('signedInAs', { name })}>👤 {name}</span>
          <div className="adm-top-actions">
            <AuthLocaleSwitch />
            <Link href="/" className="adm-top-link" target="_blank">{t('viewSite')}</Link>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="adm-top-link">{th('logout')}</button>
            </form>
          </div>
        </header>
        <div className="adm-content">{children}</div>
      </div>
    </div>
  );
}
