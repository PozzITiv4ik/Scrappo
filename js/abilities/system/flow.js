(() => {
  const internal = window.SCRAPPO_ABILITY_INTERNAL;
  if (!internal) {
    return;
  }

  const { state, dom } = internal;

  const pauseGame = (showPauseOverlay = true) => {
    const mapApi = internal.getMapApi();
    const waveApi = internal.getWaveApi();
    const weaponApi = internal.getWeaponApi();
    if (mapApi && typeof mapApi.pause === "function") {
      mapApi.pause();
    }
    if (waveApi && typeof waveApi.pause === "function") {
      waveApi.pause();
    }
    if (weaponApi && typeof weaponApi.pause === "function") {
      weaponApi.pause();
    }
    if (showPauseOverlay) {
      internal.ui.openPauseMenu();
    }
  };

  const resumeGame = () => {
    const mapApi = internal.getMapApi();
    const waveApi = internal.getWaveApi();
    const weaponApi = internal.getWeaponApi();
    if (mapApi && typeof mapApi.resume === "function") {
      mapApi.resume();
    }
    if (waveApi && typeof waveApi.resume === "function") {
      waveApi.resume();
    }
    if (weaponApi && typeof weaponApi.resume === "function") {
      weaponApi.resume();
    }
    internal.ui.closeAllOverlays();
    state.flowState = "playing";
  };

  const startNextWave = () => {
    if (!state.hasNextWave) {
      const ui = internal.getUiApi();
      if (ui && typeof ui.showPanel === "function") {
        ui.showPanel("main");
      }
      return;
    }
    const mapApi = internal.getMapApi();
    const waveApi = internal.getWaveApi();
    const weaponApi = internal.getWeaponApi();
    if (mapApi && typeof mapApi.prepareNextWave === "function") {
      mapApi.prepareNextWave();
    }
    if (waveApi && typeof waveApi.startNextWave === "function") {
      waveApi.startNextWave();
    }
    if (mapApi && typeof mapApi.resume === "function") {
      mapApi.resume();
    }
    if (weaponApi && typeof weaponApi.resume === "function") {
      weaponApi.resume();
    }
    internal.ui.closeAllOverlays();
    state.flowState = "playing";
  };

  const handleAbilityPick = (abilityId) => {
    internal.modifiers.addToInventory(abilityId);
    state.pendingSelections = Math.max(0, state.pendingSelections - 1);
    if (state.pendingSelections > 0) {
      internal.ui.openAbilitySelection();
    } else {
      internal.ui.openInventory("wave");
    }
  };

  const handleWaveComplete = ({ waveIndex, hasNext }) => {
    state.activeWave = waveIndex || 1;
    state.hasNextWave = hasNext;
    state.flowState = "wave-end";
    const shopApi = window.SCRAPPO_WEAPON_SHOP;
    if (shopApi && typeof shopApi.prepareForWave === "function") {
      shopApi.prepareForWave(state.activeWave);
    }
    pauseGame(false);
    if (state.pendingSelections > 0) {
      internal.ui.openAbilitySelection();
    } else {
      internal.ui.openInventory("wave");
    }
  };

  const onLevelUp = () => {
    state.pendingSelections += 1;
  };

  const resetForNewRun = () => {
    const playerApi = internal.getPlayerApi();
    const shopApi = window.SCRAPPO_WEAPON_SHOP;
    internal.modifiers.clearInventory();
    state.pendingSelections = 0;
    state.flowState = "playing";
    internal.ui.closeAllOverlays();
    if (shopApi && typeof shopApi.reset === "function") {
      shopApi.reset();
    }
    if (playerApi && typeof playerApi.resetState === "function") {
      playerApi.resetState();
    }
    internal.modifiers.applyPlayerStats();
    internal.ui.renderInventory();
  };

  const handleEsc = () => {
    if (!internal.ui.isGameActive()) {
      return;
    }
    if (internal.ui.isOverlayOpen(dom.overlayAbilities)) {
      return;
    }
    if (state.flowState === "wave-end") {
      return;
    }
    if (internal.ui.isOverlayOpen(dom.overlayInventory)) {
      internal.ui.openPauseMenu();
      return;
    }
    if (internal.ui.isOverlayOpen(dom.overlayPause)) {
      resumeGame();
      return;
    }
    state.flowState = "pause";
    pauseGame(true);
  };

  internal.flow = {
    pauseGame,
    resumeGame,
    startNextWave,
    handleAbilityPick,
    handleWaveComplete,
    onLevelUp,
    resetForNewRun,
    handleEsc
  };
})();
