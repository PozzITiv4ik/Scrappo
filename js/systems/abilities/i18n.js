import { I18N } from "../../data/i18n.js";
import { internal } from "./internal.js";

const getDictionary = () => {
  const lang = document.documentElement.lang || "en";
  return I18N[lang] || I18N.en || {};
};

const t = (key, fallback = "") => {
  const dictionary = getDictionary();
  return dictionary[key] || fallback || key;
};

const getAbilityText = (ability, field) => {
  const lang = document.documentElement.lang || "en";
  const entry = ability[field] || {};
  return entry[lang] || entry.en || "";
};

const getRarityLabel = (rarity) => t(`rarity.${rarity}`, rarity);

internal.i18n = {
  getDictionary,
  t,
  getAbilityText,
  getRarityLabel
};
