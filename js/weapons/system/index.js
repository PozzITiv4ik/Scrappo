(() => {
  const internal = window.SCRAPPO_WEAPON_INTERNAL;
  if (!internal) {
    return;
  }

  const { state, SLOT_COUNT } = internal;

  const setActiveSlot = (index) => {
    if (index >= 0 && index < SLOT_COUNT) {
      state.handSlots.right = index;
      internal.sprites.updateWeaponSprite();
    }
  };

  const setHandSlot = (hand, index) => {
    if (state.handSlots[hand] !== undefined && index >= 0 && index < SLOT_COUNT) {
      state.handSlots[hand] = index;
      internal.sprites.updateWeaponSprite();
    }
  };

  window.SCRAPPO_WEAPON_SYSTEM = {
    start: internal.loop.start,
    pause: internal.loop.pause,
    resume: internal.loop.resume,
    stop: internal.loop.stop,
    getSlots: () => state.weaponSlots.slice(),
    setActiveSlot,
    setHandSlot
  };
})();
