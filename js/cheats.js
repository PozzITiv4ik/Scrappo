(() => {
  const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const addGold = (amount = 1000) => {
    const mapApi = window.SCRAPPO_MAP;
    if (!mapApi || typeof mapApi.grantPlayerGold !== "function") {
      return { ok: false, reason: "map-unavailable" };
    }
    const value = Math.max(0, Math.round(toNumber(amount, 0)));
    if (!value) {
      return { ok: false, reason: "invalid-amount" };
    }
    mapApi.grantPlayerGold(value);
    const total = typeof mapApi.getPlayerGold === "function" ? mapApi.getPlayerGold() : null;
    return { ok: true, amount: value, total };
  };

  window.SCRAPPO_CHEATS = {
    gold: addGold
  };
})();
