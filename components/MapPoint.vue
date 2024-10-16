<!-- components/MapPoint.vue -->

<template>
    <div ref="pointElement" :style="containerStyle" @click="onClick" :data-id="point.id" v-if="shouldRender"
        tabindex="0" @keydown.enter="onClick">
        <div class="map-point">
            <span class="map-point-label">{{ point.name }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import gsap from 'gsap';

const props = defineProps({
    point: {
        type: Object,
        required: true,
    },
    currentYear: {
        type: Number,
        required: true,
    },
    zoomScale: {
        type: Number,
        required: true,
    },
});

const emits = defineEmits(['selectPoint']);

const isVisible = computed(() => props.point.year <= props.currentYear);

const containerStyle = computed(() => ({
    position: 'absolute',
    left: `${props.point.x}%`,
    top: `${props.point.y}%`,
    transform: `translate(-50%, -50%) scale(${1 / props.zoomScale})`,
    transformOrigin: 'center',
}));

function onClick() {
    emits('selectPoint', props.point);
}

const pointElement = ref(null);
const shouldRender = ref(false);

onMounted(() => {
    if (isVisible.value) {
        shouldRender.value = true;
        nextTick(() => {
            gsap.fromTo(
                pointElement.value,
                { opacity: 0, scale: 0 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    ease: 'power1.out',
                }
            );
        });
    }
});

watch(isVisible, (newVal, oldVal) => {
    if (newVal && !oldVal) {
        shouldRender.value = true;
        nextTick(() => {
            gsap.fromTo(
                pointElement.value,
                { opacity: 0, scale: 0 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    ease: 'power1.out',
                }
            );
        });
    } else if (!newVal && oldVal) {
        gsap.to(pointElement.value, {
            opacity: 0,
            scale: 0,
            duration: 0.5,
            ease: 'power1.in',
            onComplete() {
                shouldRender.value = false;
            },
        });
    }
});
</script>

<style scoped>
.map-point {
    background-color: #ff9800;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.map-point-label {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 14px;
    color: #fff;
    text-shadow: 1px 1px 2px #000;
    white-space: nowrap;
}
</style>
