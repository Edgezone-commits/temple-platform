/**
 * Admin resource registry — one entry per editable table.
 *
 * The generic admin list (components/admin/ResourceTable), form
 * (components/admin/ResourceForm) and Server Actions (lib/admin/actions.ts)
 * are all driven by these definitions, so adding a column means editing one
 * array here (plus its label in messages → admin.fields).
 *
 * Plain data only (no functions) so it can be passed to Client Components.
 * Field `name`s match the FastAPI schemas / Supabase columns exactly.
 */

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'date' | 'time' | 'bool' | 'select' | 'url'
  | 'image'        // uploads to Supabase Storage (bucket), stores the public URL
  | 'file'         // same, for PDFs / audio
  | 'eventRef';    // select one of the events (gallery → event)

export type Bucket = 'gallery' | 'book-pdfs' | 'bhajan-audio' | 'site-media';

export interface FieldDef {
  name: string;
  type: FieldType;
  required?: boolean;
  /** select options; labels come from messages admin.options.<name>.<value> */
  options?: string[];
  bucket?: Bucket;
  accept?: string;
  /** also store the Storage object path in this field (for later deletion) */
  pathField?: string;
  default?: string | number | boolean;
  /** only settable when creating (e.g. temple_info.key) */
  createOnly?: boolean;
  /** layout hint: span both columns */
  wide?: boolean;
  /** Devanagari input (lang="ne") */
  ne?: boolean;
  min?: number;
}

export interface ResourceDef {
  slug: string;              // URL: /admin/<slug>
  endpoint: string;          // FastAPI path under /api/v1
  tag: string;               // cache tag of the public pages (lib/api.ts)
  titleField: string;        // shown in lists / headings (English column)
  titleFieldNe?: string;
  visibleField?: string;     // boolean column controlling public visibility
  softDelete?: boolean;      // backend DELETE only hides the row
  listColumns: string[];     // extra columns in the table (besides title + visibility)
  orderHint?: string;        // i18n key under admin.orderHints
  fields: FieldDef[];
}

const bilingual = (base: string, type: FieldType = 'text', required = false, wide = false): FieldDef[] => [
  { name: `${base}_en`, type, required, wide },
  { name: `${base}_ne`, type, wide, ne: true },
];

