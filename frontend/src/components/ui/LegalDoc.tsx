/**
 * Renders a legal page (privacy policy, terms of use) from messages.
 * Text lives in messages → <ns>.{updated,intro,sections[]}, so both pages stay
 * translatable and neither has prose hard-coded in the component.
 */
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface Section { h: string; p?: string; items?: string[] }

export default function LegalDoc({ ns }: { ns: 'privacy' | 'terms' }) {
  const t = useTranslations(ns);
  const tl = useTranslations('legal');
  const sections = t.raw('sections') as Section[];
  const other = ns === 'privacy' ? 'terms' : 'privacy';

  return (
    <div className="legal-doc">
      <span className="legal-updated">{t('updated')}</span>
      <p className="legal-intro">{t('intro')}</p>

      {sections.map(({ h, p, items }) => (
        <section key={h} className="legal-section">
          <h2>{h}</h2>
          {p && <p>{p}</p>}
          {items && items.length > 0 && <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>}
        </section>
      ))}

      <section className="legal-section legal-contact">
        <h2>{tl('questionsTitle')}</h2>
        <p>{tl('questionsBody')}</p>
        <div className="legal-links">
          <Link href="/contact" className="btn-outline">{tl('contactLink')}</Link>
          <Link href={`/${other}`} className="btn-outline">{tl(other === 'terms' ? 'otherTerms' : 'otherPrivacy')}</Link>
        </div>
      </section>
    </div>
  );
}
