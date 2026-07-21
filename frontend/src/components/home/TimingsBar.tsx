import { useTranslations } from 'next-intl';

const ITEMS = [
  { icon:'🌅', lk:'morning',   tk:'morningTime',   nk:'morningNe'   },
  { icon:'☀️', lk:'afternoon', tk:'afternoonTime', nk:'afternoonNe' },
  { icon:'🪔', lk:'evening',   tk:'eveningTime',   nk:'eveningNe'   },
] as const;

export default function TimingsBar() {
  const t = useTranslations('timings');
  return (
    <div className="timings-bar">
      <div style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3,1fr)' }}>
        {ITEMS.map(({ icon, lk, tk, nk }) => (
          <div key={lk} className="timing-item">
            <div style={{ fontSize:'1.6rem', flexShrink:0 }}>{icon}</div>
            <div>
              <span className="timing-label">{t(lk)}</span>
              <span className="timing-time">{t(tk)}</span>
              <span className="timing-ne">{t(nk)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}