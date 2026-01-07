import { internal } from "./internal.js";

const { config, playerConfig, playerState, playerPos, state, utils } = internal;
const { clamp } = utils;

const spawnMob = (mob, position) => {
  if (!state.world || !mob || !position) {
    return null;
  }

  state.mobId += 1;
  const id = `mob-${state.mobId}`;
  const mobEl = document.createElement("div");
  mobEl.className = "mob";
  mobEl.dataset.mobId = id;
  mobEl.dataset.mobType = mob.id || "mob";
  const size = typeof mob.size === "number" ? mob.size : playerConfig.size;
  mobEl.style.width = `${size}px`;
  mobEl.style.height = `${size}px`;
  mobEl.style.left = `${position.x}px`;
  mobEl.style.top = `${position.y}px`;

  const hpTrack = document.createElement("div");
  hpTrack.className = "mob-hp";
  const hpBar = document.createElement("div");
  hpBar.className = "mob-hp-bar";
  hpTrack.appendChild(hpBar);

  const sprite = document.createElement("img");
  sprite.className = "mob-sprite";
  sprite.src = mob.sprite;
  sprite.alt = "";

  mobEl.appendChild(hpTrack);
  mobEl.appendChild(sprite);
  state.world.appendChild(mobEl);
  const maxHp = typeof mob.hp === "number" ? mob.hp : 10;
  hpBar.style.width = "100%";
  state.mobs.set(id, {
    el: mobEl,
    x: position.x,
    y: position.y,
    size,
    speed: typeof mob.speed === "number" ? mob.speed : config.mobSpeed,
    damage: typeof mob.damage === "number" ? mob.damage : 5,
    experience: typeof mob.experience === "number" ? mob.experience : 0,
    gold: typeof mob.gold === "number" ? mob.gold : 0,
    hp: maxHp,
    maxHp,
    hpBar
  });
  return id;
};

const clearMobs = () => {
  state.mobs.forEach((mobData) => mobData.el.remove());
  state.mobs.clear();
};

const getMobTargets = () =>
  Array.from(state.mobs.entries()).map(([id, mob]) => ({
    id,
    x: mob.x,
    y: mob.y,
    size: mob.size,
    hp: mob.hp,
    maxHp: mob.maxHp
  }));

const applyDamage = (id, amount) => {
  const mob = state.mobs.get(id);
  if (!mob) {
    return null;
  }

  const nextHp = Math.max(0, mob.hp - amount);
  mob.hp = nextHp;
  if (mob.hpBar) {
    const ratio = mob.maxHp > 0 ? nextHp / mob.maxHp : 0;
    mob.hpBar.style.width = `${Math.max(0, ratio) * 100}%`;
  }

  const position = { x: mob.x, y: mob.y };
  if (nextHp <= 0) {
    mob.el.remove();
    state.mobs.delete(id);
    if (mob.experience && typeof internal.spawnExperienceDrops === "function") {
      internal.spawnExperienceDrops(mob.experience, position);
    }
    if (mob.gold && typeof internal.spawnGoldDrops === "function") {
      internal.spawnGoldDrops(mob.gold, position);
    }
  }

  return {
    hp: nextHp,
    position
  };
};

const updateMobs = (delta, now) => {
  if (!state.mobs.size) {
    return;
  }

  const current = typeof now === "number" ? now : performance.now();
  const playerRadius = playerConfig.size / 2;
  let hitApplied = false;

  state.mobs.forEach((mob) => {
    const dx = playerPos.x - mob.x;
    const dy = playerPos.y - mob.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= 1) {
      const step = Math.min(mob.speed * delta, distance);
      const nextX = mob.x + (dx / distance) * step;
      const nextY = mob.y + (dy / distance) * step;
      const halfSize = mob.size / 2;
      mob.x = clamp(nextX, halfSize, config.mapSize - halfSize);
      mob.y = clamp(nextY, halfSize, config.mapSize - halfSize);
      mob.el.style.left = `${mob.x}px`;
      mob.el.style.top = `${mob.y}px`;
    }

    if (!hitApplied && current >= playerState.invulnerableUntil) {
      const hitDistance = playerRadius + mob.size / 2;
      const hitDx = playerPos.x - mob.x;
      const hitDy = playerPos.y - mob.y;
      if (Math.hypot(hitDx, hitDy) <= hitDistance) {
        if (typeof internal.applyPlayerDamage === "function") {
          internal.applyPlayerDamage(mob.damage, current);
        }
        hitApplied = true;
      }
    }
  });
};

internal.spawnMob = spawnMob;
internal.clearMobs = clearMobs;
internal.getMobTargets = getMobTargets;
internal.applyDamage = applyDamage;
internal.updateMobs = updateMobs;
