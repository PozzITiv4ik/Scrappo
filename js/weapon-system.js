(() => {
  const SLOT_COUNT = 4;
  const weaponSlots = new Array(SLOT_COUNT).fill(null);
  weaponSlots[0] = "pistol";
  let activeSlot = 0;

  let lastShotAt = 0;
  let lastTick = 0;
  let running = false;
  let rafId = null;
  let bulletId = 0;
  const bullets = new Map();

  const getWeaponData = () => window.SCRAPPO_WEAPONS || {};
  const getEquippedWeapon = () => {
    const weapons = getWeaponData();
    const weaponId = weaponSlots[activeSlot];
    return weapons[weaponId];
  };

  const getWeaponElement = () => document.querySelector("[data-weapon]");
  const getWorldElement = () => document.querySelector("[data-world]");

  const updateWeaponSprite = () => {
    const weapon = getEquippedWeapon();
    const weaponEl = getWeaponElement();
    if (!weapon || !weaponEl) {
      return;
    }
    weaponEl.src = weapon.sprite;
  };

  const aimWeapon = (target) => {
    const mapApi = window.SCRAPPO_MAP;
    const weaponEl = getWeaponElement();
    if (!mapApi || !weaponEl || typeof mapApi.getPlayerPosition !== "function") {
      return;
    }

    const playerPos = mapApi.getPlayerPosition();
    let angle = 0;
    if (target) {
      angle = Math.atan2(target.y - playerPos.y, target.x - playerPos.x);
    }
    const degrees = angle * (180 / Math.PI);
    weaponEl.style.transform = `translate(-50%, -50%) rotate(${degrees.toFixed(1)}deg)`;
  };

  const spawnDamageNumber = (position, amount) => {
    const world = getWorldElement();
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

  const createBullet = (weapon, target) => {
    const mapApi = window.SCRAPPO_MAP;
    const world = getWorldElement();
    if (!mapApi || !world || !target || typeof mapApi.getPlayerPosition !== "function") {
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
    const startX = playerPos.x + dirX * offset;
    const startY = playerPos.y + dirY * offset;
    const angle = Math.atan2(dirY, dirX);

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

    bulletId += 1;
    const id = `bullet-${bulletId}`;
    bullets.set(id, {
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
    bullets.forEach((bullet) => bullet.el.remove());
    bullets.clear();
  };

  const findTarget = (weapon) => {
    const mapApi = window.SCRAPPO_MAP;
    if (!mapApi || typeof mapApi.getMobTargets !== "function") {
      return null;
    }
    const mobs = mapApi.getMobTargets();
    const playerPos = mapApi.getPlayerPosition();
    let closest = null;
    let closestDist = Infinity;

    mobs.forEach((mob) => {
      const dx = mob.x - playerPos.x;
      const dy = mob.y - playerPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= weapon.range && dist < closestDist) {
        closestDist = dist;
        closest = mob;
      }
    });

    return closest;
  };

  const shoot = (weapon, target, now) => {
    if (createBullet(weapon, target)) {
      lastShotAt = now;
    }
  };

  const updateBullets = (delta) => {
    if (!bullets.size) {
      return;
    }

    const mapApi = window.SCRAPPO_MAP;
    if (!mapApi || typeof mapApi.getMapSize !== "function" || typeof mapApi.getMobTargets !== "function") {
      return;
    }

    const mapSize = mapApi.getMapSize();
    const mobs = mapApi.getMobTargets();

    bullets.forEach((bullet, id) => {
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
        bullets.delete(id);
        return;
      }

      if (bullet.x < 0 || bullet.y < 0 || bullet.x > mapSize || bullet.y > mapSize) {
        bullet.el.remove();
        bullets.delete(id);
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
          if (result && result.position) {
            spawnDamageNumber(result.position, bullet.damage);
          } else {
            spawnDamageNumber({ x: mob.x, y: mob.y }, bullet.damage);
          }
          bullet.el.remove();
          bullets.delete(id);
          break;
        }
      }
    });
  };

  const tick = (now) => {
    if (!running) {
      rafId = null;
      return;
    }

    const delta = Math.min(0.05, (now - lastTick) / 1000);
    lastTick = now;

    const weapon = getEquippedWeapon();
    if (!weapon) {
      updateBullets(delta);
      rafId = requestAnimationFrame(tick);
      return;
    }

    const target = findTarget(weapon);
    aimWeapon(target);

    const cooldown = 1000 / weapon.fireRate;
    if (target && now - lastShotAt >= cooldown) {
      shoot(weapon, target, now);
    }

    updateBullets(delta);
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) {
      return;
    }
    running = true;
    lastShotAt = performance.now();
    lastTick = lastShotAt;
    clearBullets();
    updateWeaponSprite();
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
    clearBullets();
  };

  window.SCRAPPO_WEAPON_SYSTEM = {
    start,
    stop,
    getSlots: () => weaponSlots.slice(),
    setActiveSlot: (index) => {
      if (index >= 0 && index < SLOT_COUNT) {
        activeSlot = index;
        updateWeaponSprite();
      }
    }
  };
})();
