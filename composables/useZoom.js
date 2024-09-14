// composables/useZoom.js
import { ref } from "vue";

export default function useZoom(imageRef) {
  const translate = ref({ x: 0, y: 0 });
  const scaleValue = ref(1);
  const isZoomedIn = ref(false);

  const zoomToFocusPoint = (coordinates) => {
    const img = imageRef.value;
    if (img) {
      const containerRect = img.getBoundingClientRect();

      const scale = 2; // Zoom factor

      // Calculate focus point position in pixels
      const focusX = (coordinates.x / 100) * containerRect.width;
      const focusY = (coordinates.y / 100) * containerRect.height;

      // Calculate maximum translation
      const maxTranslateX = (containerRect.width * (scale - 1)) / 2;
      const maxTranslateY = (containerRect.height * (scale - 1)) / 2;

      // Calculate translation
      let translateX = -((focusX - containerRect.width / 2) * (scale - 1));
      let translateY = -((focusY - containerRect.height / 2) * (scale - 1));

      // Limit translation to prevent overflow
      translateX = Math.max(
        -maxTranslateX,
        Math.min(maxTranslateX, translateX)
      );
      translateY = Math.max(
        -maxTranslateY,
        Math.min(maxTranslateY, translateY)
      );

      translate.value = {
        x: translateX,
        y: translateY,
      };
      scaleValue.value = scale;
      isZoomedIn.value = true;
    }
  };

  const resetZoom = () => {
    translate.value = { x: 0, y: 0 };
    scaleValue.value = 1;
    isZoomedIn.value = false;
  };

  return {
    translate,
    scaleValue,
    isZoomedIn,
    zoomToFocusPoint,
    resetZoom,
  };
}
