import type { Locale, Year } from './types'

export interface YearFormatOptions {
  /** Prefix with "c." / "ок." for approximate dates. */
  approx?: boolean
}

const NBSP = ' '

const ERAS: Record<Locale, { bce: string; ce: string; approx: string }> = {
  en: { bce: 'BCE', ce: 'CE', approx: 'c.' },
  ru: { bce: `до${NBSP}н.${NBSP}э.`, ce: `н.${NBSP}э.`, approx: 'ок.' },
}

function era(year: Year, locale: Locale): string {
  return year < 0 ? ERAS[locale].bce : ERAS[locale].ce
}

function prefix(locale: Locale, options: YearFormatOptions): string {
  return options.approx ? `${ERAS[locale].approx} ` : ''
}

/** -4500 → "4500 BCE" / "4500 до н. э." */
export function formatYear(year: Year, locale: Locale, options: YearFormatOptions = {}): string {
  return `${prefix(locale, options)}${Math.abs(year)}${NBSP}${era(year, locale)}`
}

/** -6500, -3800 → "c. 6500–3800 BCE"; -100, 50 → "c. 100 BCE – 50 CE" */
export function formatYearRange(
  start: Year,
  end: Year,
  locale: Locale,
  options: YearFormatOptions = {},
): string {
  if ((start < 0) === (end < 0)) {
    return `${prefix(locale, options)}${Math.abs(start)}–${Math.abs(end)}${NBSP}${era(end, locale)}`
  }
  return `${prefix(locale, options)}${formatYear(start, locale)} – ${formatYear(end, locale)}`
}
