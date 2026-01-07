import { registry } from "../../core/registry.js";
import { internal } from "./internal.js";

const { state } = internal;

const getCharacterMods = () => {
  const characterApi = registry.get("character");
  if (characterApi && typeof characterApi.getCombatModifiers === "function") {
    return characterApi.getCombatModifiers();
  }
  return {};
};

const applyWeaponModifiers = (weapon) => {
  const abilityApi = internal.getAbilityApi();
  const characterMods = getCharacterMods();
  if (!abilityApi || typeof abilityApi.getCombatModifiers !== "function") {
    const damagePct = typeof characterMods.damagePct === "number" ? characterMods.damagePct : 0;
    const fireRatePct = typeof characterMods.fireRatePct === "number" ? characterMods.fireRatePct : 0;
    const damageFlat = typeof characterMods.damageFlat === "number" ? characterMods.damageFlat : 0;
    const damage = Math.max(1, Math.round((weapon.damage + damageFlat) * (1 + damagePct)));
    const fireRate = Math.max(0.1, weapon.fireRate * (1 + fireRatePct));
    return { ...weapon, damage, fireRate };
  }
  const mods = abilityApi.getCombatModifiers();
  const damageMultiplier = typeof mods.damageMultiplier === "number" ? mods.damageMultiplier : 1;
  const fireRateMultiplier = typeof mods.fireRateMultiplier === "number" ? mods.fireRateMultiplier : 1;
  const damageFlat = typeof mods.damageFlat === "number" ? mods.damageFlat : 0;
  const damagePct = typeof characterMods.damagePct === "number" ? characterMods.damagePct : 0;
  const fireRatePct = typeof characterMods.fireRatePct === "number" ? characterMods.fireRatePct : 0;
  const charDamageFlat = typeof characterMods.damageFlat === "number" ? characterMods.damageFlat : 0;
  const damage = Math.max(
    1,
    Math.round((weapon.damage + damageFlat + charDamageFlat) * damageMultiplier * (1 + damagePct))
  );
  const fireRate = Math.max(0.1, weapon.fireRate * fireRateMultiplier * (1 + fireRatePct));
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
