const translations = window.SCRAPPO_I18N || {};

const panels = document.querySelectorAll("[data-panel]");
const langButtons = document.querySelectorAll("[data-lang]");
const volumeSlider = document.querySelector("[data-volume]");
const volumeValue = document.querySelector("[data-volume-value]");
const soundApi = window.SCRAPPO_SOUND;
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

const syncVolumeUI = (value) => {
  const percent = Math.round(value * 100);
  if (volumeSlider) {
    volumeSlider.value = String(percent);
  }
  if (volumeValue) {
    volumeValue.textContent = `${percent}%`;
  }
};

const setupVolumeControls = () => {
  if (!volumeSlider || !soundApi || typeof soundApi.getVolume !== "function") {
    return;
  }

  syncVolumeUI(soundApi.getVolume());

  volumeSlider.addEventListener("input", (event) => {
    const rawValue = Number(event.target.value);
    const nextVolume = Number.isNaN(rawValue) ? 0 : rawValue / 100;
    const applied = typeof soundApi.setVolume === "function" ? soundApi.setVolume(nextVolume) : nextVolume;
    syncVolumeUI(applied);
  });
};

const setupParallax = () => {
  const stage = document.querySelector(".stage");
  if (!stage) {
    return;
  }

  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frameId = null;

  const maxOffsetX = 26;
  const maxOffsetY = 18;

  const animate = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    stage.style.setProperty("--parallax-x", `${currentX.toFixed(2)}px`);
    stage.style.setProperty("--parallax-y", `${currentY.toFixed(2)}px`);

    if (Math.abs(targetX - currentX) < 0.1 && Math.abs(targetY - currentY) < 0.1) {
      frameId = null;
      return;
    }

    frameId = window.requestAnimationFrame(animate);
  };

  const updateTarget = (event) => {
    const rect = stage.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = relativeX * maxOffsetX;
    targetY = relativeY * maxOffsetY;
    if (!frameId) {
      frameId = window.requestAnimationFrame(animate);
    }
  };

  const resetTarget = () => {
    targetX = 0;
    targetY = 0;
    if (!frameId) {
      frameId = window.requestAnimationFrame(animate);
    }
  };

  stage.addEventListener("pointermove", updateTarget);
  stage.addEventListener("pointerleave", resetTarget);
  window.addEventListener("blur", resetTarget);
};

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) {
    return;
  }

  const actionName = action.dataset.action;
  if (actionName === "settings") {
    showPanel("settings");
  } else if (actionName === "play") {
    showPanel("characters");
  } else if (actionName === "back") {
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
setupVolumeControls();
setupParallax();
