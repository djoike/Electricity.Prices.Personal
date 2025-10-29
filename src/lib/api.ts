import { BASE_URL, PRODUCT_ID, SUPPLIER_ID, HOURS_AHEAD, AGGREGATION, AGGREGATION_METHOD, INCLUDE_FORECAST } from '../data/config';
import { currentHourUtcFromDKNow, addHours } from './time';

export type PricePoint = {
  date: string; // ISO UTC from API
  price: number;
  resolution: '1h';
  forecast?: boolean;
};

export type UiPoint = {
  iso: string;             // ISO UTC for the hour
  label: string;           // dd/MM HH:mm in DK time
  price: number;           // raw numeric price
  isForecast: boolean;
  isCurrentHour: boolean;
};

function toISO(date: Date): string {
  return date.toISOString();
}

export function buildUrl(): string {
  const from = currentHourUtcFromDKNow();
  const to = addHours(from, HOURS_AHEAD);

  const params = new URLSearchParams({
    from: toISO(from),
    to: toISO(to),
    productId: PRODUCT_ID,
    supplierId: SUPPLIER_ID,
    lean: 'true',
    forecast: INCLUDE_FORECAST ? 'true' : 'false',
    aggregation: AGGREGATION,
    aggregationMethod: AGGREGATION_METHOD,
  });

  return `${BASE_URL}/api/prices?${params.toString()}`;
}

export async function fetchPrices(signal?: AbortSignal): Promise<PricePoint[]> {
  const url = buildUrl();
  const res = await fetch(url, { headers: { 'accept': 'application/json' }, signal });
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Bad API response');
  return data as PricePoint[];
}

import { formatWeekdayHourDK } from './format';

export function mapToUi(points: PricePoint[]): UiPoint[] {
  if (!points.length) return [];

  // Determine current hour ISO (UTC) to flag the bar
  const currentHourUtcIso = currentHourUtcFromDKNow().toISOString();

  return points.map(p => {
    const iso = p.date;
    return {
      iso,
      label: formatWeekdayHourDK(iso),
      price: p.price,
      isForecast: !!p.forecast,
      isCurrentHour: iso === currentHourUtcIso,
    } satisfies UiPoint;
  });
}