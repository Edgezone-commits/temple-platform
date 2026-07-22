import PageHero from '@/components/ui/PageHero';
import BooksGrid from '@/components/books/BooksGrid';

export default function BooksPage() {
  return (
    <>
      <PageHero eyebrow="Sacred Library" title="Books" titleNe="पवित्र पुस्तकालय" />
      <BooksGrid />
    </>
  );
}
