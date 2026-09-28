'use client';
/** EN / नेपाली switch for the auth pages (keeps the current page and query). */
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';

export default function AuthLocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const go = (l: 'en' | 'ne') => router.replace(`${pathname}${search.size ? `?${search}` : ''}`, { locale: l });
  return (
    <div className="lang-toggle">
      <button className={`lang-btn ${locale === 'en' ? 'active' : ''}`} onClick={() => go('en')} aria-pressed={locale === 'en'}>EN</button>
      <button className={`lang-btn ${locale === 'ne' ? 'active' : ''}`} onClick={() => go('ne')} aria-pressed={locale === 'ne'}>नेपाली</button>
    </div>
  );
}
