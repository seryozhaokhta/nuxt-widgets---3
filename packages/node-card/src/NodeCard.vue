<!-- An artwork card that flips to its description and collapses into a round node. -->
<template>
    <article :class="['node-card', { 'node-card--collapsed': isCollapsed }]" :lang="locale"
        :aria-label="l(data.title)">
        <template v-if="!isCollapsed">
            <img class="node-card__image" :src="data.image" :alt="l(data.alt ?? data.title)"
                :style="{ objectPosition: data.imagePosition }" />

            <NodeCardFront :data="data" :hidden="showDetails" />
            <NodeCardBack :data="data" :hidden="!showDetails" />

            <IconButton class="node-card__collapse" icon="collapse" variant="glass" size="sm" :label="t('collapse')"
                @click="collapse" />
            <IconButton :class="['node-card__flip', { 'node-card__flip--open': showDetails }]" icon="chevron-up"
                variant="glass" size="sm" :aria-expanded="showDetails"
                :label="t(showDetails ? 'hideDetails' : 'showDetails')" @click="showDetails = !showDetails" />
        </template>

        <NodeCardCollapsed v-else :data="data" @expand="isCollapsed = false" />
    </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { provideI18n, type Locale } from '@art-widgets/core'
import { IconButton } from '@art-widgets/ui'
import NodeCardFront from './NodeCardFront.vue'
import NodeCardBack from './NodeCardBack.vue'
import NodeCardCollapsed from './NodeCardCollapsed.vue'
import type { NodeCardData } from './types'

const props = defineProps<{
    data: NodeCardData
    locale?: Locale
}>()

const { t, l, locale } = provideI18n(() => props.locale)

const isCollapsed = ref(false)
const showDetails = ref(false)

function collapse() {
    showDetails.value = false
    isCollapsed.value = true
}
</script>

<style scoped>
.node-card {
    position: relative;
    flex: none;
    width: 280px;
    height: 360px;
    overflow: hidden;
    border-radius: var(--aw-radius-lg);
    background-color: var(--aw-color-ink);
    color: var(--aw-color-text);
    font-family: var(--aw-font-sans);
    box-shadow: 0 0 0 1px var(--aw-color-line), 0 24px 48px -24px rgba(0, 0, 0, 0.9);
    transition:
        width var(--aw-duration-slow) var(--aw-ease-spring),
        height var(--aw-duration-slow) var(--aw-ease-spring),
        border-radius var(--aw-duration-slow) var(--aw-ease),
        box-shadow var(--aw-duration) var(--aw-ease);
}

.node-card--collapsed {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft);
}

.node-card--collapsed:hover,
.node-card--collapsed:focus-within {
    box-shadow: 0 0 0 1px var(--aw-color-gold), 0 0 24px rgba(201, 164, 106, 0.3);
}

.node-card__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--aw-duration-slow) var(--aw-ease);
}

.node-card:hover .node-card__image {
    transform: scale(1.04);
}

.node-card__collapse {
    position: absolute;
    top: 14px;
    right: 14px;
}

.node-card__flip {
    position: absolute;
    right: 14px;
    bottom: 14px;
}

.node-card__flip :deep(.icon) {
    transition: transform var(--aw-duration) var(--aw-ease);
}

.node-card__flip--open :deep(.icon) {
    transform: rotate(180deg);
}
</style>
