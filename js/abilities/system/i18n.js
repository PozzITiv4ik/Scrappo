(() => {
  const internal = window.SCRAPPO_ABILITY_INTERNAL;
  if (!internal) {
    return;
  }

  const getDictionary = () => {
    const lang = document.documentElement.lang || "en";
    const i18n = window.SCRAPPO_I18N || {};
    return i18n[lang] || i18n.en || {};
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
})();
