"use client";
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const navItems = [
  { href:'/',            lk:'home',      sk:'homeNe'      },
  { href:'/events',      lk:'events',    sk:'eventsNe'    },
  { href:'/poojas',      lk:'poojas',    sk:'poojasNe'    },
  { href:'/poojas/book', lk:'bookPooja', sk:'bookPoojaNe' },
  { href:'/books',       lk:'books',     sk:'booksNe'     },
  { href:'/bhajans',     lk:'bhajans',   sk:'bhajansNe'   },
  { href:'/contact',     lk:'contact',   sk:'contactNe'   },
] as const;

export default function Navigation() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="main-nav">
      <div className="nav-inner">
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