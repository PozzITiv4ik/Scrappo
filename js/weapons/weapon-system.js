(() => {
  const SLOT_COUNT = 4;
  const weaponSlots = new Array(SLOT_COUNT).fill(null);
  weaponSlots[0] = "pistol";
  const handSlots = { right: 0, left: 1 };
  const hands = ["right", "left"];

  let lastShotAt = { right: 0, left: 0 };
  let lastTick = 0;
  let running = false;
  let rafId = null;
  let bulletId = 0;
  const bullets = new Map();

  const getWeaponData = () => window.SCRAPPO_WEAPONS || {};
  const getAbilityApi = () => window.SCRAPPO_ABILITY_SYSTEM;
  const applyWeaponModifiers = (weapon) => {
    const abilityApi = getAbilityApi();
    if (!abilityApi || typeof abilityApi.getCombatModifiers !== "function") {
      return weapon;
    }
    const mods = abilityApi.getCombatModifiers();
    const damageMultiplier = typeof mods.damageMultiplier === "number" ? mods.damageMultiplier : 1;
    const fireRateMultiplier = typeof mods.fireRateMultiplier === "number" ? mods.fireRateMultiplier : 1;
    const damageFlat = typeof mods.damageFlat === "number" ? mods.damageFlat : 0;
    const damage = Math.max(1, Math.round((weapon.damage + damageFlat) * damageMultiplier));
    const fireRate = Math.max(0.1, weapon.fireRate * fireRateMultiplier);
    return { ...weapon, damage, fireRate };
  };
  const getWeaponForHand = (hand) => {
    const weapons = getWeaponData();
    const weaponId = weaponSlots[handSlots[hand]];
    const weapon = weapons[weaponId];
    if (!weapon) {
      return null;
    }
    return applyWeaponModifiers(weapon);
  };

  const getWeaponElement = (hand) => document.querySelector(`[data-weapon="${hand}"]`);
  const getWorldElement = () => document.querySelector("[data-world]");
  const getPlayerElement = () => document.querySelector("[data-player]");

  const updateWeaponSprite = () => {
    const weapons = getWeaponData();
    hands.forEach((hand) => {
      const weaponId = weaponSlots[handSlots[hand]];
      const weapon = weapons[weaponId];
      const weaponEl = getWeaponElement(hand);
      if (!weaponEl) {
        return;
      }
      if (!weapon) {
        weaponEl.hidden = true;
        return;
      }
      weaponEl.hidden = false;
      weaponEl.src = weapon.sprite;
      if (typeof weapon.size === "number") {
        weaponEl.style.width = `${weapon.size}px`;
      }
    });
  };

  const aimWeapon = (hand, target) => {
    const mapApi = window.SCRAPPO_MAP;
    const weaponEl = getWeaponElement(hand);
    if (!mapApi || !weaponEl || typeof mapApi.getPlayerPosition !== "function") {
      return;
    }

    const playerPos = mapApi.getPlayerPosition();
    let angle = 0;
    if (target) {
      angle = Math.atan2(target.y - playerPos.y, target.x - playerPos.x);
    }
    const degrees = angle * (180 / Math.PI);
    weaponEl.style.setProperty("--weapon-rotation", `${degrees.toFixed(1)}deg`);
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

  const getWeaponOffset = (hand) => {
    const playerEl = getPlayerElement();
    if (!playerEl) {
      return { x: 0, y: 0 };
    }
    const styles = getComputedStyle(playerEl);
    const rawX = styles.getPropertyValue(`--weapon-${hand}-x`);
    const rawY = styles.getPropertyValue(`--weapon-${hand}-y`);
    return {
      x: Number.parseFloat(rawX) || 0,
      y: Number.parseFloat(rawY) || 0
    };
  };

  const parseOriginValue = (value, size) => {
    if (!value) {
      return size / 2;
    }
    const trimmed = value.trim();
    if (trimmed.endsWith("%")) {
      const percent = Number.parseFloat(trimmed);
      if (!Number.isNaN(percent)) {
        return (size * percent) / 100;
      }
      return size / 2;
    }
    const parsed = Number.parseFloat(trimmed);
    return Number.isNaN(parsed) ? size / 2 : parsed;
  };

  const getWeaponMetrics = (weaponEl, weapon) => {
    const styles = getComputedStyle(weaponEl);
    const width = Number.parseFloat(styles.width) || weapon.size || 0;
    let height = Number.parseFloat(styles.height) || 0;
    const naturalWidth = weaponEl.naturalWidth || weapon.muzzle?.width || 0;
    const naturalHeight = weaponEl.naturalHeight || weapon.muzzle?.height || 0;
    if (!height && width && naturalWidth && naturalHeight) {
      height = (width * naturalHeight) / naturalWidth;
    }
    if (!height && width) {
      height = width;
    }
    const baseWidth = weapon.muzzle?.width || naturalWidth || width;
    const baseHeight = weapon.muzzle?.height || naturalHeight || height;
    return {
      width,
      height,
      baseWidth,
      baseHeight
    };
  };

  const getTransformOrigin = (weaponEl, size) => {
    const origin = getComputedStyle(weaponEl).transformOrigin || "";
    const parts = origin.split(" ");
    return {
      x: parseOriginValue(parts[0], size.width),
      y: parseOriginValue(parts[1], size.height)
    };
  };

  const getMuzzleWorldPosition = (hand, weapon, angle, playerPos, playerSize) => {
    const weaponEl = getWeaponElement(hand);
    if (!weaponEl || !weapon.muzzle) {
      return null;
    }

    const anchor = getWeaponOffset(hand);
    const centerX = playerPos.x - playerSize / 2 + anchor.x;
    const centerY = playerPos.y - playerSize / 2 + anchor.y;
    const metrics = getWeaponMetrics(weaponEl, weapon);
    if (!metrics.width || !metrics.height || !metrics.baseWidth || !metrics.baseHeight) {
      return null;
    }

    const scaleX = metrics.width / metrics.baseWidth;
    const scaleY = metrics.height / metrics.baseHeight;
    const localX = weapon.muzzle.x * scaleX;
    const localY = weapon.muzzle.y * scaleY;
    const origin = getTransformOrigin(weaponEl, metrics);
    const relX = localX - origin.x;
    const relY = localY - origin.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotatedX = relX * cos - relY * sin;
    const rotatedY = relX * sin + relY * cos;
    const rotatedLocalX = origin.x + rotatedX;
    const rotatedLocalY = origin.y + rotatedY;
    const topLeftX = centerX - metrics.width / 2;
    const topLeftY = centerY - metrics.height / 2;
    return {
      x: topLeftX + rotatedLocalX,
      y: topLeftY + rotatedLocalY
    };
  };

  const createBullet = (hand, weapon, target) => {
    const mapApi = window.SCRAPPO_MAP;
    const world = getWorldElement();
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
    const anchor = getWeaponOffset(hand);
    const anchorX = playerPos.x - playerSize / 2 + anchor.x;
    const anchorY = playerPos.y - playerSize / 2 + anchor.y;
    const angle = Math.atan2(dirY, dirX);
    const muzzle = getMuzzleWorldPosition(hand, weapon, angle, playerPos, playerSize);
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

  const shoot = (hand, weapon, target, now) => {
    if (createBullet(hand, weapon, target)) {
      if (window.SCRAPPO_SOUND && typeof window.SCRAPPO_SOUND.playShot === "function") {
        window.SCRAPPO_SOUND.playShot();
      }
      lastShotAt[hand] = now;
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
          if (window.SCRAPPO_SOUND && typeof window.SCRAPPO_SOUND.playHit === "function") {
            window.SCRAPPO_SOUND.playHit();
          }
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

    hands.forEach((hand) => {
      const weapon = getWeaponForHand(hand);
      if (!weapon) {
        aimWeapon(hand, null);
        return;
      }

      const target = findTarget(weapon);
      aimWeapon(hand, target);

      const cooldown = 1000 / weapon.fireRate;
      if (target && now - lastShotAt[hand] >= cooldown) {
        shoot(hand, weapon, target, now);
      }
    });

    updateBullets(delta);
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) {
      return;
    }
    running = true;
    const now = performance.now();
    lastShotAt = { right: now, left: now };
    lastTick = now;
    clearBullets();
    updateWeaponSprite();
    rafId = requestAnimationFrame(tick);
  };

  const pause = () => {
    if (!running) {
      return;
    }
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
  };

  const resume = () => {
    if (running) {
      return;
    }
    running = true;
    lastTick = performance.now();
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  };

  const stop = () => {
    pause();
    clearBullets();
  };

  window.SCRAPPO_WEAPON_SYSTEM = {
    start,
    pause,
    resume,
    stop,
    getSlots: () => weaponSlots.slice(),
    setActiveSlot: (index) => {
      if (index >= 0 && index < SLOT_COUNT) {
        handSlots.right = index;
        updateWeaponSprite();
      }
    },
    setHandSlot: (hand, index) => {
      if (handSlots[hand] !== undefined && index >= 0 && index < SLOT_COUNT) {
        handSlots[hand] = index;
        updateWeaponSprite();
      }
    }
  };
})();
