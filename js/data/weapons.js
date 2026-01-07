import { WEAPON_TEXTS } from "./weapons-texts.js";

const BASE_WEAPONS = {
  pistol: {
    id: "pistol",
    rarity: "common",
    price: 0,
    shop: false,
    sprite: "assets/weapons/pistol/weapon_pistol.png",
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
      sprite: "assets/weapons/pistol/weapon_pistol_ammunition.png",
      size: 14,
      speed: 640,
      range: 520,
      offset: 0
    }
  },
  scrap_smg: {
    id: "scrap_smg",
    rarity: "common",
    price: 40,
    shop: true,
    sprite: "assets/weapons/scrap_smg/weapon_scrap_smg.png",
    damage: 5,
    fireRate: 5.2,
    range: 360,
    ammo: {
      sprite: "assets/weapons/scrap_smg/weapon_scrap_smg_ammunition.png",
      size: 10,
      speed: 620,
      range: 360,
      offset: 0
    }
  },
  rivet_rifle: {
    id: "rivet_rifle",
    rarity: "common",
    price: 40,
    shop: true,
    sprite: "assets/weapons/rivet_rifle/weapon_rivet_rifle.png",
    damage: 10,
    fireRate: 2.4,
    range: 520,
    ammo: {
      sprite: "assets/weapons/rivet_rifle/weapon_rivet_rifle_ammunition.png",
      size: 12,
      speed: 680,
      range: 520,
      offset: 0
    }
  },
  dust_repeater: {
    id: "dust_repeater",
    rarity: "uncommon",
    price: 70,
    shop: true,
    sprite: "assets/weapons/dust_repeater/weapon_dust_repeater.png",
    damage: 8,
    fireRate: 3.2,
    range: 480,
    ammo: {
      sprite: "assets/weapons/dust_repeater/weapon_dust_repeater_ammunition.png",
      size: 11,
      speed: 640,
      range: 480,
      offset: 0
    }
  },
  coil_carbine: {
    id: "coil_carbine",
    rarity: "uncommon",
    price: 70,
    shop: true,
    sprite: "assets/weapons/coil_carbine/weapon_coil_carbine.png",
    damage: 12,
    fireRate: 2.0,
    range: 680,
    ammo: {
      sprite: "assets/weapons/coil_carbine/weapon_coil_carbine_ammunition.png",
      size: 12,
      speed: 720,
      range: 680,
      offset: 0
    }
  },
  arc_driver: {
    id: "arc_driver",
    rarity: "rare",
    price: 110,
    shop: true,
    sprite: "assets/weapons/arc_driver/weapon_arc_driver.png",
    damage: 18,
    fireRate: 1.7,
    range: 560,
    ammo: {
      sprite: "assets/weapons/arc_driver/weapon_arc_driver_ammunition.png",
      size: 13,
      speed: 700,
      range: 560,
      offset: 0
    }
  },
  gutter_cannon: {
    id: "gutter_cannon",
    rarity: "rare",
    price: 110,
    shop: true,
    sprite: "assets/weapons/gutter_cannon/weapon_gutter_cannon.png",
    damage: 22,
    fireRate: 1.1,
    range: 460,
    ammo: {
      sprite: "assets/weapons/gutter_cannon/weapon_gutter_cannon_ammunition.png",
      size: 14,
      speed: 580,
      range: 460,
      offset: 0
    }
  },
  bore_cannon: {
    id: "bore_cannon",
    rarity: "epic",
    price: 160,
    shop: true,
    sprite: "assets/weapons/bore_cannon/weapon_bore_cannon.png",
    damage: 30,
    fireRate: 0.8,
    range: 620,
    ammo: {
      sprite: "assets/weapons/bore_cannon/weapon_bore_cannon_ammunition.png",
      size: 16,
      speed: 560,
      range: 620,
      offset: 0
    }
  },
  storm_lancer: {
    id: "storm_lancer",
    rarity: "epic",
    price: 160,
    shop: true,
    sprite: "assets/weapons/storm_lancer/weapon_storm_lancer.png",
    damage: 16,
    fireRate: 2.3,
    range: 700,
    ammo: {
      sprite: "assets/weapons/storm_lancer/weapon_storm_lancer_ammunition.png",
      size: 12,
      speed: 760,
      range: 700,
      offset: 0
    }
  },
  nova_lance: {
    id: "nova_lance",
    rarity: "legendary",
    price: 220,
    shop: true,
    sprite: "assets/weapons/nova_lance/weapon_nova_lance.png",
    damage: 28,
    fireRate: 1.4,
    range: 760,
    ammo: {
      sprite: "assets/weapons/nova_lance/weapon_nova_lance_ammunition.png",
      size: 14,
      speed: 780,
      range: 760,
      offset: 0
    }
  },
  kingmaker: {
    id: "kingmaker",
    rarity: "legendary",
    price: 220,
    shop: true,
    sprite: "assets/weapons/kingmaker/weapon_kingmaker.png",
    damage: 34,
    fireRate: 1.0,
    range: 820,
    ammo: {
      sprite: "assets/weapons/kingmaker/weapon_kingmaker_ammunition.png",
      size: 15,
      speed: 820,
      range: 820,
      offset: 0
    }
  }
};

export const WEAPONS = Object.fromEntries(
  Object.entries(BASE_WEAPONS).map(([id, weapon]) => {
    const text = WEAPON_TEXTS[id];
    if (!text) {
      return [id, weapon];
    }
    return [id, { ...weapon, name: text.name, description: text.description }];
  })
);
