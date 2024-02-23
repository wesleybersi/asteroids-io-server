import { clamp } from "../../../../../../utilities";
import { getAngleOffset } from "../../../../../../utilities/offset";
import { Player } from "../../../Player";
import { Projectile } from "../../../../../Floor/entities/Projectile/Projectile";

import { Weapon } from "../Weapon";

export class Blaster extends Weapon {
  heldProjectile: Projectile | null = null;
  // force: number = 0;
  // maxForce = 3000;
  maxSpeed = 0;
  forceIncrement = 50;
  spread = 0; //times maxSpread
  maxSpread = 6;
  overload = {
    current: 0,
    multiplier: 0.5,
    isOverloaded: false,
    shootTimer: 1,
  };
  shootInterval = { current: 0, multiplier: 7 }; // shoots at 1

  force = { current: 0, multiplier: 1, target: 1 };

  amountPerShot = 1;
  isLoaded = false;
  constructor(player: Player, key: string, durability: number) {
    super(player, key, durability);
    switch (key) {
      case "blaster-basic":
        this.maxSpeed = 2250;
        this.amountPerShot = 1;
        this.setDurability(12);
        break;
    }
  }
  update(delta: number) {
    if (this.overload.shootTimer <= 0 || this.overload.isOverloaded) {
      this.overload.shootTimer = 0;
      if (this.overload.isOverloaded) {
        this.overload.current -= delta * (this.overload.multiplier / 2);
      } else {
        this.overload.current -= delta * this.overload.multiplier;
      }
    } else {
      this.overload.shootTimer -= delta * 5;
    }

    if (this.overload.current <= 0) {
      this.overload.isOverloaded = false;
      this.overload.current = 0;
    }
    if (this.overload.isOverloaded) {
      console.log("OVERLOADED");
      return;
    }
    console.log(this.overload.current);
    this.player.force = this.force.current;
    if (this.isBroken || this.durability.current <= 0) {
      this.isBroken = true;
      return;
    }
    if (this.player.isPointerDown.left) {
      console.log(this.shootInterval.current);
      if (this.shootInterval.current === 0) {
        this.shoot();
        this.overload.current += delta * this.overload.multiplier * 7;
        this.overload.shootTimer = 1;
        if (this.overload.current >= 1) {
          this.overload.isOverloaded = true;
        }
      }
      this.shootInterval.current += delta * this.shootInterval.multiplier;
      if (this.shootInterval.current >= 1) this.shootInterval.current = 0;
    } else {
      this.shootInterval.current = 0;
    }
  }

  shoot() {
    const { player } = this;
    const offset = 100;
    const { x, y } = getAngleOffset(player.x, player.y, player.angle, offset);

    new Projectile(player.floor, "arrow", {
      x,
      y,
      angle: player.angle,
      shooter: player,
      speed: this.maxSpeed,
      decceleration: 4,
      // iterations: 100,
      damage: 10,
    });
  }
}
