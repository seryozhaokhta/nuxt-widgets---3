/** The map's slider range and scale (see map-ancient.json and YearSlider). */
export const MIN_YEAR = -10000
export const MAX_YEAR = 2024
const SPAN = MAX_YEAR - MIN_YEAR

/** Slider position (0–1) of a year on the square-root scale. */
export const yearToPosition = (year: number) => 1 - Math.sqrt((MAX_YEAR - Math.min(MAX_YEAR, Math.max(MIN_YEAR, year))) / SPAN)

/** Year at a slider position, snapped the way the slider snaps. */
export function positionToYear(position: number): number {
    const raw = MAX_YEAR - (1 - Math.min(1, Math.max(0, position))) ** 2 * SPAN
    const before = MAX_YEAR - raw
    const step = before > 4000 ? 50 : before > 1000 ? 10 : before > 200 ? 5 : 1
    const snapped = Math.round((raw - MIN_YEAR) / step) * step + MIN_YEAR
    return snapped === 0 ? 1 : Math.min(MAX_YEAR, Math.max(MIN_YEAR, snapped))
}

/** Year between two years, moving as a hand on the slider would. */
export const yearBetween = (from: number, to: number, progress: number) =>
    positionToYear(yearToPosition(from) + (yearToPosition(to) - yearToPosition(from)) * progress)

/** "10,000" / "4500" / "1510": thousands separated only from five digits on. */
export function yearDigits(year: number): string {
    const value = Math.abs(Math.round(year))
    return value >= 10000 ? value.toLocaleString('en-US') : String(value)
}

export const era = (year: number) => (year < 0 ? 'BCE' : 'CE')
