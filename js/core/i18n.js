import { I18N } from "../data/i18n.js";

const getLang = () => document.documentElement.lang || "en";
const hasLang = (lang) => Boolean(I18N[lang]);
const getDictionary = (lang = getLang()) => I18N[lang] || I18N.en || {};

const t = (key, fallback) => {
  const dictionary = getDictionary();
  if (dictionary[key] !== undefined) {
    return dictionary[key];
  }
  if (fallback !== undefined) {
    return fallback;
  }
  return key;
};

const getText = (value, lang = getLang()) => {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    return value[lang] || value.en || "";
  }
  return "";
};

const formatTemplate = (template, data) => {
  if (!template) {
    return "";
  }
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(data, key) ? data[key] : match
  );
};

export { getLang, hasLang, getDictionary, t, getText, formatTemplate };
