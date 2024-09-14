// composables/useFocusPoints.js
import { ref, computed } from "vue";

export default function useFocusPoints(focusPoints) {
  const currentFocusIndex = ref(0);

  const currentFocusPoint = computed(
    () => focusPoints[currentFocusIndex.value]
  );

  const setFocusPoint = (index) => {
    currentFocusIndex.value = index;
  };

  const nextFocusPoint = () => {
    setFocusPoint((currentFocusIndex.value + 1) % focusPoints.length);
  };

  const previousFocusPoint = () => {
    setFocusPoint(
      (currentFocusIndex.value - 1 + focusPoints.length) % focusPoints.length
    );
  };

  return {
    currentFocusIndex,
    currentFocusPoint,
    setFocusPoint,
    nextFocusPoint,
    previousFocusPoint,
  };
}
