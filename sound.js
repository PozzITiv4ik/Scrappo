(() => {
  const SOUND_PATH = "sounds/pressing_buttons.mp3";
  const STORAGE_KEY = "scrappo.volume";
  const clickSound = new Audio(SOUND_PATH);
  clickSound.preload = "auto";

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setVolume = (value) => {
    const next = clamp(value, 0, 1);
    clickSound.volume = next;
    localStorage.setItem(STORAGE_KEY, String(next));
    return next;
  };

  const getVolume = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = Number.parseFloat(stored);
    if (Number.isNaN(parsed)) {
      return 0.7;
    }
    return clamp(parsed, 0, 1);
  };

  const playClick = () => {
    clickSound.currentTime = 0;
    const playResult = clickSound.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  };

  setVolume(getVolume());

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }

    if (button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true") {
      return;
    }

    playClick();
  });

  window.SCRAPPO_SOUND = {
    playClick,
    getVolume,
    setVolume
  };
})();
