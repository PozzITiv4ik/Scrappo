(() => {
  const internal = window.SCRAPPO_WEAPON_INTERNAL;
  if (!internal) {
    return;
  }

  const { state } = internal;

  const applyWeaponModifiers = (weapon) => {
    const abilityApi = internal.getAbilityApi();
    if (!abilityApi || typeof abilityApi.getCombatModifiers !== "function") {
      return weapon;
    }
    const mods = abilityApi.getCombatModifiers();
    const damageMultiplier = typeof mods.damageMultiplier === "number" ? mods.damageMultiplier : 1;
    const fireRateMultiplier = typeof mods.fireRateMultiplier === "number" ? mods.fireRateMultiplier : 1;
    const damageFlat = typeof mods.damageFlat === "number" ? mods.damageFlat : 0;
    const damage = Math.max(1, Math.round((weapon.damage + damageFlat) * damageMultiplier));
    const fireRate = Math.max(0.1, weapon.fireRate * fireRateMultiplier);
    return { ...weapon, damage, fireRate };
  };

  const getWeaponForHand = (hand) => {
    if (state.handSlots[hand] === undefined) {
      return null;
    }
    const weapons = internal.getWeaponData();
    const weaponId = state.weaponSlots[state.handSlots[hand]];
    const weapon = weapons[weaponId];
    if (!weapon) {
      return null;
    }
    return applyWeaponModifiers(weapon);
  };

  internal.modifiers = {
    applyWeaponModifiers,
    getWeaponForHand
  };
})();
