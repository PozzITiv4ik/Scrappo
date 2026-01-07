import { ABILITY_TEXTS } from "./i18n.js";

const BASE_ABILITIES = [
  {
    id: "hp_flat_5",
    rarity: "common",
    effects: [{ stat: "maxHp", type: "flat", value: 5 }]
  },
  {
    id: "hp_pct_1",
    rarity: "common",
    effects: [{ stat: "maxHp", type: "percent", value: 0.01 }]
  },
  {
    id: "speed_pct_5",
    rarity: "common",
    effects: [{ stat: "moveSpeed", type: "percent", value: 0.05 }]
  },
  {
    id: "pickup_flat_12",
    rarity: "common",
    effects: [{ stat: "pickupRadius", type: "flat", value: 12 }]
  },
  {
    id: "damage_flat_1",
    rarity: "common",
    effects: [{ stat: "damage", type: "flat", value: 1 }]
  },
  {
    id: "fire_rate_pct_5",
    rarity: "common",
    effects: [{ stat: "fireRate", type: "percent", value: 0.05 }]
  },
  {
    id: "xp_gain_pct_5",
    rarity: "common",
    effects: [{ stat: "xpGain", type: "percent", value: 0.05 }]
  },
  {
    id: "gold_gain_pct_5",
    rarity: "common",
    effects: [{ stat: "goldGain", type: "percent", value: 0.05 }]
  },
  {
    id: "hp_flat_15",
    rarity: "rare",
    effects: [{ stat: "maxHp", type: "flat", value: 15 }]
  },
  {
    id: "damage_pct_10",
    rarity: "rare",
    effects: [{ stat: "damage", type: "percent", value: 0.1 }]
  },
  {
    id: "fire_rate_pct_12",
    rarity: "rare",
    effects: [{ stat: "fireRate", type: "percent", value: 0.12 }]
  }
];

export const ABILITIES = BASE_ABILITIES.map((ability) => {
  const text = ABILITY_TEXTS[ability.id];
  if (!text) {
    return ability;
  }
  return { ...ability, name: text.name, description: text.description };
});
