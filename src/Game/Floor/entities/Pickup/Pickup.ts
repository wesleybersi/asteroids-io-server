import { CELL_SIZE } from "../../../../constants";
import { clamp } from "../../../../utilities";
import Floor from "../../Floor";
import { Player } from "../../../entities/Player/Player";
import { createNewWeapon } from "../../../entities/Player/entities/Weapon/create-weapon";
import {
  WeaponTier,
  WeaponType,
} from "../../../entities/Player/entities/Weapon/types";
import { Bow } from "../../../entities/Player/entities/Weapon/weapons/Bow";
import { Crossbow } from "../../../entities/Player/entities/Weapon/weapons/Crossbow";
import { PickupWeaponConfig } from "./types";

export class Pickup {
  floor: Floor;
  row: number;
  col: number;
  x: number;
  y: number;
  width = CELL_SIZE / 2;
  height = CELL_SIZE / 2;
  didEmit: boolean = false;
  timeRemaining = clamp(Math.floor(Math.random() * 60), 20, 60);
  canBeRemoved = false;
  constructor(floor: Floor, row: number, col: number) {
    this.floor = floor;
    this.row = row;
    this.col = col;
    this.x = col * CELL_SIZE + CELL_SIZE / 2;
    this.y = row * CELL_SIZE + CELL_SIZE / 2;
    floor.pickups.set(`${row},${col}`, this);
    floor.addToTrackerCell(this, row, col);
  }
  remove() {
    this.floor.pickups.delete(`${this.row},${this.col}`);
    const tracker = this.floor.tracker.get(`${this.row},${this.col}`);
    tracker?.delete(this);
  }
}

export class WeaponPickup extends Pickup {
  weaponType: WeaponType;
  weaponTier: WeaponTier;
  constructor(
    grid: Floor,
    row: number,
    col: number,
    config: PickupWeaponConfig
  ) {
    super(grid, row, col);
    this.weaponType = config.type;
    this.weaponTier = config.tier;

    //TODO emission
  }
  update(delta: number) {
    if (!this.canBeRemoved) return;
  }

  get(player: Player) {
    // const activeWeapon = player.weaponry[player.weaponIndex];
    // if (activeWeapon instanceof Bow) {
    //   if (activeWeapon.heldProjectile) {
    //     activeWeapon.heldProjectile.state = "OnGround";
    //     activeWeapon.heldProjectile = null;
    //   }
    // } else if (activeWeapon instanceof Crossbow) {
    //   if (activeWeapon.isLoaded) {
    //     activeWeapon.isLoaded = false;
    //     player.projectiles.arrows++;
    //   }
    // }

    if (player.weaponry.length < 5) {
      player.weaponry.push(
        createNewWeapon(player, {
          type: this.weaponType,
          tier: this.weaponTier,
        })
      );
      player.weaponIndex = player.weaponry.length - 1;

      // this.floor.emissions.push({type:"weapon-pickup",})
    } else {
      // const swappedWeapon = player.weaponry.splice(
      //   player.weaponIndex,
      //   1,
      //   createNewWeapon(player, {
      //     type: this.weaponType,
      //     tier: this.weaponTier,
      //   })
      // )[0];
      // if (swappedWeapon) {
      //   this.weaponTier = swappedWeapon.tier;
      //   this.weaponType = swappedWeapon.type;
      //   this.didEmit = false;
      // }
    }
  }
}
