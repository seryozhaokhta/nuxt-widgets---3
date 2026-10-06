<!-- Row of clickable segments; the current one is filled by `progress` percent. -->
<template>
    <div class="segments">
        <button v-for="(label, index) in labels" :key="index" type="button" class="segments__item"
            :aria-label="label" :title="label" :aria-current="index === current ? 'step' : undefined"
            @click="emit('select', index)">
            <span class="segments__track">
                <span :class="['segments__fill', { 'segments__fill--smooth': smooth }]"
                    :style="{ width: fill(index) + '%' }" />
            </span>
        </button>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    /** Accessible name of each segment; also defines how many there are. */
    labels: string[]
    current: number
    /** Fill of the current segment, 0–100. */
    progress?: number
    /** Keep segments before the current one filled. */
    cumulative?: boolean
    /** Animate fill width changes. */
    smooth?: boolean
}>(), {
    progress: 100,
    cumulative: false,
    smooth: false,
})

const emit = defineEmits<{ select: [index: number] }>()

function fill(index: number): number {
    if (index === props.current) return props.progress
    return props.cumulative && index < props.current ? 100 : 0
}
</script>

<style scoped>
.segments {
    display: flex;
    gap: 6px;
}

/* The button is a tall hit area around a thin visible track. */
.segments__item {
    flex: 1;
    display: flex;
    align-items: center;
    height: 20px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
}

.segments__track {
    position: relative;
    flex: 1;
    height: 2px;
    overflow: hidden;
    border-radius: var(--aw-radius-pill);
    background-color: var(--aw-color-line-strong);
    transition: height var(--aw-duration-fast) var(--aw-ease);
}

.segments__item:hover .segments__track {
    height: 4px;
}

.segments__item:focus-visible {
    outline: none;
}

.segments__item:focus-visible .segments__track {
    box-shadow: var(--aw-focus-ring);
}

.segments__fill {
    position: absolute;
    inset: 0 auto 0 0;
    background-color: var(--aw-color-gold);
}

.segments__fill--smooth {
    transition: width var(--aw-duration) var(--aw-ease);
}
</style>
