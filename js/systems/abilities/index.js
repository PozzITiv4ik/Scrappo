import { registry } from "../../core/registry.js";
import { internal } from "./internal.js";
import "./i18n.js";
import "./modifiers.js";
import "./ui.js";
import "./flow.js";

const { dom, state } = internal;

dom.overlayAbilities = document.querySelector('[data-overlay="abilities"]');
dom.overlayInventory = document.querySelector('[data-overlay="inventory"]');
dom.overlayPause = document.querySelector('[data-overlay="pause"]');
dom.abilityChoicesEl = document.querySelector("[data-ability-choices]");
dom.abilitiesSubtitleEl = document.querySelector("[data-abilities-subtitle]");
dom.inventoryWeaponsEl = document.querySelector("[data-inventory-weapons]");
dom.inventoryAbilitiesEl = document.querySelector("[data-inventory-abilities]");
dom.inventoryStatsEl = document.querySelector("[data-inventory-stats]");
dom.inventoryContinueBtn = document.querySelector('[data-action="inventory-continue"]');
dom.inventoryCloseBtn = document.querySelector('[data-action="inventory-close"]');
dom.shopCard = document.querySelector("[data-shop-card]");
dom.shopGrid = document.querySelector("[data-shop-grid]");
dom.shopSubtitleEl = document.querySelector("[data-shop-subtitle]");
dom.shopGoldText = document.querySelector("[data-shop-gold-text]");

document.addEventListener("click", (event) => {
  const abilityCard = event.target.closest(".ability-card");
  if (abilityCard && abilityCard.dataset.abilityId) {
    internal.flow.handleAbilityPick(abilityCard.dataset.abilityId);
    return;
  }
  const shopButton = event.target.closest("[data-shop-buy]");
  if (shopButton && shopButton.dataset.weaponId) {
    internal.ui.handleShopPurchase(shopButton.dataset.weaponId);
    return;
  }
  const sellButton = event.target.closest("[data-weapon-sell]");
  if (sellButton && sellButton.dataset.slotIndex) {
    internal.ui.handleWeaponSell(Number(sellButton.dataset.slotIndex));
    return;
  }
  const action = event.target.closest("[data-action]");
  if (!action) {
    return;
  }
  const name = action.dataset.action;
  if (name === "pause-resume") {
    internal.flow.resumeGame();
  } else if (name === "pause-inventory") {
    internal.ui.openInventory("pause");
  } else if (name === "pause-exit") {
    const ui = internal.getUiApi();
    if (ui && typeof ui.showPanel === "function") {
      ui.showPanel("main");
    }
  } else if (name === "inventory-continue") {
    const mode = dom.inventoryContinueBtn?.dataset.mode || "pause";
    if (mode === "wave") {
      internal.flow.startNextWave();
    } else {
      internal.flow.resumeGame();
    }
  } else if (name === "inventory-close") {
    if (state.flowState === "pause") {
      internal.ui.openPauseMenu();
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (!internal.ui.isGameActive()) {
    return;
  }
  event.preventDefault();
  internal.flow.handleEsc();
});

internal.ui.refreshTexts();

export const abilitySystem = {
  onLevelUp: internal.flow.onLevelUp,
  handleWaveComplete: internal.flow.handleWaveComplete,
  resetForNewRun: internal.flow.resetForNewRun,
  refreshTexts: internal.ui.refreshTexts,
  closeOverlays: internal.ui.closeAllOverlays,
  getPlayerStats: internal.modifiers.getPlayerStats,
  getCombatModifiers: internal.modifiers.getCombatModifiers,
  applyPlayerStats: internal.modifiers.applyPlayerStats,
  addToInventory: internal.modifiers.addToInventory,
  getInventory: () => new Map(state.inventory),
  isPaused: () => state.flowState !== "playing"
};

registry.set("ability", abilitySystem);
const SCRAPPO = window.SCRAPPO || (window.SCRAPPO = {});
SCRAPPO.abilitySystem = abilitySystem;
window.SCRAPPO_ABILITY_SYSTEM = abilitySystem;
