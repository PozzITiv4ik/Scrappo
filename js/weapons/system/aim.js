(() => {
  const internal = window.SCRAPPO_WEAPON_INTERNAL;
  if (!internal) {
    return;
  }

  const getWeaponOffset = (hand) => {
    const playerEl = internal.getPlayerElement();
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
    const weaponEl = internal.getWeaponElement(hand);
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

  const aimWeapon = (hand, target) => {
    const mapApi = internal.getMapApi();
    const weaponEl = internal.getWeaponElement(hand);
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

  internal.aim = {
    aimWeapon,
    getWeaponOffset,
    getMuzzleWorldPosition
  };
})();
