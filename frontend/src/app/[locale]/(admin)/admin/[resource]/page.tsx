/**
 * /[locale]/admin/<resource> — list of every row (including hidden ones) of
 * one resource from lib/admin/resources.ts, with create/edit/delete.
 */
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import ResourceTable from '@/components/admin/ResourceTable';
import { adminFetch } from '@/lib/admin/api';
import { resourceBySlug } from '@/lib/admin/resources';

interface Props {
  params: Promise<{ locale: string; resource: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ResourceListPage({ params, searchParams }: Props) {
  const [{ locale, resource }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const res = resourceBySlug(resource);
  if (!res) notFound();

  const [t, result] = await Promise.all([
    getTranslations('admin'),
    adminFetch<Record<string, unknown>[]>(`${res.endpoint}/?all=true&limit=500`),
  ]);
  const flash = sp.saved ? 'saved' : sp.deleted ? (res.softDelete ? 'hidden_done' : 'deleted') : sp.failed ? 'failed' : null;

  return (
    <section>
      <div className="adm-page-head">
        <h1>{t(`nav.${res.slug}`)}</h1>
        <Link href={`/admin/${res.slug}/new`} className="adm-btn adm-btn-primary">{t('list.new')}</Link>
      </div>
      {flash && <p className={`adm-alert ${flash === 'failed' ? 'error' : 'success'}`} role="status">{t(`list.${flash}`)}</p>}
      {result.ok
        ? <ResourceTable res={res} rows={result.data as (Record<string, unknown> & { id: string })[]} />
        : <p className="adm-alert error" role="alert">{t('list.loadError')}</p>}
    </section>
  );
}
