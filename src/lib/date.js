import { DAYS } from './constants.js';

const LOCALE = 'es-AR';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Miércoles, 28 de octubre de 2026" */
export function formatLongDate(date) {
  return capitalize(
    new Intl.DateTimeFormat(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date),
  );
}

export function formatDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/** Menu key for the given date ('monday' … 'friday'), or null on weekends. */
export function getDayKey(date) {
  return DAYS.find((d) => d.weekday === date.getDay())?.key ?? null;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}
