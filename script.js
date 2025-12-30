const translations = window.SCRAPPO_I18N || {};

const panels = document.querySelectorAll("[data-panel]");
const langButtons = document.querySelectorAll("[data-lang]");
const LOCAL_STORAGE_KEY = "scrappo.lang";

const getInitialLanguage = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored && translations[stored]) {
    return stored;
  }

  const browserLang = navigator.language && navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
  return translations[browserLang] ? browserLang : "en";
};

const applyTranslations = (lang) => {
  const dictionary = translations[lang] || translations.en;
  document.documentElement.lang = lang;
  document.title = dictionary["meta.title"] || "Scrappo";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const value = dictionary[key];
    if (!value) {
      return;
    }

    const attrName = element.getAttribute("data-i18n-attr");
    const allowText = element.getAttribute("data-i18n-text");

    if (attrName) {
      element.setAttribute(attrName, value);
    }

    if (allowText !== "false") {
      element.textContent = value;
    }
  });
};

const updateLanguageButtons = (activeLang) => {
  langButtons.forEach((button) => {
    const isActive = button.dataset.lang === activeLang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
};

const setLanguage = (lang) => {
  const nextLang = translations[lang] ? lang : "en";
  localStorage.setItem(LOCAL_STORAGE_KEY, nextLang);
  applyTranslations(nextLang);
  updateLanguageButtons(nextLang);
};

const showPanel = (panelName) => {
  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === panelName;
    panel.classList.toggle("panel--active", isActive);
    panel.setAttribute("aria-hidden", String(!isActive));
  });
};

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) {
    return;
  }

  const actionName = action.dataset.action;
  if (actionName === "settings") {
    showPanel("settings");
  }

  if (actionName === "back") {
    showPanel("main");
  }
});

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const lang = button.dataset.lang;
    setLanguage(lang);
  });
});

setLanguage(getInitialLanguage());
