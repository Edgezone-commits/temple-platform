import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import PageHero from '@/components/ui/PageHero';
import BooksGrid from '@/components/books/BooksGrid';

export default function BooksPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <PageHero page="books" />
      <BooksGrid />
    </>
  );
}
