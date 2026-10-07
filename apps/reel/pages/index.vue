<!-- List of reels; each opens in preview. -->
<template>
    <main class="index">
        <p class="index__brand">Art Widgets · reels</p>
        <ul class="index__list">
            <li v-for="variant in variants" :key="variant.id">
                <NuxtLink :to="'/' + variant.id" class="index__link">
                    <span class="index__title">{{ variant.title }}</span>
                    <span class="index__text">{{ variant.description }}</span>
                    <span class="index__meta">{{ variant.duration }} s · {{ variant.bpm }} bpm</span>
                </NuxtLink>
            </li>
        </ul>
    </main>
</template>

<script setup lang="ts">
import { variants } from '~/variants'
</script>

<style scoped>
.index {
    max-width: 560px;
    margin: 0 auto;
    padding: 48px 24px;
}

.index__brand {
    margin: 0 0 24px;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: 12px;
}

.index__list {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.index__link {
    display: grid;
    gap: 6px;
    padding: 16px 20px;
    border-radius: 14px;
    box-shadow: 0 0 0 1px var(--aw-color-line);
    color: inherit;
    text-decoration: none;
}

.index__link:hover {
    box-shadow: 0 0 0 1px var(--aw-color-gold);
}

.index__title {
    font-family: var(--aw-font-display);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
}

.index__text {
    color: var(--aw-color-text-muted);
    font-size: 14px;
}

.index__meta {
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: 11px;
}
</style>
