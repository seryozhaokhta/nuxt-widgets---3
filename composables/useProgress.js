// composables/useProgress.js
import { ref } from "vue";

export default function useProgress({ durationMs, onProgressComplete }) {
  const progress = ref(0);
  const isPaused = ref(false);
  let progressInterval = null;

  const PROGRESS_INTERVAL_MS = 100;

  const startProgress = () => {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      progress.value += (PROGRESS_INTERVAL_MS / durationMs) * 100;
      if (progress.value >= 100) {
        progress.value = 0;
        onProgressComplete();
      }
    }, PROGRESS_INTERVAL_MS);
  };

  const stopProgress = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  };

  const togglePause = () => {
    if (isPaused.value) {
      startProgress();
    } else {
      stopProgress();
    }
    isPaused.value = !isPaused.value;
  };

  const restartProgress = () => {
    stopProgress();
    progress.value = 0;
    isPaused.value = false;
    startProgress();
  };

  const resetProgress = () => {
    progress.value = 0;
  };

  return {
    progress,
    isPaused,
    startProgress,
    stopProgress,
    togglePause,
    restartProgress,
    resetProgress,
  };
}
