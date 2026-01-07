import { getDictionary, getText, t } from "../../core/i18n.js";
import { internal } from "./internal.js";

const getAbilityText = (ability, field) => getText(ability?.[field]);

const getRarityLabel = (rarity) => t(`rarity.${rarity}`, rarity);

internal.i18n = {
  getDictionary,
  t,
  getAbilityText,
  getRarityLabel
};
