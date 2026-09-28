'use client';
/** Admin sidebar navigation; active item highlighted; hamburger toggle on phones. */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { RESOURCES } from '@/lib/admin/resources';

const ICONS: Record<string, string> = {
  events: '🎊', poojas: '🪔', archanas: '🌸', calendar: '📅', books: '📖', bhajans: '🎵',
  gallery: '🖼', leadership: '🙏', 'temple-info': 'ℹ️',
};

export default function AdminNav({ title }: { title: string }) {
  const t = useTranslations('admin.nav');
  const tm = useTranslations('admin');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const item = (href: string, label: string, icon: string) => (
    <Link key={href} href={href} className={`adm-nav-link${active(href) ? ' active' : ''}`}
      aria-current={active(href) ? 'page' : undefined} onClick={() => setOpen(false)}>
      <span aria-hidden="true">{icon}</span>{label}
    </Link>
  );
  return (
    <aside className={`adm-side${open ? ' open' : ''}`}>
      <div className="adm-brand">
        <Link href="/admin" className="adm-brand-link">🕉 {title}</Link>
        <button className="adm-burger" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="adm-nav">
          {open ? '✕' : '☰'} <span className="sr-only">{tm('menu')}</span>
        </button>
      </div>
      <nav id="adm-nav" className="adm-nav">
        {item('/admin', t('dashboard'), '🏠')}
        {item('/admin/bookings', t('bookings'), '📋')}
        <span className="adm-nav-heading">{t('content')}</span>
        {RESOURCES.map(r => item(`/admin/${r.slug}`, t(r.slug), ICONS[r.slug] ?? '•'))}
      </nav>
    </aside>
  );
}
