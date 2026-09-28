/**
 * /[locale]/admin/<resource>/<id>  — edit an existing row
 * /[locale]/admin/<resource>/new   — create a new row
 * Both render the generic ResourceForm from the resource definition.
 */
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import ResourceForm, { type EventOption } from '@/components/admin/ResourceForm';
import { adminFetch } from '@/lib/admin/api';
import { resourceBySlug } from '@/lib/admin/resources';

interface Props { params: Promise<{ locale: string; resource: string; id: string }> }

export default async function ResourceEditPage({ params }: Props) {
  const { locale, resource, id } = await params;
  setRequestLocale(locale);
  const res = resourceBySlug(resource);
  if (!res) notFound();
  const isNew = id === 'new';

  const needsEvents = res.fields.some(f => f.type === 'eventRef');
  const [t, rowResult, eventsResult] = await Promise.all([
    getTranslations('admin'),
    isNew ? Promise.resolve(null) : adminFetch<Record<string, unknown>>(`${res.endpoint}/${id}`),
    needsEvents ? adminFetch<{ id: string; title_en: string; title_ne: string | null; event_date: string }[]>('/events/?all=true&limit=500') : Promise.resolve(null),
  ]);
  if (rowResult && !rowResult.ok) notFound();
  const row = rowResult && rowResult.ok ? rowResult.data : null;

  const events: EventOption[] = eventsResult && eventsResult.ok
    ? eventsResult.data.map(e => ({ id: e.id, label: `${e.event_date} · ${(locale === 'ne' && e.title_ne) || e.title_en}` }))
    : [];
  const item = t(`items.${res.slug}`);

  return (
    <section>
      <Link href={`/admin/${res.slug}`} className="adm-back">{t('form.back')}</Link>
      <div className="adm-page-head">
        <h1>{isNew ? t('form.newTitle', { item }) : t('form.editTitle', { item })}</h1>
      </div>
      <ResourceForm res={res} row={row} events={events} />
    </section>
  );
}
