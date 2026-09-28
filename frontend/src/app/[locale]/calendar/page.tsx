import { setRequestLocale } from 'next-intl/server';
import PageHero      from '@/components/ui/PageHero';
import MonthCalendar from '@/components/calendar/MonthCalendar';
import { getCalendar } from '@/lib/api';
import { todayInNepal } from '@/lib/localize';
import { buildMonth, resolveMonth, type CalendarSystem } from '@/lib/nepaliCalendar';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cal?: string; y?: string; m?: string }>;
}

const one = (v: unknown) => (typeof v === 'string' ? v : undefined);

/**
 * /calendar — month-by-month Nepali/Hindu calendar.
 *   ?cal=bs|ad   calendar system (default: Bikram Sambat)
 *   ?y=&m=       year and 1-based month in that system (default: current month)
 */
export default async function CalendarPage({ params, searchParams }: Props) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const system: CalendarSystem = one(sp.cal) === 'ad' ? 'ad' : 'bs';
  const today = todayInNepal();
  const { y, m } = resolveMonth(system, today, one(sp.y), one(sp.m));
  const view = buildMonth(system, y, m);
  const result = await getCalendar({ start: view.days[0], end: view.days[view.days.length - 1], limit: 500 });

  return (
    <>
      <PageHero page="calendar" />
      <MonthCalendar view={view} today={today} entries={result.data ?? []} error={result.error} />
    </>
  );
}
