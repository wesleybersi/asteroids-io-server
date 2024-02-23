import { CELL_SIZE } from "../../../../constants";
import { oneIn, randomNum } from "../../../../utilities";
import Floor from "../../Floor";
import { EmissionType } from "../../types";
import { WeaponPickup } from "../Pickup/Pickup";
import {
  getRandomWeaponTier,
  getRandomWeaponType,
} from "../Pickup/random-weapon";
import { Player } from "../../../entities/Player/Player";
import { Collider } from "../../../entities/Collider/Collider";

export type ItemType =
  | "coin"
  | "key"
  | "arrow"
  | "key-gold"
  | "key-silver"
  | "five-arrows"
  | "potion-red"
  | "potion-blue"
  | "potion-green"
  | "heart"
  | "missile";

export class ItemDrop extends Collider {
  id: string;
  floor: Floor;
  type: ItemType;
  touchedCells: string[] = [];
  lifespan = 150;
  flashTreshold = 30;
  isFlashing = false;
  wasCollected = false;
  constructor(floor: Floor, type: ItemType | "random", y: number, x: number) {
    super(x, y, 64, 64, false);
    this.floor = floor;
    if (type === "random") {
      const types: ItemType[] = [
        // "coin",
        // "heart",
        // "potion-red",
        "potion-blue",
        "potion-green",
        "missile",
        // "arrow",
        // "five-arrows",
      ];
      this.type = types[randomNum(types.length)];
    } else {
      this.type = type;
    }
    this.id = `${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`;
    this.floor.tracker.track(this, this.width + 300, this.height + 300);
    this.floor.emissions.push({
      id: this.id,
      type: ("drop-" + this.type) as EmissionType,
      y,
      x,
      create: true,
    });
    this.floor.updaters.add(this);
  }
  update(delta: number) {
    if (this.wasCollected) return;
    this.floor.tracker.track(this, this.width + 300, this.height + 300);
    this.updateBoundingBox();
    this.lifespan -= 10 * delta;
    if (this.lifespan <= 0) {
      this.remove();
      return;
    }

    if (!this.isFlashing && Math.floor(this.lifespan) <= 30) {
      this.isFlashing = true;
      this.floor.emissions.push({
        id: this.id,
        x: this.x,
        y: this.y,
        type: ("drop-" + this.type) as EmissionType,
        flash: true,
      });
    } else {
      this.floor.emissions.push({
        id: this.id,
        x: this.x,
        y: this.y,
        type: ("drop-" + this.type) as EmissionType,
      });
    }
  }

  get(player: Player) {
    switch (this.type) {
      case "coin":
        player.gold += 10;
        break;
      case "key-silver":
      case "key-gold":

      case "arrow":
        player.inventory.pushItem(this.type);

        break;
      case "missile":
        player.projectiles.rockets++;
        break;
      case "potion-blue":
        if (player.shield.current < 1) {
          player.shield.current = Math.min(player.shield.current + 0.05, 1);
        }

        break;
      case "potion-green":
        if (player.health < 100) {
          player.health = Math.min(player.health + 5, 100);
        }

        break;
      case "heart":
        if (player.health < 100) {
          player.health = Math.min(player.health + 25, 100);
        }
        break;
    }

    this.wasCollected = true;
    this.remove();
  }
  remove() {
    console.log("It is removed");
    this.floor.emissions.push({
      type: ("drop-" + this.type) as EmissionType,
      id: this.id,
      y: this.y,
      x: this.x,
      remove: true,
    });
    this.floor.tracker.remove(this);
    this.floor.lastEmissions.delete(this.id);
    this.floor.updaters.delete(this);
  }
}
