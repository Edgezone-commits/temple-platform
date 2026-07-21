import { useTranslations } from 'next-intl';

export default function MarqueeStrip() {
  const t = useTranslations('marquee');
  const items = t.raw('items') as string[];
  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-track">
        {items.map((text, i) => (
          <span key={i} className="marquee-item">
            {text}<span className="marquee-dot">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}