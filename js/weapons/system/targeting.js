(() => {
  const internal = window.SCRAPPO_WEAPON_INTERNAL;
  if (!internal) {
    return;
  }

  const findTarget = (weapon) => {
    const mapApi = internal.getMapApi();
    if (!mapApi || typeof mapApi.getMobTargets !== "function" || typeof mapApi.getPlayerPosition !== "function") {
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

  internal.targeting = {
    findTarget
  };
})();
