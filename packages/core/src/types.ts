export type Locale = 'ru' | 'en'

/** Plain text, or the same text per language. */
export type Localized = string | Partial<Record<Locale, string>>

/** Calendar year: negative is BCE, positive is CE. */
export type Year = number
