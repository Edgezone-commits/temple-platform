"use client";
/**
 * Sacred library grid (data from GET /api/v1/books via books/page.tsx).
 * Only the category filter runs in the browser.
 * "Read" opens the PDF in a new tab; "Download" uses Supabase Storage's
 * ?download query param (the HTML download attribute is ignored cross-origin).
 */
import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import StateMessage from '@/components/ui/StateMessage';
import { formatterFor } from '@/lib/format';
import { BOOK_ICON } from '@/lib/icons';
import { pick, pickAlt } from '@/lib/localize';
import type { Book } from '@/lib/types';

const CATS = ['scripture', 'stotra', 'philosophy', 'biography'] as const;
const LANG_BG: Record<string, string> = { sa: 'var(--maroon-800)', ne: '#1a4a1a', en: '#1a1a4a' };

const btn: React.CSSProperties = { flex:1, fontFamily:'var(--ff-heading)', fontSize:'.65rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', padding:'6px', textAlign:'center', textDecoration:'none' };

function downloadUrl(url: string) {
  return url.includes('?') ? `${url}&download=` : `${url}?download=`;
}

export default function BooksGrid({ books }: { books: Book[] }) {
  const t = useTranslations('books');
  const tc = useTranslations('categories');
  const ts = useTranslations('state');
  const locale = useLocale();
  const format = formatterFor(locale);
  const [cat, setCat] = useState<string>('all');

  if (books.length === 0) return <StateMessage kind="empty" message={ts('emptyBooks')} />;
  const list = cat === 'all' ? books : books.filter(b => b.category === cat);

  return (
    <>
      <div style={{ display:'flex', gap:'.7rem', flexWrap:'wrap', marginBottom:'2.5rem' }} role="toolbar">
        {(['all', ...CATS] as const).map(c => (
          <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`filter-btn ${cat === c ? 'active' : ''}`}>
            {c === 'all' ? tc('all') : tc(`book.${c}`)}
          </button>
        ))}
      </div>

      {list.length === 0 ? <StateMessage kind="empty" message={ts('emptyBooksCategory')} /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.4rem' }}>
          {list.map(b => {
            const title = pick(b, 'title', locale);
            const alt = pickAlt(b, 'title', locale);
            const author = pick(b, 'author', locale);
            const lang = tc.has(`language.${b.language}`) ? tc(`language.${b.language}`) : b.language;
            return (
              <article key={b.id} className="card-lift" style={{ display:'flex', flexDirection:'column' }}>
                <div className="card-media" style={{ height:'190px' }}>
                  {b.cover_image_url
                    ? <Image src={b.cover_image_url} alt={title} fill sizes="(max-width:900px) 50vw, 25vw" style={{ objectFit:'cover' }} />
                    : <span aria-hidden="true">{BOOK_ICON[b.category ?? ''] ?? '📖'}</span>}
                  <span style={{ position:'absolute', top:'.7rem', right:'.7rem', background:LANG_BG[b.language] ?? 'var(--maroon-800)', color:'var(--gold-300)', fontFamily:'var(--ff-heading)', fontSize:'.58rem', letterSpacing:'.1em', padding:'2px 7px' }}>{lang}</span>
                </div>
                <div style={{ padding:'1rem', flex:1 }}>
                  <h3 style={{ fontFamily:'var(--ff-heading)', fontSize:'.82rem', fontWeight:700, color:'var(--maroon-800)', lineHeight:1.3, marginBottom:'2px' }}>{title}</h3>
                  {alt && <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.75rem', color:'var(--text-light)', display:'block', marginBottom:'.4rem' }}>{alt}</span>}
                  {author && <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.8rem', color:'var(--text-light)', display:'block' }}>{author}</span>}
                  {b.total_pages != null && <span style={{ fontSize:'.75rem', color:'var(--text-light)' }}>{t('pages', { n: format.number(b.total_pages) })}</span>}
                </div>
                <div style={{ padding:'.8rem 1rem', borderTop:'1px solid var(--ivory-300)', display:'flex', gap:'.5rem' }}>
                  {b.pdf_url ? (
                    <>
                      <a href={b.pdf_url} target="_blank" rel="noopener noreferrer" style={{ ...btn, background:'var(--gold-500)', color:'var(--maroon-950)' }}>{t('read')}</a>
                      <a href={downloadUrl(b.pdf_url)} style={{ ...btn, border:'1px solid var(--ivory-300)', background:'var(--ivory-200)', color:'var(--text-mid)' }}>{t('download')}</a>
                    </>
                  ) : (
                    <span style={{ ...btn, background:'var(--ivory-200)', color:'var(--text-light)', fontStyle:'italic', letterSpacing:'.06em', textTransform:'none', fontFamily:'var(--ff-meta)', fontWeight:400, fontSize:'.8rem' }}>{t('comingSoon')}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
