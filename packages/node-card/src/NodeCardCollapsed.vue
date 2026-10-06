<template>
    <button type="button" class="node-card-collapsed" :aria-label="label" :title="l(data.title)"
        @click="emit('expand')">
        <img :src="data.image" alt="" class="node-card-collapsed__image" :style="{ objectPosition: data.imagePosition }" />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@art-widgets/core'
import type { NodeCardData } from './types'

const props = defineProps<{ data: NodeCardData }>()

const emit = defineEmits<{ expand: [] }>()

const { t, l } = useI18n()

const label = computed(() => t('expand') + ': ' + l(props.data.title))
</script>

<style scoped>
.node-card-collapsed {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    cursor: pointer;
}

.node-card-collapsed:focus-visible {
    outline: none;
}

.node-card-collapsed__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    transition: transform var(--aw-duration) var(--aw-ease);
}

.node-card-collapsed:hover .node-card-collapsed__image {
    transform: scale(1.08);
}
</style>
