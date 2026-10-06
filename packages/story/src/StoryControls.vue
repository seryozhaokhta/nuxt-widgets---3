<template>
    <div class="story-controls">
        <IconButton icon="chevron-left" :label="t('previous')" @click="emit('previous')" />
        <IconButton :icon="isPaused ? 'play' : 'pause'" variant="outline" :label="t(isPaused ? 'play' : 'pause')"
            @click="emit('togglePause')" />
        <IconButton icon="chevron-right" :label="t('next')" @click="emit('next')" />
        <span class="story-controls__spacer" />
        <IconButton :icon="isZoomedIn ? 'zoom-out' : 'zoom-in'" size="sm"
            :label="t(isZoomedIn ? 'showWhole' : 'zoomToPoint')" @click="emit('toggleZoom')" />
        <IconButton icon="restart" size="sm" :label="t('restart')" @click="emit('restart')" />
    </div>
</template>

<script setup lang="ts">
import { useI18n } from '@art-widgets/core'
import { IconButton } from '@art-widgets/ui'

defineProps<{
    isPaused: boolean
    isZoomedIn: boolean
}>()

const emit = defineEmits<{
    previous: []
    next: []
    togglePause: []
    toggleZoom: []
    restart: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.story-controls {
    display: flex;
    align-items: center;
    gap: 4px;
}

.story-controls__spacer {
    flex: 1;
}
</style>
