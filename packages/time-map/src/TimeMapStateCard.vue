<!--
  Small card of a state clicked on the map: its name, its years on the map and
  a link to its Wikipedia article. Placed at the click, kept inside the map.
-->
<template>
    <div class="time-map-state" role="group" :aria-label="l(polity.name)" :style="style" @mousedown.stop
        @touchstart.stop>
        <div class="time-map-state__top">
            <p class="time-map-state__name">{{ l(polity.name) }}</p>
            <IconButton class="time-map-state__close" icon="close" size="sm" variant="ghost" :label="t('close')"
                @click="emit('close')" />
        </div>
        <p v-if="info" class="time-map-state__years">{{ yearRange(info.from, info.to) }}</p>
        <a v-if="article" class="time-map-state__link" :href="article" target="_blank" rel="noopener noreferrer">
            {{ t('wikipedia') }}
            <Icon name="arrow-up-right" class="time-map-state__icon" />
        </a>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@art-widgets/core'
import { Icon, IconButton } from '@art-widgets/ui'
import type { Polity, PolityInfo } from './usePolities'

const props = defineProps<{
    polity: Polity
    info: PolityInfo | null
    /** Where the click was, px from the map's top-left corner. */
    x: number
    y: number
    /** Size of the map, px, to keep the card inside it. */
    width: number
    height: number
}>()

const emit = defineEmits<{ close: [] }>()

const { t, l, yearRange, locale } = useI18n()

/** The article in the page's language, or the English one. */
const article = computed(() => {
    const wiki = props.info?.wiki
    if (!wiki) return ''
    const [lang, title] = locale.value === 'ru' && wiki.ru ? ['ru', wiki.ru] : ['en', wiki.en]
    return title ? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` : ''
})

const CARD_WIDTH = 220
const CARD_HEIGHT = 110
const GAP = 12

// Right of and below the click, or flipped to the other side near an edge.
const style = computed(() => {
    const left = props.x + GAP + CARD_WIDTH > props.width ? Math.max(GAP, props.x - GAP - CARD_WIDTH) : props.x + GAP
    const top = props.y + GAP + CARD_HEIGHT > props.height ? Math.max(GAP, props.y - GAP - CARD_HEIGHT) : props.y + GAP
    return { left: left + 'px', top: top + 'px', width: CARD_WIDTH + 'px' }
})
</script>

<style scoped>
.time-map-state {
    position: absolute;
    box-sizing: border-box;
    padding: 12px 14px 12px;
    border-radius: var(--aw-radius-sm);
    background-color: var(--aw-color-ink);
    box-shadow: 0 0 0 1px var(--aw-color-line), 0 16px 32px -12px rgba(0, 0, 0, 0.9);
    color: var(--aw-color-text);
    cursor: default;
}

.time-map-state__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
}

.time-map-state__name {
    margin: 0;
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-display);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: var(--aw-tracking-title);
    line-height: 1.2;
}

.time-map-state__close {
    margin: -6px -8px 0 0;
}

.time-map-state__years {
    margin: 4px 0 0;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: var(--aw-label-size);
}

.time-map-state__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 10px;
    color: var(--aw-color-text-muted);
    font-size: 13px;
    text-decoration: underline;
    text-decoration-color: var(--aw-color-line-strong);
    text-underline-offset: 3px;
}

.time-map-state__link:hover {
    color: var(--aw-color-gold-bright);
}

.time-map-state__link:focus-visible {
    border-radius: 2px;
    box-shadow: var(--aw-focus-ring);
    outline: none;
}

.time-map-state__icon {
    width: 12px;
    height: 12px;
}
</style>
