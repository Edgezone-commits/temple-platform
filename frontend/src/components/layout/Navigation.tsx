"use client";
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const navItems = [
  { href:'/',            lk:'home',      sk:'homeNe'      },
  { href:'/events',      lk:'events',    sk:'eventsNe'    },
  { href:'/calendar',    lk:'calendar',  sk:'calendarNe'  },
  { href:'/poojas',      lk:'poojas',    sk:'poojasNe'    },
  { href:'/poojas/book', lk:'bookPooja', sk:'bookPoojaNe' },
  { href:'/books',       lk:'books',     sk:'booksNe'     },
  { href:'/bhajans',     lk:'bhajans',   sk:'bhajansNe'   },
  { href:'/gallery',     lk:'gallery',   sk:'galleryNe'   },
  { href:'/history',     lk:'history',   sk:'historyNe'   },
  { href:'/contact',     lk:'contact',   sk:'contactNe'   },
] as const;

export default function Navigation() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  // Longest matching item wins, so /poojas/book highlights "Book a Pooja" only, not "Poojas" too.
  const active = navItems
    .filter(({ href }) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'))
    .reduce<string | null>((best, { href }) => (!best || href.length > best.length ? href : best), null);
  const isActive = (href: string) => href === active;

  // Phones: the nav scrolls sideways. Keep the current page's tab in view.
  const innerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const inner = innerRef.current;
    const link = inner?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!inner || !link || inner.scrollWidth <= inner.clientWidth) return;
    inner.scrollLeft = link.offsetLeft - (inner.clientWidth - link.offsetWidth) / 2;
  }, [active]);

  return (
    <nav className="main-nav">
      <div className="nav-inner" ref={innerRef}>
        {navItems.map(({ href, lk, sk }) => (
          <Link key={href} href={href} className="nav-link"
            data-active={isActive(href) ? 'true' : 'false'}
            aria-current={isActive(href) ? 'page' : undefined}>
            <span>{t(lk)}</span>
            <span className="nav-sub">{t(sk)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}