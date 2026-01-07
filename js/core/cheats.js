import { registry } from "./registry.js";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const addGold = (amount = 1000) => {
  const mapApi = registry.get("map");
  if (!mapApi || typeof mapApi.grantPlayerGold !== "function") {
    return { ok: false, reason: "map-unavailable" };
  }
  const value = Math.max(0, Math.round(toNumber(amount, 0)));
  if (!value) {
    return { ok: false, reason: "invalid-amount" };
  }
  mapApi.grantPlayerGold(value);
  const total = typeof mapApi.getPlayerGold === "function" ? mapApi.getPlayerGold() : null;
  return { ok: true, amount: value, total };
};

export const cheats = {
  gold: addGold
};

registry.set("cheats", cheats);
const SCRAPPO = window.SCRAPPO || (window.SCRAPPO = {});
SCRAPPO.cheats = cheats;
window.SCRAPPO_CHEATS = cheats;
