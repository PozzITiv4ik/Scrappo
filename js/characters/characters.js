window.SCRAPPO_CHARACTERS = [
  {
    id: "normal",
    nameKey: "characters.normal.name",
    descKey: "characters.normal.desc",
    notes: ["characters.normal.note1"],
    modifiers: [],
    weaponId: "pistol"
  },
  {
    id: "psycho",
    nameKey: "characters.psycho.name",
    descKey: "characters.psycho.desc",
    notes: ["characters.psycho.note1", "characters.psycho.note2"],
    modifiers: [
      { stat: "maxHp", type: "percent", value: -0.1 },
      { stat: "damage", type: "percent", value: 0.15 },
      { stat: "fireRate", type: "percent", value: 0.1 }
    ],
    weaponId: "pistol"
  },
  {
    id: "agile",
    nameKey: "characters.agile.name",
    descKey: "characters.agile.desc",
    notes: ["characters.agile.note1", "characters.agile.note2"],
    modifiers: [
      { stat: "speed", type: "percent", value: 0.12 },
      { stat: "pickupRadius", type: "percent", value: 0.1 },
      { stat: "maxHp", type: "flat", value: -5 }
    ],
    weaponId: "pistol"
  },
  {
    id: "brute",
    nameKey: "characters.brute.name",
    descKey: "characters.brute.desc",
    notes: ["characters.brute.note1", "characters.brute.note2"],
    modifiers: [
      { stat: "maxHp", type: "percent", value: 0.2 },
      { stat: "speed", type: "percent", value: -0.08 }
    ],
    weaponId: "pistol"
  },
  {
    id: "scout",
    nameKey: "characters.scout.name",
    descKey: "characters.scout.desc",
    notes: ["characters.scout.note1", "characters.scout.note2"],
    modifiers: [
      { stat: "speed", type: "percent", value: 0.15 },
      { stat: "maxHp", type: "percent", value: -0.1 }
    ],
    weaponId: "pistol"
  },
  {
    id: "gunner",
    nameKey: "characters.gunner.name",
    descKey: "characters.gunner.desc",
    notes: ["characters.gunner.note1", "characters.gunner.note2"],
    modifiers: [
      { stat: "fireRate", type: "percent", value: 0.2 },
      { stat: "damage", type: "percent", value: -0.1 }
    ],
    weaponId: "pistol"
  },
  {
    id: "sniper",
    nameKey: "characters.sniper.name",
    descKey: "characters.sniper.desc",
    notes: ["characters.sniper.note1", "characters.sniper.note2"],
    modifiers: [
      { stat: "damage", type: "percent", value: 0.25 },
      { stat: "fireRate", type: "percent", value: -0.12 }
    ],
    weaponId: "pistol"
  },
  {
    id: "scavenger",
    nameKey: "characters.scavenger.name",
    descKey: "characters.scavenger.desc",
    notes: ["characters.scavenger.note1", "characters.scavenger.note2"],
    modifiers: [
      { stat: "pickupRadius", type: "percent", value: 0.2 },
      { stat: "maxHp", type: "flat", value: -5 }
    ],
    weaponId: "pistol"
  },
  {
    id: "vanguard",
    nameKey: "characters.vanguard.name",
    descKey: "characters.vanguard.desc",
    notes: ["characters.vanguard.note1", "characters.vanguard.note2"],
    modifiers: [
      { stat: "maxHp", type: "flat", value: 10 },
      { stat: "damage", type: "percent", value: 0.08 },
      { stat: "speed", type: "percent", value: -0.05 }
    ],
    weaponId: "pistol"
  }
];
