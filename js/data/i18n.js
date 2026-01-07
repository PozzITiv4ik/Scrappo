// Source translations live in i18n/{lang}/*.json.
import uiEn from "../../i18n/en/ui.json" assert { type: "json" };
import uiRu from "../../i18n/ru/ui.json" assert { type: "json" };
import charactersEn from "../../i18n/en/characters.json" assert { type: "json" };
import charactersRu from "../../i18n/ru/characters.json" assert { type: "json" };
import weaponsEn from "../../i18n/en/weapons.json" assert { type: "json" };
import weaponsRu from "../../i18n/ru/weapons.json" assert { type: "json" };
import abilitiesEn from "../../i18n/en/abilities.json" assert { type: "json" };
import abilitiesRu from "../../i18n/ru/abilities.json" assert { type: "json" };

const UI_I18N = {
  en: uiEn,
  ru: uiRu
};

export const CHARACTER_I18N = {
  en: charactersEn,
  ru: charactersRu
};

const toTextBundle = (enSource, ruSource) => {
  const entries = {};
  Object.keys(enSource).forEach((key) => {
    const en = enSource[key] || {};
    const ru = ruSource[key] || {};
    entries[key] = {
      name: { en: en.name || "", ru: ru.name || "" },
      description: { en: en.description || "", ru: ru.description || "" }
    };
  });
  return entries;
};

export const WEAPON_TEXTS = toTextBundle(weaponsEn, weaponsRu);
export const ABILITY_TEXTS = toTextBundle(abilitiesEn, abilitiesRu);

export const TRANSLATIONS = {
  ui: UI_I18N,
  characters: CHARACTER_I18N,
  weapons: WEAPON_TEXTS,
  abilities: ABILITY_TEXTS
};

export const I18N = {
  en: {
    ...UI_I18N.en,
    ...(CHARACTER_I18N.en || {})
  },
  ru: {
    ...UI_I18N.ru,
    ...(CHARACTER_I18N.ru || {})
  }
};
