'use client';
/**
 * Generic admin list for any resource in lib/admin/resources.ts:
 * quick text filter, formatted columns, visibility badge, edit + delete/hide.
 */
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { deleteResource } from '@/lib/admin/actions';
import { formatterFor } from '@/lib/format';
import type { ResourceDef } from '@/lib/admin/resources';
import ConfirmSubmit from './ConfirmSubmit';

type Row = Record<string, unknown> & { id: string };

export default function ResourceTable({ res, rows }: { res: ResourceDef; rows: Row[] }) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const format = formatterFor(locale);
  const [q, setQ] = useState('');

  const title = (r: Row) => String((locale === 'ne' && res.titleFieldNe && r[res.titleFieldNe]) || r[res.titleField] || '') || t('list.untitled');
  const alt = (r: Row) => {
    const other = locale === 'ne' ? r[res.titleField] : res.titleFieldNe ? r[res.titleFieldNe] : '';
    return other && other !== title(r) ? String(other) : '';
  };
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(s)) : rows;
  }, [q, rows]);

  const cell = (name: string, v: unknown) => {
    if (v === null || v === undefined || v === '') return <span className="adm-muted">—</span>;
    if (typeof v === 'boolean') return v ? '✓' : <span className="adm-muted">—</span>;
    const field = res.fields.find(f => f.name === name);
    if (field?.type === 'date') return format.date(String(v), 'long');
    if (field?.type === 'select' && t.has(`options.${name}.${v}`)) return t(`options.${name}.${v}`);
    if (typeof v === 'number') return format.number(v);
    return String(v);
  };

  return (
    <>
      <div className="adm-toolbar">
        <input type="search" className="adm-input adm-search" placeholder={t('list.search')} value={q} onChange={e => setQ(e.target.value)} aria-label={t('list.search')} />
        <span className="adm-muted">{t('list.count', { n: filtered.length, count: format.number(filtered.length) })}</span>
      </div>
      {filtered.length === 0 ? (
        <p className="adm-empty">{t('list.empty')}</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>{t(`fields.${res.titleField}`)}</th>
                {res.listColumns.map(c => <th key={c}>{t(`fields.${c}`)}</th>)}
                {res.visibleField && <th>{t(`fields.${res.visibleField}`)}</th>}
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const visible = res.visibleField ? Boolean(r[res.visibleField]) : true;
                return (
                  <tr key={r.id} className={visible ? '' : 'adm-row-hidden'}>
                    <td data-label={t(`fields.${res.titleField}`)}>
                      <Link href={`/admin/${res.slug}/${r.id}`} className="adm-row-title">{title(r)}</Link>
                      {alt(r) && <span className="adm-row-alt">{alt(r)}</span>}
                    </td>
                    {res.listColumns.map(c => <td key={c} data-label={t(`fields.${c}`)}>{cell(c, r[c])}</td>)}
                    {res.visibleField && (
                      <td data-label={t(`fields.${res.visibleField}`)}>
                        <span className={`adm-badge ${visible ? 'ok' : 'off'}`}>{visible ? t('list.visible') : t('list.hidden')}</span>
                      </td>
                    )}
                    <td className="adm-actions">
                      <Link href={`/admin/${res.slug}/${r.id}`} className="adm-btn adm-btn-ghost">{t('list.edit')}</Link>
                      {(!res.softDelete || visible) && (
                        <form action={deleteResource.bind(null, res.slug, r.id)}>
                          <input type="hidden" name="_locale" value={locale} />
                          <ConfirmSubmit className="adm-btn adm-btn-danger"
                            message={t(res.softDelete ? 'list.confirmHide' : 'list.confirmDelete', { title: title(r) })}>
                            {res.softDelete ? t('list.hide') : t('list.delete')}
                          </ConfirmSubmit>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
