(() => {
  if (window.SCRAPPO_ABILITY_INTERNAL) {
    return;
  }

  const abilities = Array.isArray(window.SCRAPPO_ABILITIES) ? window.SCRAPPO_ABILITIES : [];
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

  const getPlayerApi = () => window.SCRAPPO_PLAYER;
  const getMapApi = () => window.SCRAPPO_MAP;
  const getWaveApi = () => window.SCRAPPO_WAVE_SYSTEM;
  const getWeaponApi = () => window.SCRAPPO_WEAPON_SYSTEM;
  const getUiApi = () => window.SCRAPPO_UI;

  window.SCRAPPO_ABILITY_INTERNAL = {
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
    i18n: null,
    modifiers: null,
    ui: null,
    flow: null
  };
})();
