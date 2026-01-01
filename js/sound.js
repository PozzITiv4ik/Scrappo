(() => {
  const SOUND_PATH = "sounds/pressing_buttons.mp3";
  const HIT_PATH = "sounds/damage_to_mob.mp3";
  const PLAYER_HIT_PATH = "sounds/damage_to_main_character.mp3";
  const STORAGE_KEY = "scrappo.volume";
  const clickSound = new Audio(SOUND_PATH);
  const hitSound = new Audio(HIT_PATH);
  const playerHitSound = new Audio(PLAYER_HIT_PATH);
  clickSound.preload = "auto";
  hitSound.preload = "auto";
  playerHitSound.preload = "auto";

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setVolume = (value) => {
    const next = clamp(value, 0, 1);
    clickSound.volume = next;
    hitSound.volume = next;
    playerHitSound.volume = next;
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

  const playHit = () => {
    hitSound.currentTime = 0;
    const playResult = hitSound.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  };

  const playPlayerHit = () => {
    playerHitSound.currentTime = 0;
    const playResult = playerHitSound.play();
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
    playHit,
    playPlayerHit,
    getVolume,
    setVolume
  };
})();
