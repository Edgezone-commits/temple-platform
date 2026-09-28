/**
 * Public-site chrome: marquee, header (with the visitor's account state),
 * navigation and footer. All public pages live in this route group; the
 * (auth) pages don't, so they render without header/footer.
 */
import MarqueeStrip from '@/components/layout/MarqueeStrip';
import Header      from '@/components/layout/Header';
import Navigation  from '@/components/layout/Navigation';
import Footer      from '@/components/layout/Footer';
import PanditChat  from '@/components/chat/PanditChat';
import { getAccount } from '@/lib/supabase/server';

export default async function SiteLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, account] = await Promise.all([params, getAccount()]);
  return (
    <>
      <MarqueeStrip />
      <Header locale={locale as 'en' | 'ne'} account={account && { name: account.name, isAdmin: account.isAdmin }} />
      <Navigation />
      <main>{children}</main>
      <Footer />
      <PanditChat />
    </>
  );
}
