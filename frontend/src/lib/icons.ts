/**
 * Emoji placeholders shown in the coloured media area of a card when the
 * row has no uploaded image yet. Plain module (not "use client") so both
 * Server and Client Components can import it.
 */
import type { EventCategory } from './types';

export const EVENT_ICON: Record<EventCategory, string> = {
  festival: '🎊', ekadashi: '🪷', purnima: '🌙', special_pooja: '🔥', other: '🙏',
};

export const BOOK_ICON: Record<string, string> = {
  scripture: '📖', stotra: '🕉️', philosophy: '✨', biography: '📜',
};

export const POOJA_ICONS = ['🪔', '💧', '🔥', '🌺', '⭐', '📿', '🌸', '🕉️', '🪷'];
