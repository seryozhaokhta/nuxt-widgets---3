<!-- A museum wall label: a small card of off-white paper beside the work. -->
<template>
    <div class="wall-label">
        <p class="wall-label__artist">{{ label.artist }}</p>
        <p class="wall-label__title">{{ label.title }}</p>
        <p class="wall-label__line">{{ label.date }}</p>
        <p class="wall-label__line">{{ label.medium }}</p>
        <p class="wall-label__place">{{ label.place }}</p>
    </div>
</template>

<script setup lang="ts">
export interface Label {
    artist: string
    title: string
    date: string
    medium: string
    place: string
}

defineProps<{ label: Label }>()
</script>

<style scoped>
.wall-label {
    position: absolute;
    z-index: 25;
    left: 24px;
    bottom: 200px;
    width: 236px;
    padding: 14px 16px 13px;
    border-radius: 2px;
    background: #ece6da;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 18px 40px -16px rgba(0, 0, 0, 0.8);
    color: #141210;
}

.wall-label p {
    margin: 0;
}

.wall-label__artist {
    font-family: var(--aw-font-sans);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.wall-label__title {
    margin: 6px 0 6px !important;
    font-family: var(--aw-font-artwork);
    font-size: 19px;
    font-style: italic;
    line-height: 1.15;
    letter-spacing: -0.01em;
    text-wrap: balance;
}

.wall-label__line {
    font-family: var(--aw-font-sans);
    font-size: 11px;
    line-height: 1.45;
}

.wall-label__place {
    margin-top: 8px !important;
    padding-top: 7px;
    border-top: 1px solid rgba(20, 18, 16, 0.18);
    color: rgba(20, 18, 16, 0.62);
    font-family: var(--aw-font-mono);
    font-size: 9px;
    letter-spacing: 0.02em;
}
</style>
