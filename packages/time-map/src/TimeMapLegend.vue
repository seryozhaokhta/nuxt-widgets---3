<!--
  Key to the map's symbols, plus data credits: one short line of sources
  (names, licence, changes) with the full credits behind "More".
-->
<template>
    <div class="legend">
        <ul class="legend__items">
            <li v-if="kinds.has('state')" class="legend__item">
                <span class="legend__swatch legend__swatch--state" />{{ t('legendState') }}
            </li>
            <li v-if="kinds.has('culture')" class="legend__item">
                <span class="legend__swatch legend__swatch--culture" />{{ t('legendCulture') }}
            </li>
            <li v-if="kinds.has('ice')" class="legend__item">
                <span class="legend__swatch legend__swatch--ice" />{{ t('legendIce') }}
            </li>
            <li v-if="showCoast" class="legend__item">
                <span class="legend__line" />{{ t('legendCoast') }}
            </li>
            <li v-if="showBorders" class="legend__item">
                <span class="legend__line legend__line--borders" />{{ t('legendBorders') }}
            </li>
        </ul>
        <div v-if="credits || sources?.length" class="legend__credits">
            <p class="legend__sources">
                <span>{{ t('sources') }}:</span>
                <template v-for="(source, i) in sources" :key="source.url">
                    <span v-if="i" class="legend__dot" aria-hidden="true">·</span>
                    <a class="legend__source" :href="source.url" target="_blank" rel="noopener noreferrer">{{
                        source.name }}</a><span v-if="source.note"> ({{ l(source.note) }})</span>
                </template>
                <button v-if="credits" type="button" class="legend__more" :aria-expanded="open"
                    :aria-controls="aboutId" @click="open = !open">{{ open ? t('hideDetails') : t('showDetails')
                    }}</button>
            </p>
            <p v-if="credits" v-show="open" :id="aboutId" class="legend__about">{{ credits }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from '@art-widgets/core'
import type { TimeMapFeatureKind, TimeMapSource } from './types'

defineProps<{
    kinds: Set<TimeMapFeatureKind>
    showCoast: boolean
    showBorders?: boolean
    credits?: string
    sources?: TimeMapSource[]
}>()

const open = ref(false)
const aboutId = useId()

const { t, l } = useI18n()
</script>

<style scoped>
.legend {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px 24px;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: var(--aw-label-size);
}

.legend__items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.legend__item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.legend__swatch {
    width: 14px;
    height: 10px;
    border-radius: 2px;
}

.legend__swatch--state {
    background-color: var(--aw-map-state);
    box-shadow: inset 0 0 0 1px var(--aw-map-state-edge);
}

.legend__swatch--culture {
    background-color: var(--aw-map-culture);
    outline: 1px dashed var(--aw-map-culture-edge);
    outline-offset: -1px;
}

.legend__swatch--ice {
    background-color: var(--aw-map-ice);
    box-shadow: inset 0 0 0 1px var(--aw-map-ice-edge);
}

.legend__line {
    width: 16px;
    border-top: 1px dashed var(--aw-map-coast);
}

.legend__line--borders {
    border-top: 1px solid var(--aw-map-border);
}

.legend__credits {
    font-size: 11px;
}

.legend__sources {
    margin: 0;
}

.legend__dot {
    margin: 0 0.4em;
}

.legend__source {
    margin-left: 0.4em;
    color: var(--aw-color-text-muted);
    text-decoration: underline;
    text-decoration-color: var(--aw-color-line-strong);
    text-underline-offset: 2px;
}

.legend__dot + .legend__source {
    margin-left: 0;
}

.legend__source:hover,
.legend__more:hover {
    color: var(--aw-color-gold-bright);
}

.legend__more {
    margin-left: 0.8em;
    padding: 0;
    border: 0;
    background: none;
    color: var(--aw-color-text-muted);
    font: inherit;
    cursor: pointer;
}

.legend__more:focus-visible {
    border-radius: 2px;
    box-shadow: var(--aw-focus-ring);
    outline: none;
}

.legend__about {
    max-width: 72ch;
    margin: 8px 0 0;
    line-height: 1.5;
}
</style>
