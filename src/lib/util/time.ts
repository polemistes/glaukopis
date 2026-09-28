import { languages, t } from '$lib/i18n';

/** "just now", "3 hours ago", "yesterday", "12 March", in the language of the interface. */
export function ago(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, (now - then) / 1000);
  if (seconds < 60) return t('time-just-now');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('time-minutes-ago', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time-hours-ago', { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t('time-yesterday');
  if (days < 7) return t('time-days-ago', { count: days });
  const date = new Date(then);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(languages.current, {
    day: 'numeric',
    month: 'long',
    year: sameYear ? undefined : 'numeric',
  });
}
