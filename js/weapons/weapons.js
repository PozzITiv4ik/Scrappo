window.SCRAPPO_WEAPONS = {
  pistol: {
    id: "pistol",
    sprite: "weapons/pistol/weapon_pistol.png",
    damage: 8,
    fireRate: 2.5,
    range: 520,
    muzzle: {
      x: 841,
      y: 403,
      width: 1024,
      height: 1024
    },
    ammo: {
      sprite: "weapons/pistol/weapon_pistol_ammunition.png",
      size: 14,
      speed: 640,
      range: 520,
      offset: 0
    }
  }
};

(() => {
  const translations = window.SCRAPPO_WEAPON_TEXTS || {};
  Object.values(window.SCRAPPO_WEAPONS).forEach((weapon) => {
    const text = translations[weapon.id];
    if (!text) {
      return;
    }
    weapon.name = text.name;
    weapon.description = text.description;
  });
})();
