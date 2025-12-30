window.SCRAPPO_CHARACTERS = [
  {
    id: "normal",
    nameKey: "characters.normal.name",
    descKey: "characters.normal.desc",
    tagKey: "characters.tag.base",
    notes: ["characters.normal.note1"],
    modifiers: []
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
    ]
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
    ]
  }
];
