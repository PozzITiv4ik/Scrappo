(() => {
  const SOUND_PATH = "sounds/pressing_buttons.mp3";
  const clickSound = new Audio(SOUND_PATH);
  clickSound.preload = "auto";
  clickSound.volume = 0.7;

  const playClick = () => {
    clickSound.currentTime = 0;
    const playResult = clickSound.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  };

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
    playClick
  };
})();
