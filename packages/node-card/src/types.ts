import type { Localized } from '@art-widgets/core'

export interface NodeCardData {
  image: string
  /** Image description; falls back to the title. */
  alt?: Localized
  /** CSS object-position for the cropped image, e.g. "50% 20%". */
  imagePosition?: string
  title: Localized
  author: Localized
  /** Free-form date, e.g. "c. 1536". */
  date?: Localized
  description?: Localized
  tag?: Localized
  source?: { url: string }
}
