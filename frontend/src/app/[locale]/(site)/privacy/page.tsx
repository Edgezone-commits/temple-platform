/** /[locale]/privacy — privacy policy. Text comes from messages → privacy.*. */
import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import PageHero from '@/components/ui/PageHero';
import LegalDoc from '@/components/ui/LegalDoc';

export default function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <PageHero page="privacy" />
      <div className="page-section">
        <div className="page-inner narrow">
          <LegalDoc ns="privacy" />
        </div>
      </div>
    </>
  );
}
