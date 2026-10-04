import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageHero     from '@/components/ui/PageHero';
import StateMessage from '@/components/ui/StateMessage';
import GalleryGrid  from '@/components/gallery/GalleryGrid';
import { getGallery } from '@/lib/api';

/** /gallery — temple photos from GET /api/v1/gallery (Supabase Storage URLs). */
export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [photos, t] = await Promise.all([getGallery(), getTranslations('state')]);

  return (
    <>
      <PageHero page="gallery" />
      <div className="page-section">
        <div className="page-inner">
          {photos.error
            ? <StateMessage kind="error" message={t('error')} hint={t('errorHint')} />
            : <GalleryGrid photos={photos.data} />}
        </div>
      </div>
    </>
  );
}
