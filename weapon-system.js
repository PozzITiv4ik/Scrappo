(() => {
  const SLOT_COUNT = 4;
  const weaponSlots = new Array(SLOT_COUNT).fill(null);
  weaponSlots[0] = "pistol";
  let activeSlot = 0;

  let lastShotAt = 0;
  let running = false;
  let rafId = null;

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
    const mapApi = window.SCRAPPO_MAP;
    if (!mapApi || typeof mapApi.applyDamage !== "function") {
      return;
    }
    const result = mapApi.applyDamage(target.id, weapon.damage);
    if (result && result.position) {
      spawnDamageNumber(result.position, weapon.damage);
    } else {
      spawnDamageNumber(target, weapon.damage);
    }
    lastShotAt = now;
  };

  const tick = (now) => {
    if (!running) {
      rafId = null;
      return;
    }

    const weapon = getEquippedWeapon();
    if (!weapon) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    const target = findTarget(weapon);
    aimWeapon(target);

    const cooldown = 1000 / weapon.fireRate;
    if (target && now - lastShotAt >= cooldown) {
      shoot(weapon, target, now);
    }

    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) {
      return;
    }
    running = true;
    lastShotAt = performance.now();
    updateWeaponSprite();
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
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
