import { useTranslations } from 'next-intl';

type Page = 'events' | 'calendar' | 'poojas' | 'book' | 'books' | 'bhajans' | 'gallery' | 'history' | 'contact';

/** Inner-page banner. Text comes from messages → pages.<page>.{eyebrow,title,titleNe}. */
export default function PageHero({ page }: { page: Page }) {
  const t = useTranslations(`pages.${page}`);
  return (
    <div className="page-hero">
      <span className="section-eyebrow">{t('eyebrow')}</span>
      <h1 className="section-title light">{t('title')}</h1>
      <span className="section-title-ne light">{t('titleNe')}</span>
    </div>
  );
}
