import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageHero     from '@/components/ui/PageHero';
import StateMessage from '@/components/ui/StateMessage';
import BhajanPlayer from '@/components/bhajans/BhajanPlayer';
import { getBhajans } from '@/lib/api';

/** /bhajans — devotional audio from GET /api/v1/bhajans. */
export default async function BhajansPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [bhajans, t] = await Promise.all([getBhajans(), getTranslations('state')]);

  return (
    <>
      <PageHero page="bhajans" />
      <div className="page-section">
        <div className="page-inner">
          {bhajans.error
            ? <StateMessage kind="error" message={t('error')} hint={t('errorHint')} />
            : <BhajanPlayer bhajans={bhajans.data} />}
        </div>
      </div>
    </>
  );
}
