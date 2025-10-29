/**
 * Compute the current hour in DK time, but return the UTC Date that corresponds
 * to that local wall-clock hour (i.e., 2025-10-29 14:00 DK -> 2025-10-29T13:00:00.000Z in CET).
 * This avoids needing a timezone lib by deriving the current offset via Intl.
 */
export function currentHourUtcFromDKNow(): Date {
  const now = new Date();
  // derive DK offset at this instant
  const locale = 'en-US';
  const dk = new Date(now.toLocaleString(locale, { timeZone: 'Europe/Copenhagen' }));
  const utc = new Date(now.toLocaleString(locale, { timeZone: 'UTC' }));
  const offsetMs = dk.getTime() - utc.getTime(); // ahead of UTC => positive

  const dkNowMs = now.getTime() + offsetMs;
  const hourMs = 60 * 60 * 1000;
  const dkRoundedHourMs = dkNowMs - (dkNowMs % hourMs);
  const utcForThatDkHour = new Date(dkRoundedHourMs - offsetMs);
  return utcForThatDkHour;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}