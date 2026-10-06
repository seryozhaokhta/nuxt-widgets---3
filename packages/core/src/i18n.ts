import { computed, inject, provide, toValue, type ComputedRef, type InjectionKey, type MaybeRefOrGetter } from 'vue'
import { formatYear, formatYearRange, type YearFormatOptions } from './dates'
import type { Locale, Localized, Year } from './types'

export const DEFAULT_LOCALE: Locale = 'en'

const en = {
  author: 'Author',
  source: 'Source',
  showDetails: 'Show details',
  hideDetails: 'Hide details',
  collapse: 'Collapse',
  expand: 'Expand',
  storyRegion: 'Guided view of the painting',
  zoomToPoint: 'Zoom to this detail',
  showWhole: 'Show the whole painting',
  previous: 'Previous',
  next: 'Next',
  restart: 'Start over',
  play: 'Play',
  pause: 'Pause',
  step: 'Step {n} of {total}',
  worldMap: 'World map',
  founded: 'founded',
  close: 'Close',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetView: 'Show the whole map',
  year: 'Year',
  wheelHint: 'Hold Ctrl or ⌘ and scroll to zoom the map',
  seaLevel: 'Sea level {value} m',
  seaLevelToday: 'Sea level as today',
  legendState: 'State',
  legendCulture: 'Culture',
  legendIce: 'Ice sheet',
  legendCoast: 'Today’s coastline',
}

export type MessageKey = keyof typeof en

const messages: Record<Locale, Record<MessageKey, string>> = {
  en,
  ru: {
    author: 'Автор',
    source: 'Источник',
    showDetails: 'Подробнее',
    hideDetails: 'Скрыть подробности',
    collapse: 'Свернуть',
    expand: 'Развернуть',
    storyRegion: 'Экскурсия по картине',
    zoomToPoint: 'Приблизить деталь',
    showWhole: 'Показать картину целиком',
    previous: 'Назад',
    next: 'Дальше',
    restart: 'Сначала',
    play: 'Продолжить',
    pause: 'Пауза',
    step: 'Шаг {n} из {total}',
    worldMap: 'Карта мира',
    founded: 'основание',
    close: 'Закрыть',
    zoomIn: 'Приблизить',
    zoomOut: 'Отдалить',
    resetView: 'Показать всю карту',
    year: 'Год',
    wheelHint: 'Чтобы приблизить карту, прокрутите колесо с зажатым Ctrl или ⌘',
    seaLevel: 'Уровень моря {value} м',
    seaLevelToday: 'Уровень моря как сегодня',
    legendState: 'Государство',
    legendCulture: 'Культура',
    legendIce: 'Ледник',
    legendCoast: 'Нынешний берег',
  },
}

export function localize(value: Localized | undefined, locale: Locale): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  return value[locale] ?? value[DEFAULT_LOCALE] ?? Object.values(value).find(Boolean) ?? ''
}

export interface I18n {
  locale: ComputedRef<Locale>
  /** UI string by key; "{name}" placeholders are filled from params. */
  t: (key: MessageKey, params?: Record<string, string | number>) => string
  /** Content string from data. */
  l: (value: Localized | undefined) => string
  year: (year: Year, options?: YearFormatOptions) => string
  yearRange: (start: Year, end: Year, options?: YearFormatOptions) => string
}

const I18N_KEY: InjectionKey<I18n> = Symbol('art-widgets:i18n')

function createI18n(locale: MaybeRefOrGetter<Locale | undefined>, parent: I18n | null): I18n {
  const current = computed(() => toValue(locale) ?? parent?.locale.value ?? DEFAULT_LOCALE)
  return {
    locale: current,
    t: (key, params) =>
      messages[current.value][key].replace(/\{(\w+)\}/g, (match, name: string) =>
        params && name in params ? String(params[name]) : match),
    l: (value) => localize(value, current.value),
    year: (year, options) => formatYear(year, current.value, options),
    yearRange: (start, end, options) => formatYearRange(start, end, current.value, options),
  }
}

/**
 * Call in a mechanic's root component. An undefined locale inherits the
 * locale of an enclosing mechanic, if any.
 */
export function provideI18n(locale: MaybeRefOrGetter<Locale | undefined>): I18n {
  const i18n = createI18n(locale, inject(I18N_KEY, null))
  provide(I18N_KEY, i18n)
  return i18n
}

/** Call in a mechanic's inner components. */
export function useI18n(): I18n {
  return inject(I18N_KEY, null) ?? createI18n(undefined, null)
}
