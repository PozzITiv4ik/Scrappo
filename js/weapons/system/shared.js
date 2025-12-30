(() => {
  if (window.SCRAPPO_WEAPON_INTERNAL) {
    return;
  }

  const SLOT_COUNT = 4;
  const weaponSlots = new Array(SLOT_COUNT).fill(null);
  weaponSlots[0] = "pistol";
  const handSlots = { right: 0, left: 1 };
  const hands = ["right", "left"];

  const state = {
    weaponSlots,
    handSlots,
    hands,
    lastShotAt: { right: 0, left: 0 },
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

  const getWeaponData = () => window.SCRAPPO_WEAPONS || {};
  const getAbilityApi = () => window.SCRAPPO_ABILITY_SYSTEM;
  const getMapApi = () => window.SCRAPPO_MAP;
  const getSoundApi = () => window.SCRAPPO_SOUND;

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

  window.SCRAPPO_WEAPON_INTERNAL = {
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
})();
