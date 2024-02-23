import {
  CELL_SIZE,
  MAX_ASTEROID_RADIUS,
  MIN_ASTEROID_RADIUS,
} from "../../../../constants";
import { getRandomInt, getRandomLowerInt, oneIn } from "../../../../utilities";
import Floor from "../../Floor";
import { ItemDrop } from "../ItemDrop/ItemDrop";
import { Player } from "../../../entities/Player/Player";
import { Projectile } from "../Projectile/Projectile";
import { Collider } from "../../../entities/Collider/Collider";
import { Direction } from "../../../../types";
import { Wall } from "../Wall/Wall";
import { Emission, EmissionType, GridSpriteType } from "../../types";
import { RandomPolygon } from "../../../entities/Polygon/Polygon";
import { Loot } from "../../../entities/Loot/Loot";
import { ProjectileType } from "../Projectile/types";

const MAX_VELOCITY = 450;
const MAX_ROTATION = 64;

export class Asteroid extends RandomPolygon {
  //TODO CircularCollider
  floor: Floor;
  originIndex: number;
  isBeingCarried: boolean = false;
  id: string;
  touchedCells: string[] = [];
  type: "asteroid-metal" | "asteroid-dirt" | "asteroid-iron";
  damage: number = 0;
  hp: number = 0;

  attachedProjectiles: Map<[number, number], Projectile> = new Map(); //xOffset,yOffset,Projectile

  maxSpeed = 0;
  acceleration = 25;
  deceleration = Infinity;
  //TODO Randomized sizes

  velocityX = getRandomLowerInt(-MAX_VELOCITY, MAX_VELOCITY);
  velocityY = getRandomLowerInt(-MAX_VELOCITY, MAX_VELOCITY);
  rotation = getRandomInt(-MAX_ROTATION, MAX_ROTATION);
  currentDirection: Direction | null = null;
  isExplosive?: boolean;
  didExplode?: boolean;
  constructor(
    floor: Floor,
    originIndex: number,
    x: number,
    y: number,
    initialRadius: number
  ) {
    super(x, y, initialRadius);

    this.floor = floor;
    this.id = `${originIndex + "-" + new Date().getTime()}_${Math.floor(
      Math.random() * 100
    )}`;

    if (originIndex % 4 === 0) {
      this.type = "asteroid-metal";
      this.hp = Infinity;
    } else {
      this.type = "asteroid-dirt";
      this.hp = 1;
      // if (originIndex % 2 === 0) {
      // this.type = "asteroid-dirt";
      // this.hp = 1;
      // } else {
      // this.type = "asteroid-iron";
      // this.hp = 2;
      // }
    }

    this.originIndex = originIndex;
    this.floor.tracker.track(this);

    this.maxSpeed = 500;

    this.damage = Math.max(Math.min(Math.floor(this.radius / 5), 50), 1);

    if (!this.floor.asteroidOrigins.has(originIndex)) {
      this.floor.asteroidOrigins.set(originIndex, new Set([this]));
    } else {
      const set = this.floor.asteroidOrigins.get(originIndex);
      set?.add(this);
    }

    // if (this.radius < MIN_ASTEROID_RADIUS) {
    //   this.remove();
    //   return;
    // } else if (this.radius > MAX_ASTEROID_RADIUS * 1.5) {
    //   this.remove();
    //   return;
    // }
    // console.log(this.hp);
    this.floor.updaters.add(this);
    this.floor.emissions.push({
      type: this.type as EmissionType,
      id: this.id,
      y: this.y,
      x: this.x,
      vertices: this.vertices,
    });
  }
  collide(player: Player) {
    if (player.iFrames) return;
    player.hurt(this.damage, 0.5);

    // const angleInRadians = (this.angle * Math.PI) / 180; // Convert angle to radians
    // const accelerationX = this.acceleration * 0.75 * Math.cos(angleInRadians);
    // const accelerationY = this.acceleration * 0.75 * Math.sin(angleInRadians);

    if (!player.shield.isActive) {
      player.velocityX = -player.velocityX * 0.5;
      player.velocityY = -player.velocityY * 0.5;

      const xDiff = this.velocityX - player.velocityX;
      const yDiff = this.velocityY - player.velocityY;

      this.velocityX += xDiff * 0.5; //TODO based on size
      this.velocityY += yDiff * 0.5;
    }

    // player.hurt(this.size);
    this.hp--;
    if (this.hp <= 0) {
      this.remove(true);
    }
  }

