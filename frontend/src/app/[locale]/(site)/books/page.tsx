import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageHero     from '@/components/ui/PageHero';
import StateMessage from '@/components/ui/StateMessage';
import BooksGrid    from '@/components/books/BooksGrid';
import { getBooks } from '@/lib/api';

/** /books — sacred library from GET /api/v1/books. */
export default async function BooksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [books, t] = await Promise.all([getBooks(), getTranslations('state')]);

  return (
    <>
      <PageHero page="books" />
      <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
          {books.error
            ? <StateMessage kind="error" message={t('error')} hint={t('errorHint')} />
            : <BooksGrid books={books.data} />}
        </div>
      </div>
    </>
  );
}
