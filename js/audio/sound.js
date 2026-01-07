import { registry } from "../core/registry.js";

const STORAGE_KEY = "scrappo.volume";
const soundRegistry = new Map();
let audioContext = null;
let masterGain = null;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getVolume = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const parsed = Number.parseFloat(stored);
  if (Number.isNaN(parsed)) {
    return 0.7;
  }
  return clamp(parsed, 0, 1);
};

const setVolume = (value) => {
  const next = clamp(value, 0, 1);
  if (masterGain) {
    masterGain.gain.value = next;
  }
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
};

const ensureContext = () => {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return null;
    }
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = getVolume();
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") {
    const resumeResult = audioContext.resume();
    if (resumeResult && typeof resumeResult.catch === "function") {
      resumeResult.catch(() => {});
    }
  }

  return audioContext;
};

const registerSound = (name, handler) => {
  if (!name || typeof handler !== "function") {
    return;
  }
  soundRegistry.set(name, handler);
};

const playSound = (name, options = {}) => {
  const handler = soundRegistry.get(name);
  if (!handler) {
    return;
  }
  const context = ensureContext();
  if (!context || !masterGain) {
    return;
  }
  handler({
    context,
    masterGain,
    now: context.currentTime,
    options
  });
};

const playClick = () => playSound("click");
const playHit = () => playSound("hit");
const playPlayerHit = () => playSound("player-hit");
const playShot = () => playSound("shot");

setVolume(getVolume());

document.addEventListener(
  "pointerdown",
  () => {
    ensureContext();
  },
  { once: true, passive: true }
);

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true") {
    return;
  }

  playClick();
});

export const soundInternal = {
  registerSound,
  playSound,
  ensureContext,
  getVolume,
  setVolume
};

export const soundApi = {
  playClick,
  playHit,
  playPlayerHit,
  playShot,
  getVolume,
  setVolume
};

registry.set("sound", soundApi);
const SCRAPPO = window.SCRAPPO || (window.SCRAPPO = {});
SCRAPPO.sound = soundApi;
window.SCRAPPO_SOUND = soundApi;
SCRAPPO.soundInternal = soundInternal;
window.SCRAPPO_SOUND_INTERNAL = soundInternal;
