import { Asteroid } from "../../Asteroid/Pot";
import { Projectile } from "../Projectile";

export function onAsteroidImpact(this: Projectile, pot: Asteroid) {
  switch (this.type) {
    case "arrow":
      if (this.penetrates) {
        this.state = "active";
      } else {
        this.state = "destroyed";
      }
      // if (this.state === "active") {
      // this.onTarget = pot;
      // pot.attachedProjectiles.set([this.x - pot.x, this.y - pot.y], this);
      pot.hit(1, this.type);
      // }
      break;
    case "rocket":
      this.state = "destroyed";

      // if (this.state === "active") {
      // this.onTarget = pot;
      // pot.attachedProjectiles.set([this.x - pot.x, this.y - pot.y], this);
      pot.hit(Infinity, this.type);
      // }
      break;
    case "boomerang":
      if (this.state === "active") {
        pot.hit(3, this.type);
        if (pot) {
          this.state = "on-object";
        } else {
          this.state = "on-ground";
        }
      }
      break;
    case "pot":
      if (this.state === "active") {
        pot.hit(3, this.type);
        if (pot) {
          this.state = "on-object";
        } else {
          this.state = "on-ground";
        }
      }
      break;
    case "spear":
    case "spear-collider":
    case "sword-collider":
      if (this.state === "active") {
        pot.hit(3, this.type);
        if (pot) {
          this.state = "on-object";
        } else {
          this.state = "on-ground";
        }
      }
      break;
  }
}
