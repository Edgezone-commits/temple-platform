'use client';
/**
 * File/image field for the admin forms. Uploads straight from the browser to
 * the resource's public Supabase Storage bucket (Storage RLS allows only
 * admins to write — see database/schema_v2.sql), then stores the public URL
 * in a hidden input. The URL can also be pasted by hand.
 */
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getBrowserClient } from '@/lib/supabase/client';
import type { Bucket } from '@/lib/admin/resources';

interface Props {
  name: string;
  label: string;
  bucket: Bucket;
  accept?: string;
  kind: 'image' | 'file';
  defaultUrl?: string;
  /** hidden input name for the storage object path (e.g. gallery.storage_path) */
  pathName?: string;
  defaultPath?: string;
  required?: boolean;
  error?: string;
}

const safeName = (n: string) => n.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80);

export default function UploadField({ name, label, bucket, accept, kind, defaultUrl = '', pathName, defaultPath = '', required, error }: Props) {
  const t = useTranslations('admin.form');
  const [url, setUrl] = useState(defaultUrl);
  const [path, setPath] = useState(defaultPath);
  const [busy, setBusy] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setFailed(false);
    setBusy(10);
    const objectPath = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID().slice(0, 8)}-${safeName(file.name)}`;
    const storage = getBrowserClient().storage.from(bucket);
    // supabase-js has no upload progress events; show a gentle indeterminate climb.
    const tick = setInterval(() => setBusy(p => (p === null ? p : Math.min(p + 7, 90))), 300);
    const { error: upErr } = await storage.upload(objectPath, file, { contentType: file.type || undefined, upsert: false });
    clearInterval(tick);
    if (upErr) {
      setBusy(null);
      setFailed(true);
      return;
    }
    setUrl(storage.getPublicUrl(objectPath).data.publicUrl);
    setPath(objectPath);
    setBusy(null);
  }

  return (
    <div className={`adm-field adm-upload${error ? ' has-error' : ''}`}>
      <span className="adm-label">{label}{required && <em> *</em>}</span>
      <input type="hidden" name={name} value={url} />
      {pathName && <input type="hidden" name={pathName} value={path} />}
      {url && kind === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL
        <img src={url} alt="" className="adm-upload-preview" />
      )}
      {url && kind === 'file' && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="adm-upload-link">
          📎 {decodeURIComponent(url.split('/').pop() ?? url)}
        </a>
      )}
      <div className="adm-upload-row">
        <input ref={input} type="file" accept={accept ?? (kind === 'image' ? 'image/*' : undefined)} hidden
          data-testid={`upload-${name}`}
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
        <button type="button" className="adm-btn" onClick={() => input.current?.click()} disabled={busy !== null}>
          {busy !== null ? t('uploading', { pct: busy }) : url ? t('replace') : t('upload')}
        </button>
        {url && (
          <button type="button" className="adm-btn adm-btn-ghost" onClick={() => { setUrl(''); setPath(''); }}>
            {t('remove')}
          </button>
        )}
      </div>
      {busy !== null && <div className="adm-progress"><span style={{ width: `${busy}%` }} /></div>}
      <input className="adm-input adm-upload-url" type="text" inputMode="url" placeholder={t('orPaste')} value={url}
        onChange={e => { setUrl(e.target.value); setPath(''); }} aria-label={`${label} URL`} />
      {failed && <p className="adm-error" role="alert">{t('uploadFailed')}</p>}
      {error && <p className="adm-error" role="alert">{error}</p>}
    </div>
  );
}
