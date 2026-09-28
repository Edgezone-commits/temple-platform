'use client';
/**
 * Generic create/edit form for any resource in lib/admin/resources.ts.
 * Posts to the saveResource Server Action; backend validation errors are
 * shown next to the matching field.
 */
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { saveResource, type FormState } from '@/lib/admin/actions';
import type { FieldDef, ResourceDef } from '@/lib/admin/resources';
import UploadField from './UploadField';

type Row = Record<string, unknown>;
export interface EventOption { id: string; label: string }

function Save() {
  const { pending } = useFormStatus();
  const t = useTranslations('admin.form');
  return <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>{pending ? t('saving') : t('save')}</button>;
}

export default function ResourceForm({ res, row, events }: { res: ResourceDef; row: Row | null; events: EventOption[] }) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const id = row ? String(row.id) : null;
  const [state, action] = useActionState(saveResource.bind(null, res.slug, id), {} as FormState);

  const value = (f: FieldDef): string => {
    const v = row ? row[f.name] : f.default;
    if (v === null || v === undefined) return '';
    if (f.type === 'time') return String(v).slice(0, 5);            // HH:MM:SS → HH:MM
    return String(v);
  };
  const errorFor = (f: FieldDef) => {
    const e = state.errors?.[f.name];
    if (!e) return undefined;
    return e === 'required' ? t('errors.required') : `${t('form.fieldError')}: ${e}`;
  };

  const renderField = (f: FieldDef) => {
    const label = t(`fields.${f.name}`);
    const err = errorFor(f);
    const common = {
      id: `f-${f.name}`, name: f.name, required: f.required,
      lang: f.ne ? 'ne' : undefined, 'aria-invalid': err ? true : undefined,
    };
    const cls = `adm-field${f.wide ? ' wide' : ''}${f.ne ? ' ne' : ''}${err ? ' has-error' : ''}`;

    if (f.type === 'image' || f.type === 'file') {
      return (
        <div key={f.name} className={`adm-field-wrap${f.wide ? ' wide' : ''}`}>
          <UploadField name={f.name} label={label} bucket={f.bucket!} accept={f.accept} kind={f.type} required={f.required}
            defaultUrl={value(f)} pathName={f.pathField}
            defaultPath={f.pathField && row ? String(row[f.pathField] ?? '') : ''} error={err} />
        </div>
      );
    }
    if (f.type === 'bool') {
      return (
        <label key={f.name} className="adm-switch">
          <input type="checkbox" name={f.name} defaultChecked={row ? Boolean(row[f.name]) : Boolean(f.default)} />
          <span className="adm-switch-ui" aria-hidden="true" />
          {label}
        </label>
      );
    }

    let control: React.ReactNode;
    if (f.type === 'textarea') {
      control = <textarea {...common} className="adm-input" rows={5} defaultValue={value(f)} />;
    } else if (f.type === 'select') {
      control = (
        <select {...common} className="adm-input" defaultValue={value(f)}>
          {!f.required && <option value="">—</option>}
          {f.options!.map(o => (
            <option key={o} value={o}>{t.has(`options.${f.name}.${o}`) ? t(`options.${f.name}.${o}`) : o}</option>
          ))}
        </select>
      );
    } else if (f.type === 'eventRef') {
      control = (
        <select {...common} className="adm-input" defaultValue={value(f)}>
          <option value="">{t('form.noEvent')}</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
      );
    } else {
      const type = f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text';
      control = (
        <input {...common} className="adm-input" type={type} defaultValue={value(f)} min={f.min}
          step={f.type === 'number' ? 'any' : undefined} readOnly={f.createOnly && !!row} />
      );
    }
    return (
      <div key={f.name} className={cls}>
        <label htmlFor={`f-${f.name}`} className="adm-label">{label}{f.required && <em> *</em>}</label>
        {control}
        {err && <p className="adm-error" role="alert">{err}</p>}
      </div>
    );
  };

  const bools = res.fields.filter(f => f.type === 'bool');
  const others = res.fields.filter(f => f.type !== 'bool');

  return (
    <form action={action} className="adm-form">
      <input type="hidden" name="_locale" value={locale} />
      {state.error && <p className="adm-alert error" role="alert">{t(`errors.${state.error}`)}</p>}
      {state.errors?._form && <p className="adm-alert error" role="alert">{state.errors._form}</p>}
      {res.orderHint && <p className="adm-hint">{t(`orderHints.${res.orderHint}`)}</p>}
      <div className="adm-grid">{others.map(renderField)}</div>
      {bools.length > 0 && <div className="adm-switches">{bools.map(renderField)}</div>}
      <div className="adm-form-actions">
        <Save />
        <Link href={`/admin/${res.slug}`} className="adm-btn adm-btn-ghost">{t('form.cancel')}</Link>
      </div>
    </form>
  );
}
