<!-- components/FocusDescription.vue -->
<template>
    <div class="focus-image__description" :style="descriptionPosition" aria-live="polite">
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
    </div>
</template>

<script setup>
const props = defineProps({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    descriptionPosition: {
        type: Object,
        required: true,
    },
});
</script>

<style scoped>
.focus-image__description {
    position: absolute;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(5px);
    color: white;
    padding: 10px;
    border-radius: 8px;
    max-width: 250px;
    text-align: left;
}

@media screen and (max-width: 768px) {
    .focus-image__description {
        position: static;
        margin-top: 10px;
        left: auto;
        right: auto;
        top: auto;
        bottom: auto;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: none;
        max-width: 100%;
        width: 100%;
        box-sizing: border-box;
    }
}
</style>
