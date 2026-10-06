import type { Localized, Year } from '@art-widgets/core'

export interface TimeMapPeriod {
  title: Localized
  start: Year
  end: Year
  approx?: boolean
  description?: Localized
}

export interface TimeMapPoint {
  id: string | number
  name: Localized
  description?: Localized
  /** Position in percent of the basemap image. To be replaced by longitude/latitude. */
  x: number
  y: number
  /** The point appears on the map from this year on. */
  founded: Year
  approx?: boolean
  periods?: TimeMapPeriod[]
}

export interface TimeMapData {
  title?: Localized
  /** URL of the map image. */
  basemap: string
  basemapAlt?: Localized
  points: TimeMapPoint[]
  /** Slider range. Default: earliest founding year to the latest date in the data. */
  range?: { start?: Year; end?: Year }
  /** Slider step in years. Default: 50. */
  yearStep?: number
}
