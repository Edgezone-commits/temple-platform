"use client";
/**
 * Bhajan collection with a real audio player.
 * Data: GET /api/v1/bhajans (fetched on the server by bhajans/page.tsx).
 * One shared <audio> element plays the selected track's audio_url; tracks
 * without audio are shown but can't be played ("Audio coming soon").
 */
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import StateMessage from '@/components/ui/StateMessage';
import { formatClock, formatNumber } from '@/lib/format';
import { pick, pickAlt } from '@/lib/localize';
import type { Bhajan } from '@/lib/types';

const CATS = ['suprabhatam', 'stotra', 'bhajan', 'vedic', 'ashtapadi', 'mangalashtak'] as const;

const roundBtn = (on: boolean, disabled = false): React.CSSProperties => ({
  width:'36px', height:'36px', borderRadius:'50%', border:'none', flexShrink:0,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .35 : 1,
  background: on ? 'var(--gold-500)' : 'var(--maroon-800)', color: on ? 'var(--maroon-950)' : 'var(--gold-300)',
  display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s',
});

export default function BhajanPlayer({ bhajans }: { bhajans: Bhajan[] }) {
  const t = useTranslations('bhajans');
  const tc = useTranslations('categories');
  const ts = useTranslations('state');
  const locale = useLocale();
  const clock = (secs: number | null | undefined) => formatClock(secs, locale);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [filter, setFilter] = useState<string>('all');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyricsOpen, setLyricsOpen] = useState<string | null>(null);

  const current = bhajans.find(b => b.id === currentId) ?? null;

  // Load a new source whenever the selected track changes, then play it.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current?.audio_url) return;
    a.src = current.audio_url;
    a.play().catch(() => setPlaying(false));
  }, [currentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (bhajans.length === 0) return <StateMessage kind="empty" message={ts('emptyBhajans')} />;

  const cats = CATS.filter(c => bhajans.some(b => b.category === c));
  const list = filter === 'all' ? bhajans : bhajans.filter(b => b.category === filter);

  function toggle(b: Bhajan) {
    if (!b.audio_url) return;
    const a = audioRef.current;
    if (!a) return;
    if (b.id === currentId) {
      if (a.paused) a.play().catch(() => setPlaying(false)); else a.pause();
    } else {
      setTime(0); setDuration(b.duration_seconds ?? 0);
      setCurrentId(b.id);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * duration;
  }

  function seekKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a) return;
    if (e.key === 'ArrowRight') a.currentTime = Math.min(a.currentTime + 10, duration);
    if (e.key === 'ArrowLeft') a.currentTime = Math.max(a.currentTime - 10, 0);
  }

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setTime(0); }}
        onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)} />

      {/* Now-playing bar */}
      {current && (
        <div style={{ background:'var(--maroon-900)', border:'1px solid rgba(201,148,58,.25)', padding:'1.2rem 1.5rem', marginBottom:'2rem', display:'flex', alignItems:'center', gap:'1.2rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'1.8rem', animation: playing ? 'pulse 2s ease-in-out infinite' : undefined }} aria-hidden="true">🎵</span>
          <div style={{ flex:'1 1 200px', minWidth:0 }}>
            <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.6rem', letterSpacing:'.15em', textTransform:'uppercase', color:'rgba(232,201,122,.5)', display:'block' }}>{t('nowPlaying')}</span>
            <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.9rem', color:'var(--gold-100)', display:'block' }}>{pick(current, 'title', locale)}</span>
            <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.75rem', color:'rgba(232,201,122,.5)' }}>{pick(current, 'artist', locale)}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'.7rem', flex:'1 1 220px' }}>
            <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.65rem', color:'rgba(232,201,122,.6)', minWidth:'2.6rem', textAlign:'right' }}>{clock(time)}</span>
            <div role="slider" tabIndex={0} aria-label={pick(current, 'title', locale)} aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(time)}
              onClick={seek} onKeyDown={seekKey}
              style={{ flex:1, height:'6px', background:'rgba(201,148,58,.2)', borderRadius:'3px', overflow:'hidden', cursor:'pointer' }}>
              <div style={{ height:'100%', background:'var(--gold-500)', width:`${pct}%`, transition:'width .2s linear' }} />
            </div>
            <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.65rem', color:'rgba(232,201,122,.6)', minWidth:'2.6rem' }}>{clock(duration)}</span>
          </div>
          <button onClick={() => toggle(current)} style={roundBtn(true)} aria-label={playing ? t('pause') : t('play')}>{playing ? '⏸' : '▶'}</button>
        </div>
      )}

      {/* Category filter (only categories that have bhajans) */}
      {cats.length > 1 && (
        <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap', marginBottom:'2rem' }} role="toolbar">
          {(['all', ...cats] as const).map(c => (
            <button key={c} onClick={() => setFilter(c)} aria-pressed={filter === c} className={`filter-btn ${filter === c ? 'active' : ''}`}>
              {c === 'all' ? tc('all') : tc(`bhajan.${c}`)}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? <StateMessage kind="empty" message={ts('emptyBhajansCategory')} /> : (
        <ol style={{ display:'flex', flexDirection:'column', gap:'.6rem', listStyle:'none' }}>
          {list.map((b, i) => {
            const on = b.id === currentId;
            const lyrics = pick(b, 'lyrics', locale);
            const canPlay = !!b.audio_url;
            return (
              <li key={b.id} className={`bhajan-row${on ? ' on' : ''}`}>
                <div style={{ padding:'1rem 1.4rem', display:'grid', gridTemplateColumns:'3rem 1fr auto', alignItems:'center', gap:'1.2rem' }}>
                  <div style={{ fontFamily:'var(--ff-display)', fontSize:'.9rem', color: on ? 'var(--maroon-600)' : 'var(--gold-700)', textAlign:'center' }}>
                    {on && playing ? '♪' : formatNumber(i + 1, locale, { grouping: false, minDigits: 2 })}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <h3 style={{ fontFamily:'var(--ff-heading)', fontSize:'.85rem', fontWeight:700, color:'var(--maroon-800)', marginBottom:'1px' }}>{pick(b, 'title', locale)}</h3>
                    {pickAlt(b, 'title', locale) && <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.75rem', color:'var(--text-light)', display:'block' }}>{pickAlt(b, 'title', locale)}</span>}
                    {lyrics && (
                      <button onClick={() => setLyricsOpen(lyricsOpen === b.id ? null : b.id)} aria-expanded={lyricsOpen === b.id}
                        style={{ background:'none', border:'none', padding:0, marginTop:'.3rem', cursor:'pointer', fontFamily:'var(--ff-heading)', fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--gold-700)' }}>
                        {lyricsOpen === b.id ? t('hideLyrics') : t('lyrics')}
                      </button>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'1.2rem' }}>
                    <div style={{ textAlign:'right' }}>
                      {pick(b, 'artist', locale) && <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.78rem', color:'var(--text-light)', display:'block' }}>{pick(b, 'artist', locale)}</span>}
                      <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.65rem', color:'var(--text-light)', letterSpacing:'.08em' }}>
                        {canPlay ? clock(b.duration_seconds) : t('audioSoon')}
                      </span>
                    </div>
                    <button onClick={() => toggle(b)} disabled={!canPlay} style={roundBtn(on, !canPlay)}
                      aria-label={`${on && playing ? t('pause') : t('play')}: ${pick(b, 'title', locale)}`}>
                      {on && playing ? '⏸' : '▶'}
                    </button>
                  </div>
                </div>
                {lyricsOpen === b.id && lyrics && (
                  <p style={{ padding:'0 1.4rem 1.2rem 5.6rem', whiteSpace:'pre-line', fontFamily: locale === 'ne' ? 'var(--ff-deva)' : 'var(--ff-body)', color:'var(--text-mid)', lineHeight:1.8, fontSize:'.95rem' }}>{lyrics}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
