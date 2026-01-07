import { registry } from "../../core/registry.js";
import { WEAPONS } from "../../data/weapons.js";

const SLOT_COUNT = 4;
const weaponSlots = new Array(SLOT_COUNT).fill(null);
weaponSlots[0] = "pistol";
const handSlots = { right: 0, left: 1, "right-2": 2, "left-2": 3 };
const hands = ["right", "left", "right-2", "left-2"];

const state = {
  weaponSlots,
  handSlots,
  hands,
  lastShotAt: { right: 0, left: 0, "right-2": 0, "left-2": 0 },
  lastTick: 0,
  running: false,
  rafId: null,
  bulletId: 0,
  bullets: new Map()
};

const dom = {
  world: null,
  player: null,
  weaponEls: {}
};

const getWeaponData = () => WEAPONS;
const getAbilityApi = () => registry.get("ability");
const getMapApi = () => registry.get("map");
const getSoundApi = () => registry.get("sound");

const getWorldElement = () => dom.world || (dom.world = document.querySelector("[data-world]"));
const getPlayerElement = () => dom.player || (dom.player = document.querySelector("[data-player]"));
const getWeaponElement = (hand) => {
  if (!hand) {
    return null;
  }
  if (!dom.weaponEls[hand]) {
    dom.weaponEls[hand] = document.querySelector(`[data-weapon="${hand}"]`);
  }
  return dom.weaponEls[hand];
};

export const internal = {
  SLOT_COUNT,
  state,
  dom,
  getWeaponData,
  getAbilityApi,
  getMapApi,
  getSoundApi,
  getWorldElement,
  getPlayerElement,
  getWeaponElement,
  modifiers: null,
  aim: null,
  bullets: null,
  targeting: null,
  sprites: null,
  loop: null
};
