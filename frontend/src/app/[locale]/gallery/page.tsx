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
      <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
          {photos.error
            ? <StateMessage kind="error" message={t('error')} hint={t('errorHint')} />
            : <GalleryGrid photos={photos.data} />}
        </div>
      </div>
    </>
  );
}
