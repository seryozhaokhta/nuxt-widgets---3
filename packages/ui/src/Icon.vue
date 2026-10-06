<!-- Stroke icon painted with currentColor, so it follows the text color. -->
<template>
    <span class="icon" :style="style" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { icons, type IconName } from './icons'

const props = defineProps<{ name: IconName }>()

const style = computed(() => ({ '--icon-url': 'url("' + icons[props.name] + '")' }))
</script>

<style scoped>
.icon {
    display: inline-block;
    flex: none;
    width: var(--icon-size, 20px);
    height: var(--icon-size, 20px);
    background-color: currentColor;
    -webkit-mask: var(--icon-url) center / contain no-repeat;
    mask: var(--icon-url) center / contain no-repeat;
}
</style>
