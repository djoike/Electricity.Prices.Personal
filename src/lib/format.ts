/** Danish number formatting with comma decimals and trailing " kr" */
export function formatPriceDKK(value: number): string {
  const fixed = new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${fixed} kr`;
}

export function formatWeekdayHourDK(dateISO: string): string {
  const d = new Date(dateISO);
  const weekday = new Intl.DateTimeFormat('da-DK', {
    timeZone: 'Europe/Copenhagen',
    weekday: 'short',
  }).format(d);
  const hour = new Intl.DateTimeFormat('da-DK', {
    timeZone: 'Europe/Copenhagen',
    hour: '2-digit',
    hour12: false,
  }).format(d);
  return `${capitalizeDa(weekday)} - kl. ${hour}`;
}

function capitalizeDa(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export function formatLastUpdated(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(date);
}