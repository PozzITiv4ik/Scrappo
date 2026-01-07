import { CHARACTER_BASE } from "../data/characters.js";
import { registry } from "./registry.js";

const baseStats = CHARACTER_BASE.stats;
const config = { ...baseStats };

const getXpForLevel = (level) => Math.round(100 + (level - 1) * 40);

const state = {
  position: { x: 0, y: 0 },
  hp: config.maxHp,
  maxHp: config.maxHp,
  invulnerableUntil: 0,
  level: 1,
  xp: 0,
  xpToNext: getXpForLevel(1),
  pickupRadius: config.pickupRadius,
  collectRadius: config.collectRadius,
  gold: 0
};

const resetState = () => {
  state.hp = config.maxHp;
  state.maxHp = config.maxHp;
  state.invulnerableUntil = 0;
  state.level = 1;
  state.xp = 0;
  state.xpToNext = getXpForLevel(state.level);
  state.pickupRadius = config.pickupRadius;
  state.collectRadius = config.collectRadius;
  state.gold = 0;
  return state;
};

export const player = {
  config,
  state,
  getXpForLevel,
  resetState
};

registry.set("player", player);
const SCRAPPO = window.SCRAPPO || (window.SCRAPPO = {});
SCRAPPO.player = player;
window.SCRAPPO_PLAYER = player;
