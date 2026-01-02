(() => {
  const internal = window.SCRAPPO_WEAPON_INTERNAL;
  if (!internal) {
    return;
  }

  const { state } = internal;

  const shoot = (hand, weapon, target, now) => {
    if (internal.bullets.createBullet(hand, weapon, target)) {
      const soundApi = internal.getSoundApi();
      if (soundApi && typeof soundApi.playShot === "function") {
        soundApi.playShot();
      }
      state.lastShotAt[hand] = now;
    }
  };

  const tick = (now) => {
    if (!state.running) {
      state.rafId = null;
      return;
    }

    const delta = Math.min(0.05, (now - state.lastTick) / 1000);
    state.lastTick = now;

    state.hands.forEach((hand) => {
      const weapon = internal.modifiers.getWeaponForHand(hand);
      if (!weapon) {
        internal.aim.aimWeapon(hand, null);
        return;
      }

      const target = internal.targeting.findTarget(weapon);
      internal.aim.aimWeapon(hand, target);

      const cooldown = 1000 / weapon.fireRate;
      if (target && now - state.lastShotAt[hand] >= cooldown) {
        shoot(hand, weapon, target, now);
      }
    });

    internal.bullets.updateBullets(delta);
    state.rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (state.running) {
      return;
    }
    state.running = true;
    const now = performance.now();
    state.lastShotAt = { right: now, left: now };
    state.lastTick = now;
    internal.bullets.clearBullets();
    internal.sprites.updateWeaponSprite();
    state.rafId = requestAnimationFrame(tick);
  };

  const pause = () => {
    if (!state.running) {
      return;
    }
    state.running = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
    state.rafId = null;
  };

  const resume = () => {
    if (state.running) {
      return;
    }
    state.running = true;
    state.lastTick = performance.now();
    if (!state.rafId) {
      state.rafId = requestAnimationFrame(tick);
    }
  };

  const stop = () => {
    pause();
    internal.bullets.clearBullets();
  };

  internal.loop = {
    start,
    pause,
    resume,
    stop
  };
})();
