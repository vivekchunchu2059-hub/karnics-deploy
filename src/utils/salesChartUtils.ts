/**
 * Y-axis tick logic for sales trend charts (values in lakhs).
 * Produces round ticks like 0L, 2L, 4L, 6L, 8L, 10L with even gaps.
 */

export interface SalesTrendPoint {
  value: number;
}

const MAX_DOMAIN_CAP = 400; // Cap Y so one outlier (e.g. 9993L) doesn't stretch the axis

export function getNiceLakhTicks(
  data: SalesTrendPoint[]
): { domain: [number, number]; ticks: number[] } {
  const values = data.map((d) => d.value);
  const maxVal = values.length ? Math.max(...values) : 10;
  // Cap ceiling so a single outlier (e.g. 9993L) doesn't stretch the axis
  const rest = values.filter((v) => v < maxVal);
  const secondMax = rest.length ? Math.max(...rest) : 0;
  const cappedMax =
    maxVal > MAX_DOMAIN_CAP && secondMax < maxVal * 0.5
      ? Math.min(maxVal, Math.max(MAX_DOMAIN_CAP, Math.ceil(secondMax * 1.2)))
      : maxVal;

  let ceiling: number;
  let step: number;
  // Prefer 0, 2, 4, 6, 8, 10L style ticks; step 2 for small range, then 4, 6, 8, 10...
  if (cappedMax <= 10) {
    ceiling = 10;
    step = 2; // 0, 2, 4, 6, 8, 10
  } else if (cappedMax <= 20) {
    ceiling = 20;
    step = 4; // 0, 4, 8, 12, 16, 20
  } else if (cappedMax <= 30) {
    ceiling = 30;
    step = 6; // 0, 6, 12, 18, 24, 30
  } else if (cappedMax <= 50) {
    ceiling = Math.ceil(cappedMax / 10) * 10 || 10;
    step = 10; // 0, 10, 20, 30, 40, 50
  } else if (cappedMax <= 100) {
    ceiling = Math.ceil(cappedMax / 20) * 20 || 20;
    step = 20; // 0, 20, 40, 60, 80, 100
  } else if (cappedMax <= 200) {
    ceiling = Math.ceil(cappedMax / 50) * 50 || 50;
    step = 50;
  } else {
    ceiling = Math.min(Math.ceil(cappedMax / 100) * 100 || 100, MAX_DOMAIN_CAP);
    step = 50; // 0, 50, 100, 150, 200, 250, 300... (finer than 100)
  }

  const ticks: number[] = [];
  for (let t = 0; t <= ceiling; t += step) {
    ticks.push(t);
  }
  if (ticks[ticks.length - 1] !== ceiling) {
    ticks.push(ceiling);
  }
  return { domain: [0, ceiling], ticks };
}

export function formatLakhTick(value: number): string {
  return `${Number.isInteger(value) ? value : Math.round(value)}L`;
}
