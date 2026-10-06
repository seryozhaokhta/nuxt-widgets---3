<template>
    <div :class="['node-card-back', { 'node-card-back--hidden': hidden }]">
        <span v-if="data.tag" class="node-card-back__label">{{ l(data.tag) }}</span>
        <h2 class="node-card-back__title">{{ l(data.title) }}</h2>
        <p class="node-card-back__meta">
            {{ l(data.author) }}<template v-if="data.date"> · {{ l(data.date) }}</template>
        </p>

        <p v-if="data.description" class="node-card-back__description">{{ l(data.description) }}</p>

        <a v-if="data.source" :href="data.source.url" target="_blank" rel="noopener noreferrer"
            class="node-card-back__source">
            {{ t('source') }}
            <Icon name="arrow-up-right" class="node-card-back__source-icon" />
        </a>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from '@art-widgets/core'
import { Icon } from '@art-widgets/ui'
import type { NodeCardData } from './types'

defineProps<{
    data: NodeCardData
    hidden: boolean
}>()

const { t, l } = useI18n()
</script>

<style scoped>
.node-card-back {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: 24px 24px 20px;
    background-color: var(--aw-color-ink);
    opacity: 1;
    visibility: visible;
    transition:
        opacity var(--aw-duration) var(--aw-ease),
        transform var(--aw-duration) var(--aw-ease),
        visibility 0s 0s;
}

.node-card-back--hidden {
    opacity: 0;
    visibility: hidden;
    transform: translateY(12px);
    transition:
        opacity var(--aw-duration) var(--aw-ease),
        transform var(--aw-duration) var(--aw-ease),
        visibility 0s var(--aw-duration);
}

.node-card-back__label {
    margin-bottom: 12px;
    color: var(--aw-color-gold);
    font-size: var(--aw-text-xs);
    font-weight: 500;
    letter-spacing: var(--aw-label-tracking);
    text-transform: uppercase;
}

.node-card-back__title {
    margin: 0 40px 0 0;
    font-family: var(--aw-font-serif);
    font-size: 26px;
    font-weight: 500;
    line-height: 1.05;
    text-wrap: balance;
    overflow-wrap: break-word;
    hyphens: auto;
}

.node-card-back__meta {
    margin: 8px 0 0;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--aw-color-line);
    color: var(--aw-color-text-muted);
    font-size: var(--aw-text-sm);
}

.node-card-back__description {
    flex: 1;
    margin: 16px 0 0;
    overflow-y: auto;
    color: var(--aw-color-text);
    font-size: 14px;
    line-height: 1.6;
}

.node-card-back__source {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 16px;
    color: var(--aw-color-gold);
    font-size: var(--aw-text-xs);
    font-weight: 500;
    letter-spacing: var(--aw-label-tracking);
    text-transform: uppercase;
    text-decoration: none;
    --icon-size: 14px;
}

.node-card-back__source:hover {
    color: var(--aw-color-gold-bright);
}

.node-card-back__source:focus-visible {
    outline: none;
    border-radius: 4px;
    box-shadow: var(--aw-focus-ring);
}

.node-card-back__source-icon {
    transition: transform var(--aw-duration-fast) var(--aw-ease);
}

.node-card-back__source:hover .node-card-back__source-icon {
    transform: translate(2px, -2px);
}
</style>
