const translations = {
  en: {
    "meta.title": "Scrappo",
    "meta.tagline": "A fast roguelike survival run, built from scrap and grit.",
    "meta.note": "Prototype build",
    "meta.version": "v0.0.1",
    "meta.mode": "Menu Prototype",
    "menu.title": "Main Menu",
    "menu.play": "Play",
    "menu.settings": "Settings",
    "menu.exit": "Exit",
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.back": "Back",
    "lang.english": "English",
    "lang.russian": "Russian"
  },
  ru: {
    "meta.title": "Scrappo",
    "meta.tagline": "Быстрый рогалик на выживание, собранный из хлама и упрямства.",
    "meta.note": "Прототип сборки",
    "meta.version": "v0.0.1",
    "meta.mode": "Прототип меню",
    "menu.title": "Главное меню",
    "menu.play": "Играть",
    "menu.settings": "Настройки",
    "menu.exit": "Выход",
    "settings.title": "Настройки",
    "settings.language": "Язык",
    "settings.back": "Назад",
    "lang.english": "Английский",
    "lang.russian": "Русский"
  }
};

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
    if (value) {
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
