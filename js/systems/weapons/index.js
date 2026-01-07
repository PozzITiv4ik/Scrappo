import { registry } from "../../core/registry.js";
import { internal } from "./internal.js";
import "./modifiers.js";
import "./aim.js";
import "./bullets.js";
import "./targeting.js";
import "./sprites.js";
import "./loop.js";
import "./shop.js";

const { state, SLOT_COUNT } = internal;

const hasWeapon = (weaponId) => state.weaponSlots.includes(weaponId);
const hasEmptySlot = () => state.weaponSlots.some((slot) => !slot);

const addWeapon = (weaponId) => {
  if (!weaponId) {
    return { ok: false, reason: "invalid" };
  }
  const weapons = internal.getWeaponData();
  if (!weapons[weaponId]) {
    return { ok: false, reason: "missing" };
  }
  if (hasWeapon(weaponId)) {
    return { ok: false, reason: "owned" };
  }
  const emptySlot = state.weaponSlots.findIndex((slot) => !slot);
  if (emptySlot === -1) {
    return { ok: false, reason: "slots-full" };
  }
  state.weaponSlots[emptySlot] = weaponId;
  internal.sprites.updateWeaponSprite();
  return { ok: true, slotIndex: emptySlot };
};

const getSlotCount = () => SLOT_COUNT;

const removeWeapon = (index) => {
  if (index < 0 || index >= SLOT_COUNT) {
    return null;
  }
  const removed = state.weaponSlots[index];
  if (!removed) {
    return null;
  }
  state.weaponSlots[index] = null;
  internal.sprites.updateWeaponSprite();
  return removed;
};

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

export const weaponSystem = {
  start: internal.loop.start,
  pause: internal.loop.pause,
  resume: internal.loop.resume,
  stop: internal.loop.stop,
  getSlots: () => state.weaponSlots.slice(),
  getSlotCount,
  addWeapon,
  removeWeapon,
  hasWeapon,
  hasEmptySlot,
  setActiveSlot,
  setHandSlot
};

registry.set("weapon", weaponSystem);
const SCRAPPO = window.SCRAPPO || (window.SCRAPPO = {});
SCRAPPO.weaponSystem = weaponSystem;
window.SCRAPPO_WEAPON_SYSTEM = weaponSystem;
