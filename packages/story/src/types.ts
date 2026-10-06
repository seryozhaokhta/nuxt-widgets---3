import type { Localized, Year } from '@art-widgets/core'

export interface StoryPoint {
  /** Position in percent of the whole image. */
  x: number
  y: number
  title?: Localized
  text: Localized
}

export interface StoryData {
  image: string
  /** Pixel size of the image; gives the frame its proportions before loading. */
  size?: { width: number; height: number }
  /** Image description; falls back to the title. */
  alt?: Localized
  title: Localized
  author?: Localized
  dated?: { start: Year; end?: Year }
  description?: Localized
  points: StoryPoint[]
  /** Time on each point in milliseconds. Default: depends on the text length. */
  stepDuration?: number
}
