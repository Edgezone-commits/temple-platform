import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import {
  Cinzel_Decorative, Cinzel, Crimson_Text,
  Noto_Sans_Devanagari, EB_Garamond,
} from 'next/font/google';
import MarqueeStrip from '@/components/layout/MarqueeStrip';
import Header      from '@/components/layout/Header';
import Navigation  from '@/components/layout/Navigation';
import Footer      from '@/components/layout/Footer';

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

  const messages = await getMessages();

  return (
    <html lang={locale} className={fontVars}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <MarqueeStrip />
          <Header locale={locale as 'en' | 'ne'} />
          <Navigation />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}