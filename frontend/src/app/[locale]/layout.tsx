import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import {
  Cinzel_Decorative, Cinzel, Crimson_Text,
  Noto_Sans_Devanagari, EB_Garamond,
} from 'next/font/google';

const cinzelDec  = Cinzel_Decorative({ subsets:['latin'], weight:['400','700','900'], variable:'--font-cinzel-decorative', display:'swap' });
const cinzel     = Cinzel({ subsets:['latin'], weight:['400','500','600','700'], variable:'--font-cinzel', display:'swap' });
const crimson    = Crimson_Text({ subsets:['latin'], weight:['400','600'], style:['normal','italic'], variable:'--font-crimson', display:'swap' });
const devanagari = Noto_Sans_Devanagari({ subsets:['devanagari'], weight:['300','400','500','600','700'], variable:'--font-devanagari', display:'swap' });
const garamond   = EB_Garamond({ subsets:['latin'], weight:['400','500'], style:['normal','italic'], variable:'--font-garamond', display:'swap' });

const fontVars = [cinzelDec.variable, cinzel.variable, crimson.variable, devanagari.variable, garamond.variable].join(' ');

const locales = ['en', 'ne'];

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale)) notFound();

  // Tell next-intl the locale from the URL. Without this it relies on a header
  // from the proxy that doesn't reach Server Components, and every page fell
  // back to English (/ne rendered English text).
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className={fontVars}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Kathmandu">
          {/* Site chrome lives in (site)/layout.tsx; (auth) pages have none. */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}