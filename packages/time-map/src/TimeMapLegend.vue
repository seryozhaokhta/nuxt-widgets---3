<!-- Key to the map's symbols, plus data credits. -->
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
        <p v-if="credits || sources?.length" class="legend__credits">
            {{ credits }}
            <template v-for="source in sources" :key="source.url">
                <a class="legend__source" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.name }}</a>
            </template>
        </p>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from '@art-widgets/core'
import type { TimeMapFeatureKind } from './types'

defineProps<{
    kinds: Set<TimeMapFeatureKind>
    showCoast: boolean
    showBorders?: boolean
    credits?: string
    sources?: { name: string; url: string }[]
}>()

const { t } = useI18n()
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
    margin: 0;
    max-width: 64ch;
}

.legend__source {
    margin-left: 0.6em;
    color: var(--aw-color-text-muted);
    text-decoration: underline;
    text-decoration-color: var(--aw-color-line-strong);
    text-underline-offset: 2px;
}

.legend__source:hover {
    color: var(--aw-color-gold-bright);
}
</style>
