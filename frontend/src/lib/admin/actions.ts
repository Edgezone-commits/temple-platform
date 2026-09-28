'use server';
/**
 * Server Actions behind the admin screens: generic create/update/delete for
 * every resource in lib/admin/resources.ts, plus the bookings inbox.
 * After each write the public pages' cache tag is expired (updateTag) so the
 * change shows on the website immediately.
 */
import { redirect } from 'next/navigation';
import { revalidatePath, updateTag } from 'next/cache';
import { adminFetch, requireAdmin } from './api';
import { resourceBySlug, type FieldDef } from './resources';

export interface FormState {
  /** field name → translation key or raw validation message */
  errors?: Record<string, string>;
  /** form-level error: admin.errors.<key> */
  error?: 'forbidden' | 'network' | 'generic' | 'notFound';
}

const LOCALES = ['en', 'ne'];
const localeOf = (fd: FormData) => (LOCALES.includes(String(fd.get('_locale'))) ? String(fd.get('_locale')) : 'en');

/** Turn submitted form values into the JSON body FastAPI expects. */
function buildPayload(fields: FieldDef[], fd: FormData, isCreate: boolean) {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.createOnly && !isCreate) continue;
    if (f.type === 'bool') { body[f.name] = fd.get(f.name) === 'on'; continue; }
    const raw = String(fd.get(f.name) ?? '').trim();
    if (f.type === 'number') {
      if (raw === '') { if (!isCreate) body[f.name] = null; continue; }
      const n = Number(raw);
      body[f.name] = Number.isFinite(n) ? n : raw;       // non-numbers → backend 422
    } else if (raw === '') {
      // Required fields send '' so the backend reports "required" instead of nulling the column.
      if (f.required) body[f.name] = '';
      else if (!isCreate) body[f.name] = null;          // cleared optional field
    } else {
      body[f.name] = raw;
    }
    if (f.pathField) {
      const p = String(fd.get(f.pathField) ?? '').trim();
      if (p) body[f.pathField] = p; else if (!isCreate) body[f.pathField] = null;
    }
  }
  return body;
}

/** FastAPI 422 detail → { field: message } */
function fieldErrors(detail: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(detail)) {
    for (const d of detail as { loc?: unknown[]; msg?: string; type?: string }[]) {
      const field = String(d.loc?.[d.loc.length - 1] ?? '_form');
      out[field] = d.type === 'missing' || d.type === 'string_too_short' ? 'required' : (d.msg ?? 'invalid');
    }
  } else if (typeof detail === 'string') {
    out._form = detail;
  }
  return out;
}

export async function saveResource(slug: string, id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const locale = localeOf(fd);
  await requireAdmin(locale);
  const res = resourceBySlug(slug);
  if (!res) return { error: 'notFound' };

  const body = buildPayload(res.fields, fd, id === null);
  const result = await adminFetch(id ? `${res.endpoint}/${id}` : `${res.endpoint}/`, { method: id ? 'PATCH' : 'POST', body });
  if (!result.ok) {
    // (explicit: the project compiles without strictNullChecks, so no union narrowing)
    const { status, detail } = result as { ok: false; status: number; detail?: unknown };
    if (status === 422) return { errors: fieldErrors(detail) };
    if (status === 401 || status === 403) return { error: 'forbidden' };
    if (status === 0) return { error: 'network' };
    if (status === 404) return { error: 'notFound' };
    return { error: 'generic' };
  }
  updateTag(res.tag);
  redirect(`/${locale}/admin/${slug}?saved=1`);
}

export async function deleteResource(slug: string, id: string, fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  await requireAdmin(locale);
  const res = resourceBySlug(slug);
  if (!res) redirect(`/${locale}/admin`);
  const result = await adminFetch(`${res.endpoint}/${id}`, { method: 'DELETE' });
  if (result.ok) updateTag(res.tag);
  redirect(`/${locale}/admin/${slug}?${result.ok ? 'deleted=1' : 'failed=1'}`);
}

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

export async function updateBooking(id: string, fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  await requireAdmin(locale);
  const body: Record<string, unknown> = { admin_notes: String(fd.get('admin_notes') ?? '').trim() || null };
  const status = String(fd.get('status') ?? '');
  if (STATUSES.includes(status)) body.status = status;
  await adminFetch(`/bookings/${id}`, { method: 'PATCH', body });
  revalidatePath(`/${locale}/admin/bookings`);
  revalidatePath(`/${locale}/admin`);
}
