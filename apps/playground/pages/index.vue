<!-- Showcase of all mechanics. ?lang=ru switches the language. -->
<template>
    <div class="page">
        <header class="page__header">
            <div>
                <p class="page__brand">Art Widgets</p>
                <h1 class="page__title">{{ copy.title }}</h1>
                <p class="page__lead">{{ copy.lead }}</p>
            </div>
            <nav class="page__lang" :aria-label="copy.language">
                <NuxtLink v-for="option in languages" :key="option" :to="{ query: { lang: option } }"
                    :class="['page__lang-link', { 'page__lang-link--current': option === locale }]"
                    :aria-current="option === locale ? 'true' : undefined">{{ option }}</NuxtLink>
            </nav>
        </header>

        <section v-for="(section, index) in copy.sections" :key="section.id" class="page__section">
            <div class="page__section-head">
                <span class="page__index">{{ String(index + 1).padStart(2, '0') }}</span>
                <h2 class="page__section-title">{{ section.title }}</h2>
                <p class="page__section-text">{{ section.text }}</p>
            </div>

            <div v-if="section.id === 'nodes'" class="page__nodes">
                <NodeCard v-for="(card, cardIndex) in portraits" :key="cardIndex" :data="card" :locale="locale" />
            </div>
            <ArtStory v-else-if="section.id === 'story'" :data="venus" :locale="locale" />
            <TimeMap v-else :data="ancientMap" :locale="locale" />
        </section>
    </div>
</template>

<script setup lang="ts">
import type { Locale } from '@art-widgets/core'
import { NodeCard, type NodeCardData } from '@art-widgets/node-card'
import { ArtStory, type StoryData } from '@art-widgets/story'
import { TimeMap, type TimeMapData } from '@art-widgets/time-map'
import portraitsJson from '~/data/portraits.json'
import venusJson from '~/data/story-venus.json'
import ancientMapJson from '~/data/map-ancient.json'

const portraits: NodeCardData[] = portraitsJson
const venus: StoryData = venusJson
const ancientMap: TimeMapData = ancientMapJson

const languages: Locale[] = ['en', 'ru']

const route = useRoute()
const locale = computed<Locale>(() => (route.query.lang === 'ru' ? 'ru' : 'en'))

const copies = {
    en: {
        title: 'Mechanics for telling the history of art',
        lead: 'Interactive pieces that can live on any page: cards that fold into nodes, a guided look at a painting, a map of time.',
        language: 'Language',
        sections: [
            { id: 'nodes', title: 'Nodes', text: 'Cards fold into nodes. Later, nodes will be linked by threads of influence.' },
            { id: 'story', title: 'A closer look', text: 'A guided tour of one painting, detail by detail.' },
            { id: 'map', title: 'Map of time', text: 'Civilizations appear on the map as the years go by.' },
        ],
    },
    ru: {
        title: 'Механики для рассказа об истории искусства',
        lead: 'Интерактивные элементы, которые можно встроить в любую страницу: карточки, сворачивающиеся в узлы, экскурсия по картине, карта времени.',
        language: 'Язык',
        sections: [
            { id: 'nodes', title: 'Ноды', text: 'Карточки сворачиваются в узлы. Позже узлы свяжутся нитями влияния.' },
            { id: 'story', title: 'Взгляд на картину', text: 'Экскурсия по одной картине — деталь за деталью.' },
            { id: 'map', title: 'Карта времени', text: 'Цивилизации появляются на карте по мере того, как идут годы.' },
        ],
    },
}

const copy = computed(() => copies[locale.value])

useHead({ htmlAttrs: { lang: locale } })
</script>

<style scoped>
.page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 64px 24px 96px;
}

.page__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 40px;
    border-bottom: 1px solid var(--aw-color-line);
}

.page__brand,
.page__index {
    margin: 0;
    color: var(--aw-color-gold);
    font-size: var(--aw-text-xs);
    font-weight: 500;
    letter-spacing: var(--aw-label-tracking);
    text-transform: uppercase;
}

.page__title {
    max-width: 16ch;
    margin: 16px 0 0;
    font-family: var(--aw-font-serif);
    font-size: clamp(38px, 6vw, 64px);
    font-weight: 500;
    line-height: 1;
    text-wrap: balance;
}

.page__lead {
    max-width: 56ch;
    margin: 20px 0 0;
    color: var(--aw-color-text-muted);
    font-size: 17px;
    line-height: 1.6;
}

.page__lang {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: var(--aw-radius-pill);
    box-shadow: 0 0 0 1px var(--aw-color-line);
}

.page__lang-link {
    padding: 6px 12px;
    border-radius: var(--aw-radius-pill);
    color: var(--aw-color-text-subtle);
    font-size: var(--aw-text-xs);
    font-weight: 500;
    letter-spacing: var(--aw-label-tracking);
    text-decoration: none;
    text-transform: uppercase;
    transition: color var(--aw-duration-fast) var(--aw-ease), background-color var(--aw-duration-fast) var(--aw-ease);
}

.page__lang-link:hover {
    color: var(--aw-color-text);
}

.page__lang-link--current {
    background-color: var(--aw-color-gold);
    color: var(--aw-color-ink);
}

.page__lang-link--current:hover {
    color: var(--aw-color-ink);
}

.page__lang-link:focus-visible {
    outline: none;
    box-shadow: var(--aw-focus-ring);
}

.page__section {
    margin-top: 72px;
}

.page__section-head {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    column-gap: 16px;
    align-items: baseline;
    margin-bottom: 28px;
}

.page__section-title {
    margin: 0;
    font-family: var(--aw-font-serif);
    font-size: 34px;
    font-weight: 500;
    line-height: 1.1;
}

.page__section-text {
    grid-column: 2;
    max-width: 60ch;
    margin: 8px 0 0;
    color: var(--aw-color-text-muted);
    font-size: var(--aw-text-md);
    line-height: 1.6;
}

/* Fixed height keeps the page still when cards fold into nodes. */
.page__nodes {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 24px;
    min-height: 360px;
}

@media (max-width: 640px) {
    .page {
        padding: 32px 16px 64px;
    }

    .page__header {
        flex-direction: column-reverse;
        padding-bottom: 28px;
    }

    .page__section {
        margin-top: 56px;
    }

    .page__section-head {
        grid-template-columns: minmax(0, 1fr);
    }

    .page__section-title,
    .page__section-text {
        grid-column: 1;
    }

    .page__section-title {
        margin-top: 8px;
        font-size: 28px;
    }

    .page__nodes {
        justify-content: center;
    }
}
</style>
