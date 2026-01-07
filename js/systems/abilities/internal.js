import { registry } from "../../core/registry.js";
import { ABILITIES } from "../../data/abilities.js";

const abilities = Array.isArray(ABILITIES) ? ABILITIES : [];
const abilityById = new Map(abilities.map((ability) => [ability.id, ability]));
const rarityWeightsByWave = {
  1: { common: 1, rare: 0 },
  2: { common: 0.95, rare: 0.05 }
};

const state = {
  pendingSelections: 0,
  flowState: "playing",
  activeWave: 1,
  hasNextWave: true,
  modifiersCache: null,
  inventory: new Map()
};

const dom = {
  overlayAbilities: null,
  overlayInventory: null,
  overlayPause: null,
  abilityChoicesEl: null,
  abilitiesSubtitleEl: null,
  inventoryWeaponsEl: null,
  inventoryAbilitiesEl: null,
  inventoryStatsEl: null,
  inventoryContinueBtn: null,
  inventoryCloseBtn: null,
  shopCard: null,
  shopGrid: null,
  shopSubtitleEl: null,
  shopGoldText: null
};

const getPlayerApi = () => registry.get("player");
const getMapApi = () => registry.get("map");
const getWaveApi = () => registry.get("wave");
const getWeaponApi = () => registry.get("weapon");
const getUiApi = () => registry.get("ui");
const getShopApi = () => registry.get("weaponShop");

export const internal = {
  abilities,
  abilityById,
  rarityWeightsByWave,
  state,
  dom,
  getPlayerApi,
  getMapApi,
  getWaveApi,
  getWeaponApi,
  getUiApi,
  getShopApi,
  i18n: null,
  modifiers: null,
  ui: null,
  flow: null
};
