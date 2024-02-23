import { clamp } from "../../../../../../utilities";
import { getAngleOffset } from "../../../../../../utilities/offset";
import { Player } from "../../../Player";
import { Projectile } from "../../../../../Floor/entities/Projectile/Projectile";

import { Weapon } from "../Weapon";

export class Rocket extends Weapon {
  heldProjectile: Projectile | null = null;
  // force: number = 0;
  // maxForce = 3000;
  maxSpeed = 0;
  forceIncrement = 50;
  spread = 0; //times maxSpread
  maxSpread = 6;

  force = { current: 0, multiplier: 1, target: 1 };
  amountPerShot = 1;
  isLoaded = false;
  constructor(player: Player, key: string, durability: number) {
    super(player, key, durability);
    switch (key) {
      case "rocket-basic":
        this.force.multiplier = 0.6;
        this.maxSpeed = 3000;
        this.amountPerShot = 1;
        this.setDurability(12);
        break;
    }
  }
  update(delta: number) {
    this.player.force = this.force.current;
    if (this.isBroken || this.durability.current <= 0) {
      this.isBroken = true;
      return;
    }
    if (this.player.isPointerJustDown.right) {
      if (this.player.projectiles.rockets) this.shoot();
    }
  }

  shoot() {
    const offset = 150;
    const { x, y } = getAngleOffset(
      this.player.x,
      this.player.y,
      this.player.angle,
      offset
    );
    new Projectile(this.player.floor, "rocket", {
      x,
      y,
      angle: this.player.angle,
      shooter: this.player,
      // speed: this.maxSpeed,
      maxSpeed: this.maxSpeed,
      speed: Math.abs(Math.max(this.player.velocityX, this.player.velocityY)),
      damage: 10,
      spread: this.spread * this.maxSpread,
    });
    this.player.projectiles.rockets--;
  }
}
