import { registry } from "../../core/registry.js";
import { WEAPONS } from "../../data/weapons.js";

const SHOP_SLOTS = 3;
const SELL_RATIO = 0.5;
const PRICE_BY_RARITY = {
  common: 40,
  uncommon: 70,
  rare: 110,
  epic: 160,
  legendary: 220
};

const state = {
  wave: 0,
  offers: []
};

const getCatalog = () => Object.values(WEAPONS).filter((weapon) => weapon && weapon.shop !== false);

const getPrice = (weapon) => {
  if (!weapon) {
    return 0;
  }
  if (typeof weapon.price === "number" && Number.isFinite(weapon.price)) {
    return Math.max(0, Math.round(weapon.price));
  }
  const rarity = weapon.rarity || "common";
  return PRICE_BY_RARITY[rarity] || 50;
};

const getSellPrice = (weapon) => Math.max(0, Math.round(getPrice(weapon) * SELL_RATIO));

const getWeaponText = (weapon, field) => {
  if (!weapon || !field) {
    return "";
  }
  const value = weapon[field];
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    const lang = document.documentElement.lang || "en";
    return value[lang] || value.en || "";
  }
  return "";
};

const pickOffers = () => {
  const pool = getCatalog();
  if (!pool.length) {
    return [];
  }
  const offers = [];
  const used = new Set();
  const count = Math.min(SHOP_SLOTS, pool.length);
  for (let i = 0; i < count; i += 1) {
    let pick = null;
    let attempts = 0;
    while (!pick && attempts < 12) {
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (candidate && !used.has(candidate.id)) {
        pick = candidate;
        break;
      }
      attempts += 1;
    }
    if (!pick) {
      pick = pool.find((weapon) => weapon && !used.has(weapon.id));
    }
    if (!pick) {
      break;
    }
    used.add(pick.id);
    offers.push({ id: pick.id, weapon: pick, price: getPrice(pick) });
  }
  return offers;
};

const prepareForWave = (waveIndex) => {
  const nextWave = Number.isFinite(waveIndex) ? waveIndex : 1;
  if (state.wave === nextWave && state.offers.length) {
    return;
  }
  state.wave = nextWave;
  state.offers = pickOffers();
};

const getOffers = () => state.offers.slice();

const purchase = (weaponId) => {
  if (!weaponId) {
    return { ok: false, reason: "invalid" };
  }
  const weaponApi = registry.get("weapon");
  if (!weaponApi || typeof weaponApi.addWeapon !== "function") {
    return { ok: false, reason: "unavailable" };
  }
  const offer = state.offers.find((entry) => entry.id === weaponId);
  if (!offer || !offer.weapon) {
    return { ok: false, reason: "not-found" };
  }
  if (weaponApi.hasWeapon && weaponApi.hasWeapon(weaponId)) {
    return { ok: false, reason: "owned" };
  }
  if (weaponApi.hasEmptySlot && !weaponApi.hasEmptySlot()) {
    return { ok: false, reason: "slots-full" };
  }
  const mapApi = registry.get("map");
  if (!mapApi || typeof mapApi.spendPlayerGold !== "function") {
    return { ok: false, reason: "gold-unavailable" };
  }
  const price = offer.price;
  if (!mapApi.spendPlayerGold(price)) {
    return { ok: false, reason: "not-enough-gold" };
  }
  const result = weaponApi.addWeapon(weaponId);
  if (!result || !result.ok) {
    return { ok: false, reason: result?.reason || "equip-failed" };
  }
  return { ok: true };
};

const reset = () => {
  state.wave = 0;
  state.offers = [];
};

export const weaponShop = {
  prepareForWave,
  getOffers,
  purchase,
  getWeaponText,
  getPrice,
  getSellPrice,
  reset
};

registry.set("weaponShop", weaponShop);
const SCRAPPO = window.SCRAPPO || (window.SCRAPPO = {});
SCRAPPO.weaponShop = weaponShop;
window.SCRAPPO_WEAPON_SHOP = weaponShop;
