import { internal } from "./internal.js";

const { config, assets, state, utils, playerPos } = internal;
const { clamp } = utils;

const setupWorld = () => {
  if (!state.world) {
    return;
  }
  state.world.style.width = `${config.mapSize}px`;
  state.world.style.height = `${config.mapSize}px`;
};

const spawnItems = () => {
  if (!state.world) {
    return;
  }
  if (state.world.querySelectorAll(".map-item").length > 0) {
    return;
  }

  const padding = config.itemSize;
  for (let i = 0; i < config.itemCount; i += 1) {
    const img = document.createElement("img");
    img.className = "map-item";
    img.src = assets.PLANT_PATHS[Math.floor(Math.random() * assets.PLANT_PATHS.length)];
    img.alt = "";
    const x = padding + Math.random() * (config.mapSize - padding * 2);
    const y = padding + Math.random() * (config.mapSize - padding * 2);
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    state.world.appendChild(img);
  }
};

const updateCamera = () => {
  if (!state.frame || !state.world) {
    return;
  }

  const viewWidth = state.frame.clientWidth;
  const viewHeight = state.frame.clientHeight;
  const zoom = config.zoom;
  const halfW = viewWidth / 2;
  const halfH = viewHeight / 2;
  const viewHalfW = halfW / zoom;
  const viewHalfH = halfH / zoom;

  const minX = viewHalfW;
  const maxX = config.mapSize - viewHalfW;
  const minY = viewHalfH;
  const maxY = config.mapSize - viewHalfH;

  const camX = minX > maxX ? config.mapSize / 2 : clamp(playerPos.x, minX, maxX);
  const camY = minY > maxY ? config.mapSize / 2 : clamp(playerPos.y, minY, maxY);

  const offsetX = halfW - camX * zoom;
  const offsetY = halfH - camY * zoom;
  state.world.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${zoom})`;

  if (typeof internal.updatePlayer === "function") {
    internal.updatePlayer();
  }
};

internal.setupWorld = setupWorld;
internal.spawnItems = spawnItems;
internal.updateCamera = updateCamera;
