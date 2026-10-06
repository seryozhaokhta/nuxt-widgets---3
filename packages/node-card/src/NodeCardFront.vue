<template>
    <div :class="['node-card-front', { 'node-card-front--hidden': hidden }]">
        <span v-if="data.tag" class="node-card-front__tag">{{ l(data.tag) }}</span>
        <h2 class="node-card-front__title">{{ l(data.title) }}</h2>
        <p class="node-card-front__author">
            <span class="node-card-front__visually-hidden">{{ t('author') }}: </span>{{ l(data.author) }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from '@art-widgets/core'
import type { NodeCardData } from './types'

defineProps<{
    data: NodeCardData
    hidden: boolean
}>()

const { t, l } = useI18n()
</script>

<style scoped>
.node-card-front {
    position: absolute;
    inset: auto 0 0 0;
    padding: 72px 64px 20px 20px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 10%, rgba(0, 0, 0, 0.55) 55%, transparent);
    opacity: 1;
    visibility: visible;
    transition:
        opacity var(--aw-duration) var(--aw-ease),
        transform var(--aw-duration) var(--aw-ease),
        visibility 0s 0s;
}

.node-card-front--hidden {
    opacity: 0;
    visibility: hidden;
    transform: translateY(12px);
    transition:
        opacity var(--aw-duration) var(--aw-ease),
        transform var(--aw-duration) var(--aw-ease),
        visibility 0s var(--aw-duration);
}

.node-card-front__tag {
    display: block;
    margin-bottom: 8px;
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: var(--aw-label-size);
    font-weight: 400;
}

.node-card-front__title {
    margin: 0;
    font-family: var(--aw-font-artwork);
    font-size: 28px;
    font-style: italic;
    font-weight: 400;
    letter-spacing: var(--aw-tracking-title);
    line-height: 1.05;
    text-wrap: balance;
}

.node-card-front__author {
    margin: 8px 0 0;
    color: var(--aw-color-text-muted);
    font-size: var(--aw-text-sm);
}

.node-card-front__visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
}
</style>
