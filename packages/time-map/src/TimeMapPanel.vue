<!--
  Side panel (under the slider on narrow screens) for whatever was clicked on
  the map: a civilization, its story open at a chapter, or a state that is no
  civilization's chapter. Always the same order: years, name, chapter (if
  any), Wikipedia.
-->
<template>
    <div ref="panelRef" :class="['time-map-panel', { 'time-map-panel--short': !point }]" tabindex="-1"
        role="dialog" :aria-label="title">
        <div class="time-map-panel__top">
            <p class="time-map-panel__eyebrow">{{ eyebrow }}</p>
            <IconButton class="time-map-panel__close" icon="close" size="sm" :label="t('close')" @click="close" />
        </div>
        <h2 class="time-map-panel__title">{{ title }}</h2>

        <template v-if="point">
            <div v-if="period" class="time-map-panel__period">
                <p class="time-map-panel__period-years">
                    {{ yearRange(period.start, period.end, { approx: period.approx }) }}<template v-if="kind"> · {{ kind }}</template>
                </p>
                <h3 class="time-map-panel__period-title">{{ l(period.title) }}</h3>
                <p class="time-map-panel__text">{{ l(period.description) }}</p>
            </div>
            <p v-else class="time-map-panel__text">{{ l(point.description) }}</p>

            <SegmentedProgress v-if="point.periods?.length" class="time-map-panel__periods" smooth
                :labels="periodLabels" :current="periodIndex" @select="selectPeriod" />
        </template>

        <p v-if="articles.length" class="time-map-panel__wiki">
            <template v-if="articles.length > 1">{{ t('wikipedia') + ': ' }}</template>
            <template v-for="(article, i) in articles" :key="article.href">
                <template v-if="i"> · </template>
                <a class="time-map-panel__wiki-link" :href="article.href" target="_blank" rel="noopener noreferrer">
                    {{ articles.length > 1 ? article.text : t('wikipedia') }}
                    <Icon name="arrow-up-right" class="time-map-panel__wiki-icon" />
                </a>
            </template>
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { useI18n, type Localized } from '@art-widgets/core'
import { Icon, IconButton, SegmentedProgress } from '@art-widgets/ui'
import type { TimeMapPeriod, TimeMapPoint, WikiTitles } from './types'
import type { PolityInfo } from './usePolities'

const props = defineProps<{
    /** The civilization whose story is shown, if any. */
    point: TimeMapPoint | null
    /** Or the state that was clicked; its info arrives a moment later. */
    state: { name: Localized; info: PolityInfo | null } | null
    /** What the open chapter was: a state, a culture, part of another state. */
    kind?: string
    /** Wikipedia articles to link, in order. */
    links: { text: string; wiki: WikiTitles }[]
}>()

const periodIndex = defineModel<number>('periodIndex', { required: true })

const emit = defineEmits<{
    selectPeriod: [period: TimeMapPeriod]
    /** The close animation has finished. */
    closed: []
}>()

const { t, l, year, yearRange, locale } = useI18n()

const title = computed(() => l(props.state?.name ?? props.point?.name))

const eyebrow = computed(() => {
    if (props.state) {
        const info = props.state.info
        return (info ? yearRange(info.from, info.to) + ' · ' : '') + t('stateKind')
    }
    const point = props.point
    return point ? year(point.founded, { approx: point.approx }) + ' · ' + t('founded') : ''
})

/** Articles in the page's language when there is one. */
const articles = computed(() => props.links.flatMap(({ text, wiki }) => {
    const [lang, title] = locale.value === 'ru' && wiki.ru ? ['ru', wiki.ru] : ['en', wiki.en]
    if (!title) return []
    return [{ text, href: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` }]
}))

const period = computed(() => props.point?.periods?.[periodIndex.value])
const periodLabels = computed(() => props.point?.periods?.map((item) => l(item.title)) ?? [])

function selectPeriod(index: number) {
    const selected = props.point?.periods?.[index]
    if (!selected) return
    periodIndex.value = index
    emit('selectPeriod', selected)
}

const panelRef = ref<HTMLElement | null>(null)
// A second close while the first is running would report "closed" twice.
let closing = false

function open() {
    if (!panelRef.value) return
    closing = false
    gsap.killTweensOf(panelRef.value)
    gsap.fromTo(panelRef.value, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
    // Focus keeps Esc working for this map only.
    panelRef.value.focus({ preventScroll: true })
}

function close() {
    if (!panelRef.value || closing) return
    closing = true
    gsap.killTweensOf(panelRef.value)
    gsap.to(panelRef.value, {
        opacity: 0,
        y: 12,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => emit('closed'),
    })
}

onMounted(open)

defineExpose({ open, close })
</script>

<style scoped>
.time-map-panel {
    position: absolute;
    top: 12px;
    right: 12px;
    bottom: 12px;
    width: 300px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 18px 20px 14px;
    overflow-y: auto;
    border-radius: var(--aw-radius-md);
    background-color: var(--aw-color-ink);
    box-shadow: 0 0 0 1px var(--aw-color-line), 0 24px 48px -16px rgba(0, 0, 0, 0.9);
    color: var(--aw-color-text);
    cursor: default;
}

.time-map-panel:focus {
    outline: none;
}

/* A state without a story needs no full-height panel. */
.time-map-panel--short {
    bottom: auto;
}

.time-map-panel__wiki {
    margin: 14px 0 0;
    color: var(--aw-color-text-subtle);
    font-size: 13px;
    line-height: 1.6;
}

.time-map-panel__wiki-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--aw-color-text-muted);
    text-decoration: underline;
    text-decoration-color: var(--aw-color-line-strong);
    text-underline-offset: 3px;
}

.time-map-panel__wiki-link:hover {
    color: var(--aw-color-gold-bright);
}

.time-map-panel__wiki-link:focus-visible {
    border-radius: 2px;
    box-shadow: var(--aw-focus-ring);
    outline: none;
}

.time-map-panel__wiki-icon {
    width: 12px;
    height: 12px;
}

.time-map-panel__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.time-map-panel__close {
    margin: -6px -8px -6px 0;
}

.time-map-panel__eyebrow,
.time-map-panel__period-years {
    margin: 0;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: var(--aw-label-size);
    font-weight: 400;
}

.time-map-panel__title {
    margin: 8px 0 0;
    font-family: var(--aw-font-display);
    font-size: 28px;
    font-weight: 600;
    letter-spacing: var(--aw-tracking-heading);
    line-height: 1.05;
}

.time-map-panel__period {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--aw-color-line);
}

.time-map-panel__period-years {
    color: var(--aw-color-text-subtle);
}

.time-map-panel__period-title {
    margin: 6px 0 0;
    font-family: var(--aw-font-display);
    font-size: 19px;
    font-weight: 600;
    letter-spacing: var(--aw-tracking-title);
    line-height: 1.15;
}

.time-map-panel__text {
    margin: 8px 0 0;
    color: var(--aw-color-text-muted);
    font-size: 14px;
    line-height: 1.6;
}

.time-map-panel__periods {
    margin-top: auto;
    padding-top: 16px;
}

@container (max-width: 760px) {
    .time-map-panel {
        position: static;
        width: auto;
        margin-top: 12px;
        padding: 14px 16px 10px;
        overflow: visible;
    }

    .time-map-panel__title {
        font-size: 24px;
    }

    .time-map-panel__period {
        margin-top: 12px;
        padding-top: 12px;
    }
}
</style>
