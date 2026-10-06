<!--
  Round icon-only button. Variants: "glass" over images, "ghost" on dark
  surfaces, "outline" when it needs a visible edge.
-->
<template>
    <button type="button" :class="['icon-button', 'icon-button--' + variant, 'icon-button--' + size]"
        :aria-label="label" :title="label">
        <Icon :name="icon" />
    </button>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'
import type { IconName } from './icons'

withDefaults(defineProps<{
    icon: IconName
    /** Accessible name, also shown as a tooltip. */
    label: string
    variant?: 'glass' | 'ghost' | 'outline'
    size?: 'sm' | 'md'
}>(), {
    variant: 'ghost',
    size: 'md',
})
</script>

<style scoped>
.icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--aw-radius-pill);
    background: transparent;
    color: var(--aw-color-text);
    cursor: pointer;
    transition:
        color var(--aw-duration-fast) var(--aw-ease),
        background-color var(--aw-duration-fast) var(--aw-ease),
        border-color var(--aw-duration-fast) var(--aw-ease);
}

.icon-button--sm {
    width: 32px;
    height: 32px;
    --icon-size: 16px;
}

.icon-button--md {
    width: 40px;
    height: 40px;
    --icon-size: 20px;
}

.icon-button--glass {
    background-color: var(--aw-color-scrim);
    border-color: var(--aw-color-line);
    backdrop-filter: blur(var(--aw-blur));
    -webkit-backdrop-filter: blur(var(--aw-blur));
}

.icon-button--outline {
    border-color: var(--aw-color-line-strong);
}

.icon-button:hover {
    color: var(--aw-color-gold-bright);
}

.icon-button--glass:hover,
.icon-button--outline:hover {
    border-color: var(--aw-color-gold-soft);
}

.icon-button:focus-visible {
    outline: none;
    box-shadow: var(--aw-focus-ring);
}

.icon-button:disabled {
    opacity: 0.4;
    cursor: default;
}
</style>
