"use client";
/**
 * Photo gallery: category filter + tile grid + lightbox.
 * Data comes from GET /api/v1/gallery (fetched on the server by gallery/page.tsx).
 *
 * Lightbox uses the native <dialog> element (showModal), which gives focus
 * trapping, Esc-to-close and an inert page behind it for free. On top of that:
 * ← / → keys, swipe on touch screens, click-outside-to-close, neighbouring
 * photos preloaded, page scroll locked, and a shareable #photo-<id> URL.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import StateMessage from '@/components/ui/StateMessage';
import { formatterFor } from '@/lib/format';
import { pick } from '@/lib/localize';
import type { GalleryCategory, GalleryPhoto } from '@/lib/types';

const ORDER: GalleryCategory[] = ['temple', 'deity', 'festival', 'pooja', 'community', 'history', 'other'];
const HASH = 'photo-';

export default function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const t = useTranslations('gallery');
  const tc = useTranslations('categories');
  const locale = useLocale();
  const format = formatterFor(locale);

  const [cat, setCat] = useState<GalleryCategory | 'all'>('all');
  const [open, setOpen] = useState<number | null>(null);   // index into `list`
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);

  const list = cat === 'all' ? photos : photos.filter(p => p.category === cat);
  const cats = ORDER.filter(c => photos.some(p => p.category === c));
  const caption = (p: GalleryPhoto) => pick(p, 'caption', locale) || t('untitled');

  const show = useCallback((i: number | null) => {
    setOpen(i);
    const url = i === null ? window.location.pathname + window.location.search : `#${HASH}${list[i].id}`;
    window.history.replaceState(null, '', url);
  }, [list]);

  const step = useCallback((by: number) => {
    setOpen(i => {
      if (i === null || list.length === 0) return i;
      const n = (i + by + list.length) % list.length;
      window.history.replaceState(null, '', `#${HASH}${list[n].id}`);
      return n;
    });
  }, [list]);

  // Open/close the native dialog in sync with state; lock page scroll while open.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
    document.documentElement.style.overflow = open !== null ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [open]);

  // Deep link: /gallery#photo-<id> opens that photo — on load and when the hash changes.
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.startsWith(`#${HASH}`) ? window.location.hash.slice(HASH.length + 1) : '';
      const i = id ? photos.findIndex(p => p.id === id) : -1;
      if (i >= 0) { setCat('all'); setOpen(i); }
    };
    const frame = requestAnimationFrame(openFromHash);
    window.addEventListener('hashchange', openFromHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', openFromHash); };
  }, [photos]);

  if (photos.length === 0) return <StateMessage kind="empty" message={t('empty')} />;

  const current = open !== null ? list[open] : null;
  const neighbours = open !== null && list.length > 1
    ? [list[(open - 1 + list.length) % list.length], list[(open + 1) % list.length]]
    : [];

  return (
    <>
      {cats.length > 1 && (
        <div className="gallery-toolbar" role="toolbar">
          {(['all', ...cats] as const).map(c => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`filter-btn ${cat === c ? 'active' : ''}`}>
              {c === 'all' ? tc('all') : tc(`gallery.${c}`)}
            </button>
          ))}
          <span className="gallery-count">{t('photoCount', { n: list.length, count: format.number(list.length) })}</span>
        </div>
      )}

      {list.length === 0 ? <StateMessage kind="empty" message={t('emptyCategory')} /> : (
        <ul className="gallery-grid">
          {list.map((p, i) => (
            <li key={p.id}>
              <button className="gallery-tile" onClick={() => show(i)} aria-label={t('open', { caption: caption(p) })}>
                <Image src={p.image_url} alt={caption(p)} fill sizes="(max-width:600px) 50vw, (max-width:1000px) 33vw, 25vw"
                  style={{ objectFit:'cover', objectPosition:'center 30%' }} />
                <span className="gallery-tile-caption">
                  <span className="gallery-tile-cat">{tc(`gallery.${p.category}`)}</span>
                  {pick(p, 'caption', locale)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={current ? caption(current) : undefined}
        onClose={() => { if (open !== null) show(null); }}
        onClick={e => { if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.backdrop) show(null); }}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
        }}
        onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        }}
      >
        {current && (
          <div className="lightbox-inner" data-backdrop="1">
            <div className="lightbox-top">
              <span className="lightbox-counter">{t('counter', { i: format.number(open! + 1), n: format.number(list.length) })}</span>
              <button className="lightbox-btn" onClick={() => show(null)} aria-label={t('close')} autoFocus>✕</button>
            </div>

            <div className="lightbox-stage" data-backdrop="1">
              {list.length > 1 && <button className="lightbox-btn lightbox-prev" onClick={() => step(-1)} aria-label={t('prev')}>‹</button>}
              <figure className="lightbox-figure" key={current.id}>
                <div className="lightbox-img">
                  <Image src={current.image_url} alt={caption(current)} fill sizes="100vw" priority style={{ objectFit:'contain' }} />
                </div>
                <figcaption>
                  <span className="lightbox-cat">{tc(`gallery.${current.category}`)}{current.taken_on ? ` · ${format.date(current.taken_on, 'long')}` : ''}</span>
                  <span className={`lightbox-caption${locale === 'ne' ? ' deva' : ''}`}>{caption(current)}</span>
                  {current.event && <span className="lightbox-event">{t('fromEvent', { event: pick(current.event, 'title', locale) })}</span>}
                </figcaption>
              </figure>
              {list.length > 1 && <button className="lightbox-btn lightbox-next" onClick={() => step(1)} aria-label={t('next')}>›</button>}
            </div>

            <p className="lightbox-hint">{t('keyboardHint')}</p>

            {/* Preload neighbours so ← / → feel instant. */}
            <div aria-hidden="true" style={{ position:'absolute', width:1, height:1, overflow:'hidden', opacity:0, pointerEvents:'none' }}>
              {neighbours.map(p => <Image key={p.id} src={p.image_url} alt="" width={1200} height={900} sizes="100vw" loading="eager" />)}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
