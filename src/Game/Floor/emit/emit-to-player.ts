import { io } from "../../../server";

import Floor from "../Floor";

export function emit(this: Floor) {
  for (const [id, player] of this.players) {
    const {
      id,
      name,
      color,
      floor,
      state,
      x,
      y,
      angle,
      force,
      health,
      gold,
      inventory,
      projectiles,
      finalSecondsAlive,
      primaryWeapon,
      dialog,
      velocityX,
      velocityY,
      boost,
      bowCustomization,
      shield,
    } = player;
    this.emissionData.client = {
      id,
      name,
      color,
      state,
      force,
      floor: floor.index,
      x,
      y,
      velocityX,
      velocityY,
      boost: boost.current,
      angle,
      health,
      gold,
      secondsAlive: finalSecondsAlive,
      overload: primaryWeapon.overload.current,
      isOverloaded: primaryWeapon.overload.isOverloaded,
      shield: {
        amount: shield.current,
        isActive: shield.isActive,
        isCharging: false,
      },
      projectiles,
      inventory: {
        size: { rows: inventory.rows, cols: inventory.cols },
        itemSlots: player.state === "in-inventory" ? inventory.itemSlots : [],
        selectedSlot: player.inventory.selectedSlot,
        hotkeys: inventory.hotkeys,
        hotkeyIndex: inventory.hotkeyIndex,
      },
      dialog,
      bowCustomization,
    };

    if (!this.tracker.emitTo.has(player)) this.emissionData.tracker = [];
    io.to(id).emit("Game State Update", this.emissionData);
  }
}
