import { registry } from "../../core/registry.js";
import { internal } from "./internal.js";
import "./world.js";
import "./mobs.js";
import "./drops.js";
import "./player.js";

const { config, playerConfig, playerPos, state } = internal;

const getKeyToken = (event) => {
  switch (event.code) {
    case "KeyW":
      return "w";
    case "KeyA":
      return "a";
    case "KeyS":
      return "s";
    case "KeyD":
      return "d";
    case "ArrowUp":
      return "arrowup";
    case "ArrowDown":
      return "arrowdown";
    case "ArrowLeft":
      return "arrowleft";
    case "ArrowRight":
      return "arrowright";
    default:
      break;
  }

  if (typeof event.key === "string") {
    const key = event.key.toLowerCase();
    if (key.startsWith("arrow")) {
      return key;
    }
    return key;
  }

  return "";
};

const handleKeyDown = (event) => {
  if (!state.active) {
    return;
  }

  const key = getKeyToken(event);
  if (!key) {
    return;
  }
  if (key.startsWith("arrow")) {
    event.preventDefault();
  }
  state.keys.add(key);
};

const handleKeyUp = (event) => {
  if (!state.active) {
    return;
  }

  const key = getKeyToken(event);
  if (!key) {
    return;
  }
  state.keys.delete(key);
};

const init = () => {
  if (state.initialized) {
    return;
  }

  state.frame = document.querySelector(".game-frame");
  state.world = document.querySelector("[data-world]");
  state.player = document.querySelector("[data-player]");
  state.hpBar = document.querySelector("[data-player-hp-bar]");
  state.hpText = document.querySelector("[data-player-hp-text]");
  state.xpBar = document.querySelector("[data-player-xp-bar]");
  state.xpText = document.querySelector("[data-player-xp-text]");
  state.goldText = document.querySelector("[data-player-gold-text]");

  if (!state.frame || !state.world || !state.player) {
    return;
  }

  state.player.style.width = `${playerConfig.size}px`;
  state.player.style.height = `${playerConfig.size}px`;
  state.player.style.setProperty("--player-size", `${playerConfig.size}px`);

  if (typeof internal.setupWorld === "function") {
    internal.setupWorld();
  }
  if (typeof internal.spawnItems === "function") {
    internal.spawnItems();
  }
  if (typeof internal.updateCamera === "function") {
    internal.updateCamera();
  }
  if (typeof internal.updatePlayerHealthUI === "function") {
    internal.updatePlayerHealthUI();
  }
  if (typeof internal.updatePlayerXpUI === "function") {
    internal.updatePlayerXpUI();
  }
  if (typeof internal.updatePlayerGoldUI === "function") {
    internal.updatePlayerGoldUI();
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", () => state.keys.clear());
  window.addEventListener("resize", () => {
    if (typeof internal.updateCamera === "function") {
      internal.updateCamera();
    }
  });

  state.initialized = true;
};

const tick = (timestamp) => {
  if (!state.active) {
    state.rafId = null;
    return;
  }

  const delta = Math.min(0.05, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;

  if (typeof internal.updateMovement === "function") {
    internal.updateMovement(delta);
  }
  if (typeof internal.updateMobs === "function") {
    internal.updateMobs(delta, timestamp);
  }
  if (typeof internal.updateExperienceDrops === "function") {
    internal.updateExperienceDrops(delta);
  }
  if (typeof internal.updateGoldDrops === "function") {
    internal.updateGoldDrops(delta);
  }
  if (typeof internal.updateCamera === "function") {
    internal.updateCamera();
  }

  state.rafId = window.requestAnimationFrame(tick);
};

const start = () => {
  init();
  if (!state.initialized) {
    return;
  }
  if (typeof internal.resetPlayerState === "function") {
    internal.resetPlayerState();
  }
  if (typeof internal.clearExperienceDrops === "function") {
    internal.clearExperienceDrops();
  }
  if (typeof internal.clearGoldDrops === "function") {
    internal.clearGoldDrops();
  }
  state.keys.clear();
  state.active = true;
  state.lastTime = performance.now();
  if (!state.rafId) {
    state.rafId = window.requestAnimationFrame(tick);
  }
};

const pause = () => {
  state.active = false;
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
  }
  state.rafId = null;
  state.keys.clear();
  if (state.player) {
    state.player.classList.remove("is-moving");
  }
};

const resume = () => {
  if (state.active) {
    return;
  }
  state.active = true;
  state.lastTime = performance.now();
  if (!state.rafId) {
    state.rafId = window.requestAnimationFrame(tick);
  }
};

const stop = () => {
  pause();
  if (typeof internal.clearExperienceDrops === "function") {
    internal.clearExperienceDrops();
  }
  if (typeof internal.clearGoldDrops === "function") {
    internal.clearGoldDrops();
  }
};

export const mapApi = {
  start,
  pause,
  resume,
  stop,
  prepareNextWave: internal.prepareNextWave,
  spawnMob: internal.spawnMob,
  clearMobs: internal.clearMobs,
  getMobTargets: internal.getMobTargets,
  applyDamage: internal.applyDamage,
  refreshPlayerHud: internal.refreshPlayerHud,
  grantPlayerGold: internal.grantPlayerGold,
  getPlayerGold: internal.getPlayerGold,
  spendPlayerGold: internal.spendPlayerGold,
  getPlayerPosition: () => ({ x: playerPos.x, y: playerPos.y }),
  getMapSize: () => config.mapSize,
  getPlayerSize: () => playerConfig.size,
  getZoom: () => config.zoom
};

registry.set("map", mapApi);
const SCRAPPO = window.SCRAPPO || (window.SCRAPPO = {});
SCRAPPO.map = mapApi;
window.SCRAPPO_MAP = mapApi;