export const RESOURCES: ResourceDef[] = [
  {
    slug: 'events', endpoint: '/events', tag: 'events', titleField: 'title_en', titleFieldNe: 'title_ne',
    visibleField: 'is_active', softDelete: true, listColumns: ['event_date', 'category'],
    fields: [
      ...bilingual('title', 'text', true),
      { name: 'event_date', type: 'date', required: true },
      { name: 'category', type: 'select', options: ['festival', 'ekadashi', 'purnima', 'special_pooja', 'other'], default: 'festival' },
      { name: 'start_time', type: 'time' }, { name: 'end_time', type: 'time' },
      ...bilingual('location'),
      ...bilingual('description', 'textarea', false, true),
      { name: 'image_url', type: 'image', bucket: 'site-media', wide: true },
      { name: 'is_featured', type: 'bool', default: false },
      { name: 'is_active', type: 'bool', default: true },
    ],
  },
  {
    slug: 'poojas', endpoint: '/poojas', tag: 'poojas', titleField: 'name_en', titleFieldNe: 'name_ne',
    visibleField: 'is_available', softDelete: true, listColumns: ['price', 'duration_minutes', 'sort_order'],
    fields: [
      ...bilingual('name', 'text', true),
      { name: 'price', type: 'number', min: 0 }, { name: 'currency', type: 'text', default: 'NPR' },
      { name: 'duration_minutes', type: 'number', min: 1 }, { name: 'sort_order', type: 'number', default: 0 },
      ...bilingual('description', 'textarea', false, true),
      { name: 'image_url', type: 'image', bucket: 'site-media', wide: true },
      { name: 'is_popular', type: 'bool', default: false },
      { name: 'is_available', type: 'bool', default: true },
    ],
  },
  {
    slug: 'archanas', endpoint: '/archanas', tag: 'archanas', titleField: 'name_en', titleFieldNe: 'name_ne',
    visibleField: 'is_available', softDelete: true, listColumns: ['price', 'sort_order'],
    fields: [
      ...bilingual('name', 'text', true), ...bilingual('deity'),
      { name: 'price', type: 'number', min: 0 }, { name: 'currency', type: 'text', default: 'NPR' },
      { name: 'sort_order', type: 'number', default: 0 },
      ...bilingual('description', 'textarea', false, true),
      { name: 'is_available', type: 'bool', default: true },
    ],
  },
  {
    slug: 'calendar', endpoint: '/calendar', tag: 'calendar', titleField: 'title_en', titleFieldNe: 'title_ne',
    visibleField: 'is_published', listColumns: ['event_date', 'category'],
    fields: [
      ...bilingual('title', 'text', true),
      { name: 'event_date', type: 'date', required: true }, { name: 'end_date', type: 'date' },
      { name: 'category', type: 'select', options: ['festival', 'ekadashi', 'purnima', 'amavasya', 'sankranti', 'special_pooja', 'other'], default: 'festival' },
      { name: 'event_id', type: 'eventRef' },
      ...bilingual('tithi'), ...bilingual('bs_date'),
      ...bilingual('description', 'textarea', false, true),
      { name: 'is_major', type: 'bool', default: false },
      { name: 'is_published', type: 'bool', default: true },
    ],
  },
  {
    slug: 'books', endpoint: '/books', tag: 'books', titleField: 'title_en', titleFieldNe: 'title_ne',
    visibleField: 'is_published', softDelete: true, listColumns: ['category', 'language', 'sort_order'],
    fields: [
      ...bilingual('title', 'text', true), ...bilingual('author'),
      { name: 'category', type: 'select', options: ['scripture', 'stotra', 'philosophy', 'biography'] },
      { name: 'language', type: 'select', options: ['sa', 'ne', 'en'], default: 'sa' },
      { name: 'total_pages', type: 'number', min: 1 }, { name: 'sort_order', type: 'number', default: 0 },
      ...bilingual('description', 'textarea', false, true),
      { name: 'pdf_url', type: 'file', bucket: 'book-pdfs', accept: 'application/pdf', wide: true },
      { name: 'cover_image_url', type: 'image', bucket: 'site-media', wide: true },
      { name: 'is_published', type: 'bool', default: true },
    ],
  },
  {
    slug: 'bhajans', endpoint: '/bhajans', tag: 'bhajans', titleField: 'title_en', titleFieldNe: 'title_ne',
    visibleField: 'is_published', softDelete: true, listColumns: ['category', 'duration_seconds', 'sort_order'],
    fields: [
      ...bilingual('title', 'text', true), ...bilingual('artist'),
      { name: 'category', type: 'select', options: ['suprabhatam', 'stotra', 'bhajan', 'vedic', 'ashtapadi', 'mangalashtak'] },
      { name: 'deity', type: 'text' }, { name: 'raaga', type: 'text' },
      { name: 'duration_seconds', type: 'number', min: 1 }, { name: 'sort_order', type: 'number', default: 0 },
      { name: 'audio_url', type: 'file', bucket: 'bhajan-audio', accept: 'audio/*', wide: true },
      ...bilingual('lyrics', 'textarea', false, true),
      { name: 'is_published', type: 'bool', default: true },
    ],
  },
  {
    slug: 'gallery', endpoint: '/gallery', tag: 'gallery', titleField: 'caption_en', titleFieldNe: 'caption_ne',
    visibleField: 'is_published', listColumns: ['category', 'sort_order'],
    fields: [
      { name: 'image_url', type: 'image', bucket: 'gallery', required: true, pathField: 'storage_path', wide: true },
      ...bilingual('caption'),
      { name: 'category', type: 'select', options: ['temple', 'deity', 'festival', 'pooja', 'community', 'history', 'other'], default: 'temple' },
      { name: 'event_id', type: 'eventRef' },
      { name: 'taken_on', type: 'date' }, { name: 'sort_order', type: 'number', default: 0 },
      { name: 'is_published', type: 'bool', default: true },
    ],
  },
  {
    slug: 'leadership', endpoint: '/leadership', tag: 'leadership', titleField: 'name_en', titleFieldNe: 'name_ne',
    visibleField: 'is_published', listColumns: ['is_founder', 'years_active', 'sort_order'],
    orderHint: 'leadership',
    fields: [
      ...bilingual('name', 'text', true), ...bilingual('role'),
      { name: 'years_active', type: 'text' }, { name: 'sort_order', type: 'number', default: 0 },
      ...bilingual('bio', 'textarea', false, true),
      { name: 'photo_url', type: 'image', bucket: 'site-media', wide: true },
      { name: 'video_url', type: 'url', wide: true },
      { name: 'is_founder', type: 'bool', default: false },
      { name: 'is_published', type: 'bool', default: true },
    ],
  },
  {
    slug: 'temple-info', endpoint: '/temple-info', tag: 'temple-info', titleField: 'key', listColumns: ['category', 'sort_order'],
    orderHint: 'templeInfo',
    fields: [
      { name: 'key', type: 'text', required: true, createOnly: true },
      { name: 'category', type: 'select', options: ['timings', 'contact', 'history', 'rituals', 'general'], default: 'general' },
      { name: 'sort_order', type: 'number', default: 0 },
      ...bilingual('value', 'textarea', false, true),
    ],
  },
];

export const resourceBySlug = (slug: string) => RESOURCES.find(r => r.slug === slug);
