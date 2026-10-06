import type { Localized, Year } from '@art-widgets/core'

/** [longitude, latitude] in degrees. */
export type LonLat = [number, number]

export interface TimeMapPeriod {
  title: Localized
  start: Year
  end: Year
  approx?: boolean
  description?: Localized
}

/** A clickable place with its own story and periods. */
export interface TimeMapPoint {
  id: string | number
  name: Localized
  description?: Localized
  at: LonLat
  /** The point appears on the map from this year on. */
  founded: Year
  approx?: boolean
  periods?: TimeMapPeriod[]
}

export type TimeMapFeatureKind =
  | 'state' // a polity with borders
  | 'culture' // an archaeological culture or civilisation without one state
  | 'ice' // an ice sheet
  | 'water' // a former sea or lake shore
  | 'river' // a former river course (line)
  | 'place' // a name only, e.g. a vanished land bridge

/** A hand-drawn area, line or name that exists between two years. */
export interface TimeMapFeature {
  id: string
  kind: TimeMapFeatureKind
  name?: Localized
  from: Year
  to: Year
  /** Polygon rings (areas) or a single line (rivers). Omit for "place". */
  shape?: LonLat[][]
  /** Where the name goes; defaults to the shape's centre. */
  label?: LonLat
  /** Draw the shape without a name (e.g. when a point already names it). */
  hideLabel?: boolean
}

/** Land outline in effect from `from` until the next epoch. */
export interface TimeMapEpoch {
  from: Year
  /** URL of a GeoJSON land outline. */
  land: string
  /** Global sea level relative to today, in metres. */
  seaLevel?: number
}

export interface TimeMapGeography {
  epochs: TimeMapEpoch[]
  /** URLs of GeoJSON layers drawn for every epoch. */
  rivers?: string
  lakes?: string
  /** Today's coastline, drawn faintly for comparison. */
  modernCoast?: string
}

export interface TimeMapData {
  title?: Localized
  geography: TimeMapGeography
  features?: TimeMapFeature[]
  points: TimeMapPoint[]
  /** Slider range. Default: earliest founding year to the latest date in the data. */
  range?: { start?: Year; end?: Year }
  /** Slider step in years. Default: 50. */
  yearStep?: number
  /** Opening view; the map starts showing the whole world. */
  view?: { center: LonLat; zoom: number }
  /** Data credits shown under the map. */
  credits?: Localized
}
