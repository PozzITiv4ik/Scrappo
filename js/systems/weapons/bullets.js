import { internal } from "./internal.js";

const { state } = internal;

const spawnDamageNumber = (position, amount) => {
  const world = internal.getWorldElement();
  if (!world) {
    return;
  }
  const label = document.createElement("div");
  label.className = "damage-number";
  label.textContent = `${amount}`;
  label.style.left = `${position.x}px`;
  label.style.top = `${position.y - 18}px`;
  label.addEventListener("animationend", () => label.remove());
  world.appendChild(label);
};

const createBullet = (hand, weapon, target) => {
  const mapApi = internal.getMapApi();
  const world = internal.getWorldElement();
  if (
    !mapApi ||
    !world ||
    !target ||
    typeof mapApi.getPlayerPosition !== "function" ||
    typeof mapApi.getPlayerSize !== "function"
  ) {
    return null;
  }

  const ammo = weapon.ammo || {};
  if (!ammo.sprite) {
    return null;
  }

  const playerPos = mapApi.getPlayerPosition();
  const dx = target.x - playerPos.x;
  const dy = target.y - playerPos.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0) {
    return null;
  }

  const speed = typeof ammo.speed === "number" ? ammo.speed : 500;
  const size = typeof ammo.size === "number" ? ammo.size : 12;
  const range = typeof ammo.range === "number" ? ammo.range : weapon.range || 400;
  const offset = typeof ammo.offset === "number" ? ammo.offset : 20;
  const dirX = dx / distance;
  const dirY = dy / distance;
  const playerSize = mapApi.getPlayerSize();
  const anchor = internal.aim.getWeaponOffset(hand);
  const anchorX = playerPos.x - playerSize / 2 + anchor.x;
  const anchorY = playerPos.y - playerSize / 2 + anchor.y;
  const angle = Math.atan2(dirY, dirX);
  const muzzle = internal.aim.getMuzzleWorldPosition(hand, weapon, angle, playerPos, playerSize);
  const startX = muzzle ? muzzle.x + dirX * offset : anchorX + dirX * offset;
  const startY = muzzle ? muzzle.y + dirY * offset : anchorY + dirY * offset;

  const el = document.createElement("img");
  el.className = "bullet";
  el.src = ammo.sprite;
  el.alt = "";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.left = `${startX}px`;
  el.style.top = `${startY}px`;
  el.style.transform = `translate(-50%, -50%) rotate(${(angle * 180) / Math.PI}deg)`;
  world.appendChild(el);

  state.bulletId += 1;
  const id = `bullet-${state.bulletId}`;
  state.bullets.set(id, {
    id,
    el,
    x: startX,
    y: startY,
    vx: dirX * speed,
    vy: dirY * speed,
    size,
    range,
    traveled: 0,
    damage: weapon.damage
  });

  return id;
};

const clearBullets = () => {
  state.bullets.forEach((bullet) => bullet.el.remove());
  state.bullets.clear();
};

const updateBullets = (delta) => {
  if (!state.bullets.size) {
    return;
  }

  const mapApi = internal.getMapApi();
  if (!mapApi || typeof mapApi.getMapSize !== "function" || typeof mapApi.getMobTargets !== "function") {
    return;
  }

  const mapSize = mapApi.getMapSize();
  const mobs = mapApi.getMobTargets();

  state.bullets.forEach((bullet, id) => {
    const nextX = bullet.x + bullet.vx * delta;
    const nextY = bullet.y + bullet.vy * delta;
    const step = Math.hypot(nextX - bullet.x, nextY - bullet.y);
    bullet.traveled += step;
    bullet.x = nextX;
    bullet.y = nextY;

    bullet.el.style.left = `${bullet.x}px`;
    bullet.el.style.top = `${bullet.y}px`;

    if (bullet.traveled >= bullet.range) {
      bullet.el.remove();
      state.bullets.delete(id);
      return;
    }

    if (bullet.x < 0 || bullet.y < 0 || bullet.x > mapSize || bullet.y > mapSize) {
      bullet.el.remove();
      state.bullets.delete(id);
      return;
    }

    const bulletRadius = bullet.size / 2;
    for (let i = 0; i < mobs.length; i += 1) {
      const mob = mobs[i];
      const mobRadius = (mob.size || 52) / 2;
      const dx = mob.x - bullet.x;
      const dy = mob.y - bullet.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= mobRadius + bulletRadius) {
        const result = mapApi.applyDamage(mob.id, bullet.damage);
        const soundApi = internal.getSoundApi();
        if (soundApi && typeof soundApi.playHit === "function") {
          soundApi.playHit();
        }
        if (result && result.position) {
          spawnDamageNumber(result.position, bullet.damage);
        } else {
          spawnDamageNumber({ x: mob.x, y: mob.y }, bullet.damage);
        }
        bullet.el.remove();
        state.bullets.delete(id);
        break;
      }
    }
  });
};

internal.bullets = {
  createBullet,
  updateBullets,
  clearBullets,
  spawnDamageNumber
};
