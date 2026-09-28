/**
 * Shapes of the rows returned by the FastAPI backend (/api/v1/...).
 * Keep in sync with backend/app/schemas/*.py.
 */

export type EventCategory = 'festival' | 'ekadashi' | 'purnima' | 'special_pooja' | 'other';

export interface TempleEvent {
  id: string;
  title_en: string;
  title_ne: string | null;
  description_en: string | null;
  description_ne: string | null;
  event_date: string;          // YYYY-MM-DD
  start_time: string | null;   // HH:MM:SS
  end_time: string | null;
  location_en: string | null;
  location_ne: string | null;
  image_url: string | null;
  category: EventCategory;
  is_featured: boolean;
}

export interface Pooja {
  id: string;
  name_en: string;
  name_ne: string | null;
  description_en: string | null;
  description_ne: string | null;
  duration_minutes: number | null;
  price: number | null;
  currency: string;
  is_popular: boolean;
  image_url: string | null;
}

export interface Archana {
  id: string;
  name_en: string;
  name_ne: string | null;
  description_en: string | null;
  description_ne: string | null;
  deity_en: string | null;
  deity_ne: string | null;
  price: number | null;
  currency: string;
}

export interface Book {
  id: string;
  title_en: string;
  title_ne: string | null;
  author_en: string | null;
  author_ne: string | null;
  description_en: string | null;
  description_ne: string | null;
  pdf_url: string | null;
  cover_image_url: string | null;
  category: string | null;
  language: string;
  total_pages: number | null;
}

export interface Bhajan {
  id: string;
  title_en: string;
  title_ne: string | null;
  artist_en: string | null;
  artist_ne: string | null;
  lyrics_en: string | null;
  lyrics_ne: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  deity: string | null;
  category: string | null;
}

export type CalendarCategory =
  | 'festival' | 'ekadashi' | 'purnima' | 'amavasya' | 'sankranti' | 'special_pooja' | 'other';

export interface CalendarEntry {
  id: string;
  event_date: string;
  end_date: string | null;
  category: CalendarCategory;
  title_en: string;
  title_ne: string | null;
  description_en: string | null;
  description_ne: string | null;
  tithi_en: string | null;
  tithi_ne: string | null;
  bs_date_en: string | null;
  bs_date_ne: string | null;
  is_major: boolean;
  event_id: string | null;
}

export type GalleryCategory = 'temple' | 'deity' | 'festival' | 'pooja' | 'community' | 'history' | 'other';

export interface GalleryPhoto {
  id: string;
  image_url: string;           // Supabase Storage public URL or site path (/images/...)
  caption_en: string | null;
  caption_ne: string | null;
  category: GalleryCategory;
  event_id: string | null;
  taken_on: string | null;
  event: { title_en: string; title_ne: string | null } | null;
}
