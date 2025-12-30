(() => {
  if (window.SCRAPPO_MAP_INTERNAL) {
    return;
  }

  const playerApi = window.SCRAPPO_PLAYER;
  if (!playerApi || !playerApi.config || !playerApi.state) {
    return;
  }

  const playerConfig = playerApi.config;
  const playerState = playerApi.state;

  const config = {
    mapSize: 1400,
    itemSize: 28,
    itemCount: 14,
    mobSpeed: 90,
    zoom: 2.5,
    xpOrbSize: 18,
    xpMinPieces: 3,
    xpMaxPieces: 6,
    goldOrbSize: 18,
    goldMinPieces: 3,
    goldMaxPieces: 6
  };

  const assets = {
    PLANT_PATHS: [
      "icons/location_item_1.png",
      "icons/location_item_2.png",
      "icons/location_item_3.png",
      "icons/location_item_4.png",
      "icons/location_item_5.png",
      "icons/location_item_6.png"
    ],
    EXPERIENCE_SPRITES: [
      "icons/experience.png",
      "icons/experience.png",
      "icons/experience.png"
    ],
    GOLD_SPRITES: [
      "icons/gold.png",
      "icons/gold.png",
      "icons/gold.png"
    ]
  };

  if (!playerState.position) {
    playerState.position = { x: config.mapSize / 2, y: config.mapSize / 2 };
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const getExperienceSprites = () => window.SCRAPPO_EXPERIENCE_SPRITES || assets.EXPERIENCE_SPRITES;
  const getGoldSprites = () => window.SCRAPPO_GOLD_SPRITES || assets.GOLD_SPRITES;
  const getAbilityApi = () => window.SCRAPPO_ABILITY_SYSTEM;
  const getPlayerStats = () => {
    const abilityApi = getAbilityApi();
    if (abilityApi && typeof abilityApi.getPlayerStats === "function") {
      return abilityApi.getPlayerStats();
    }
    return {
      maxHp: playerState.maxHp,
      speed: playerConfig.speed,
      pickupRadius: playerState.pickupRadius,
      collectRadius: playerState.collectRadius,
      xpGainMultiplier: 1,
      goldGainMultiplier: 1
    };
  };

  const state = {
    frame: null,
    world: null,
    player: null,
    hpBar: null,
    hpText: null,
    xpBar: null,
    xpText: null,
    goldText: null,
    mobId: 0,
    experienceId: 0,
    goldId: 0,
    initialized: false,
    active: false,
    rafId: null,
    lastTime: 0,
    keys: new Set(),
    mobs: new Map(),
    experienceDrops: new Map(),
    goldDrops: new Map()
  };

  window.SCRAPPO_MAP_INTERNAL = {
    playerApi,
    playerConfig,
    playerState,
    playerPos: playerState.position,
    config,
    assets,
    state,
    utils: {
      clamp,
      getExperienceSprites,
      getGoldSprites
    },
    getAbilityApi,
    getPlayerStats
  };
})();
