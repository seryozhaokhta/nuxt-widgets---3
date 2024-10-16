<!-- pages/index.vue -->

<template>
    <div class="widget-container">
        <!-- Upper container for square widgets -->
        <div class="upper-container">
            <component :is="getWidgetComponent(widget.type)" v-for="(widget, index) in upperWidgets" :key="index"
                :data="widget" />
        </div>

        <!-- Middle container for the focus-image widget -->
        <div class="middle-container">
            <component :is="getWidgetComponent(widget.type)" v-for="(widget, index) in middleWidgets" :key="index"
                :data="widget" />
        </div>

        <!-- Lower container for the map widget -->
        <div class="lower-container">
            <component :is="getWidgetComponent(widget.type)" v-for="(widget, index) in lowerWidgets" :key="index"
                :data="widget" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import WidgetView from '~/components/WidgetView.vue';
import FocusImageView from '~/components/FocusImageView.vue';
import MapWidget from '~/components/MapWidget.vue';

const widgets = ref([]);

const upperWidgets = computed(() => widgets.value.filter((widget) => widget.type === 'image'));

const middleWidgets = computed(() => widgets.value.filter((widget) => widget.type === 'focus-image'));

const lowerWidgets = computed(() => widgets.value.filter((widget) => widget.type === 'map'));

onMounted(async () => {
    try {
        const response = await fetch('/data/widgets.json');
        if (!response.ok) {
            throw new Error('Failed to fetch widgets');
        }
        widgets.value = await response.json();
    } catch (error) {
        console.error(error.message);
    }
});

const getWidgetComponent = (type) => {
    if (type === 'image') return WidgetView;
    if (type === 'focus-image') return FocusImageView;
    if (type === 'map') return MapWidget;
    return WidgetView; // default
};
</script>

<style scoped>
@import '../css/main.css';

/* Upper container for square widgets */
.upper-container {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-direction: row;
    margin-bottom: 20px;
}

/* Middle container for focus-image widget */
.middle-container {
    display: flex;
    justify-content: center;
    flex-direction: row;
    border-radius: var(--border-radius);
    width: 70%;
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    margin-bottom: 20px;
}

/* Lower container for the map widget */
.lower-container {
    display: flex;
    justify-content: center;
    flex-direction: row;
    border-radius: var(--border-radius);
    width: 100%;
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.8);
}
</style>