  applyMovement(delta: number) {
    // Limit speed
    if (this.velocityX > this.maxSpeed) this.velocityX = this.maxSpeed;
    let x = this.x + this.velocityX * delta;

    if (this.velocityY > this.maxSpeed) this.velocityY = this.maxSpeed;

    let y = this.y + this.velocityY * delta;

    this.x = x;
    this.y = y;
  }

  hit(amount: number, projectile: ProjectileType) {
    this.hp -= amount;

    if (projectile === "rocket") {
      this.hp = 0;
    }

    // if (this.hp <= 0) {
    //   for (const [[], projectile] of this.attachedProjectiles) {
    //     if (this.isExplosive) {
    //       projectile.state = "destroyed";
    //     } else {
    //       projectile.state = "on-ground";
    //     }
    //   }

    //   if (this.isExplosive) {
    //     this.didExplode = true;

    //     for (const pos of this.touchedCells) {
    //       const cell = this.floor.tracker.cells.get(pos);
    //       if (!cell) continue;
    //       for (const obj of cell) {
    //         if (obj === this) continue;
    //         if (obj instanceof Asteroid) {
    //           if (!obj.didExplode) obj.hit(Infinity);
    //         } else if (obj instanceof Player) {
    //           obj.hurt(50);
    //         } else if (obj instanceof Projectile) {
    //           obj.state === "destroyed";
    //           obj.emit();
    //         }
    //       }
    //     }
    // }

    if (this.hp <= 0) {
      this.floor.emissions.push({
        type: this.type as EmissionType,
        id: this.id,
        y: this.y,
        x: this.x,
        hit: true,
      });

      this.remove(true);

      if (projectile === "rocket") {
        for (const pos of this.touchedCells) {
          const cell = this.floor.tracker.cells.get(pos);
          if (!cell) continue;
          for (const obj of cell) {
            if (obj === this) continue;
            if (obj instanceof Asteroid) {
              obj.remove(true);
            }
          }
        }
      }
    }
  }

  update(delta: number) {
    this.applyMovement(delta);
    for (const [[xOffset, yOffset], projectile] of this.attachedProjectiles) {
      if (projectile && projectile.state === "on-object") {
        projectile.x = this.x + xOffset;
        projectile.y = this.y + yOffset;
        projectile.update(delta);
      }
    }

    if (
      this.velocityX > 0 &&
      this.x - this.width / 2 > this.floor.cols * CELL_SIZE
    ) {
      this.x = -this.width / 2;
    }
    if (
      this.velocityY > 0 &&
      this.y - this.height / 2 > this.floor.rows * CELL_SIZE
    ) {
      this.y = -this.height / 2;
    }
    if (this.velocityX < 0 && this.x + this.width / 2 < 0) {
      this.x = this.floor.cols * CELL_SIZE + this.width / 2;
    }
    if (this.velocityY < 0 && this.y + this.height / 2 < 0) {
      this.y = this.floor.rows * CELL_SIZE + this.height / 2;
    }
    this.getBoundingBox();

    this.angle += this.rotation * delta;

    this.floor.tracker.track(this);
    this.floor.emissions.push({
      type: this.type as EmissionType,
      id: this.id,
      x: this.x,
      y: this.y,
      angle: this.angle,
      hp: this.hp,
      vertices: this.vertices,
    });
  }

  remove(split?: boolean) {
    if (split && this.radius > 100) {
      new Asteroid(
        this.floor,
        this.originIndex,
        this.x,
        this.y,
        this.radius / 2
      );
      new Asteroid(
        this.floor,
        this.originIndex,
        this.x + 1,
        this.y + 1,
        this.radius / 2
      );
    }

    if (oneIn(4)) {
      new ItemDrop(this.floor, "random", this.y, this.x);
    }

    // for (const [[xOffset, yOffset], projectile] of this.attachedProjectiles) {
    //   if (projectile && projectile.state === "on-object") {
    //     projectile.state = "on-ground";
    //   }
    // }

    const originSet = this.floor.asteroidOrigins.get(this.originIndex);
    originSet?.delete(this);

    this.floor.emissions.push({
      type: this.type as EmissionType,
      id: this.id,
      hit: true,
      remove: true,
    });

    this.floor.updaters.delete(this);
    this.floor.tracker.remove(this);
  }
}
