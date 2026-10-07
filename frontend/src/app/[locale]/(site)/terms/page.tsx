/** /[locale]/terms — terms of use. Text comes from messages → terms.*. */
import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import PageHero from '@/components/ui/PageHero';
import LegalDoc from '@/components/ui/LegalDoc';

export default function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <PageHero page="terms" />
      <div className="page-section">
        <div className="page-inner narrow">
          <LegalDoc ns="terms" />
        </div>
      </div>
    </>
  );
}
