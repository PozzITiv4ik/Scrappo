import { internal } from "./internal.js";

const { state } = internal;

const updateWeaponSprite = () => {
  const weapons = internal.getWeaponData();
  state.hands.forEach((hand) => {
    const weaponId = state.weaponSlots[state.handSlots[hand]];
    const weapon = weapons[weaponId];
    const weaponEl = internal.getWeaponElement(hand);
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

internal.sprites = {
  updateWeaponSprite
};
