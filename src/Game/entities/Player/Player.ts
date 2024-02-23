import { allWeapons } from "../../data/weapons";
import Game from "../../Game";
import { CELL_SIZE, PLAYER_SIZE } from "../../../constants";
import { Weapon } from "./entities/Weapon/Weapon";

import { Wall } from "../../Floor/entities/Wall/Wall";
import { Direction } from "../../../types";

import Floor from "../../Floor/Floor";
import onWeaponChange from "./events/on-weapon-change";

import { changeWeapon } from "./controllers/change-weapon";
import { Socket } from "socket.io";
import onMovement from "./events/on-movement";
import { updateCursors } from "./controllers/update-cursors";

import { updatePointerDown } from "./controllers/update-pointer";
import { onPointerDown, onPointerMove } from "./events/on-pointer";
import { updateAngle } from "./controllers/update-angle";

import { action } from "./controllers/action";
import onActionPress from "./events/on-action-press";

import { getRandomInt, randomNum } from "../../../utilities";
import { Spikes } from "../../Floor/entities/Spikes/Spikes";
import { Asteroid } from "../../Floor/entities/Asteroid/Pot";
import { Hole } from "../../Floor/entities/Hole/Hole";
import onReload from "./events/on-reload";
import { reload } from "./controllers/reload";
import { Shooter } from "../../Floor/entities/Shooter/Shooter";
import { inventory } from "./controllers/inventory";
import { onInventory } from "./events/on-inventory";
import { Collider } from "../Collider/Collider";
import { Inventory } from "./entities/Inventory/Inventory";
import { onCustomizeBow } from "./events/on-customize";
import { Projectile } from "../../Floor/entities/Projectile/Projectile";
import onShift from "./events/on-shift";
import { Boomerang } from "./entities/Weapon/weapons/Boomerang";
import onSpace from "./events/on-space";
import { Star } from "../../Floor/entities/Dot/Dot";
import { RandomPolygon } from "../Polygon/Polygon";
import { ItemDrop } from "../../Floor/entities/ItemDrop/ItemDrop";
import { onTrackerRequest } from "./events/on-tracker-request";
import { Bow } from "./entities/Weapon/weapons/Bow";
import { Rocket } from "./entities/Weapon/weapons/Rocket";
import { Blaster } from "./entities/Weapon/weapons/Blaster";

export interface Dialog {
  name: string;
  pages: { text: string }[];
}

export class Player extends Collider {
  isAdmin: boolean = true;

  game: Game;
  socket: Socket;
  floor: Floor;
  state:
    | "moving"
    | "falling"
    | "attacking"
    | "swimming"
    | "in-dialog"
    | "in-inventory"
    | "dead"
    | "chatting" = "moving";

  inventory: Inventory;

  primaryWeapon: Blaster;
  secondaryWeapon: Rocket;

  didDie: boolean = false;
  wasHit: boolean = false;
  id: string;
  name: string;
  health: number;
  color: number;
  velocityX = getRandomInt(50, 250);
  velocityY = getRandomInt(50, 250);
  // maxSpeed = 130;
  // acceleration = 32;
  initialMaxSpeed = 800;
  initialBoostSpeed = 1600;
  initialAcceleration = 36;
  // initialDeceleration = 0.85;
  rotationSpeed = 200;
  iFrames = 2;

  isStartProtected: boolean = true;
  shield = { current: 1, multiplier: 0.15, isActive: false };

  maxSpeed = 0;
  acceleration = 0;
  deceleration = 0;
  secondsAlive: number = 0;
  finalSecondsAlive: number = 0;
  gold: number = 0;
  dialog?: { name: string; text: string[] } = {
    name: "???",
    text: [
      "Goal: Survive",
      "White asteroids can only be destroyed with rockets.",
    ],
  };
  centerMessage: {
    text: string[];
    color: string;
    size: number;
  } | null = null;

  targetAngle = 0; //Angle will always lerp towards targetAngle
  angle: number;
  holdAngle: number | null = null;

  bowCustomization = {
    drawSpeed: 2, //0,1,2,3,4
    velocity: 2,
    accuracy: 2,
  };

  cursors: Direction[] = [];
  isShiftDown: boolean = false;
  isSpaceDown: boolean = false;
  boost = { current: 1, multiplier: 0.25, max: 1, cooldown: false };

  direction = "";
  isPointerDown = { left: false, right: false };
  isPointerJustDown = { left: false, right: false };
  pointerX = 0;
  pointerY = 0;
  attachedProjectiles: Map<[number, number], Projectile> = new Map(); //xOffset,yOffset,Projectile
  force = 0;
  touchedCells: string[] = [];
  shift: boolean = false;
  size = PLAYER_SIZE;
  projectiles = {
    arrows: Infinity,
    rockets: 5,
  };
  //Events
  onMovement: (socket: Socket) => void = onMovement;
  onPointerDown: (socket: Socket) => void = onPointerDown;
  onPointerMove: (socket: Socket) => void = onPointerMove;
  onWeaponChange: (socket: Socket) => void = onWeaponChange;
  onActionPress: (socket: Socket) => void = onActionPress;
  onReload: (socket: Socket) => void = onReload;
  onInventory: (socket: Socket) => void = onInventory;
  onCustomizeBow: (socket: Socket) => void = onCustomizeBow;
  onShift: (socket: Socket) => void = onShift;
  onSpace: (socket: Socket) => void = onSpace;
  onTrackerRequest: (socket: Socket) => void = onTrackerRequest;

  //Controllers
  changeWeapon: (index: number) => void = changeWeapon;
  updateCursors: (key: Direction, isDown: boolean) => void = updateCursors;
  updatePointerDown: (button: "left" | "right", isDown: boolean) => void =
    updatePointerDown;
  updateAngle: (delta: number) => void = updateAngle;
  action: () => void = action;
  reload: () => void = reload;
  toggleInventory: () => void = inventory;

  constructor(
    socket: Socket,
    game: Game,
    floor: Floor,
    id: string,
    name: string,
    color: number
  ) {
    super(0, 0, PLAYER_SIZE, PLAYER_SIZE, true);
    this.id = id;
    this.game = game;
    this.floor = floor;
    this.socket = socket;
    this.name = name;
    this.color = color;
    this.health = 100;
    this.angle = 0;
    this.inventory = new Inventory(this, 3, 3);
    this.floor.addPlayer(this);

    //Enable events
    this.onMovement(socket);
    this.onPointerDown(socket);
    this.onPointerMove(socket);
    this.onWeaponChange(socket);
    this.onActionPress(socket);
    this.onReload(socket);
    this.onInventory(socket);
    this.onCustomizeBow(socket);
    this.onShift(socket);
    this.onSpace(socket);
    this.onTrackerRequest(socket);
    this.resetMovementValues();

    this.primaryWeapon = new Blaster(this, "blaster-basic", Infinity);
    this.secondaryWeapon = new Rocket(this, "rocket-basic", Infinity);
  }

  resetMovementValues() {
    this.maxSpeed = this.initialMaxSpeed;
    this.acceleration = this.initialAcceleration;
    // this.deceleration = this.initialDeceleration;
  }

  update(delta: number, counter: number) {
    // if (this.state === "in-inventory" || this.state === "in-dialog") return;
    this.wasHit = false;

    if (this.iFrames) {
      this.iFrames -= delta;
      if (this.iFrames <= 0) this.iFrames = 0;
    }

    if ((!this.didDie && this.health <= 0) || this.state === "falling") {
      setTimeout(() => {
        this.state = "dead";
      }, 1500);
      this.health = 0;
      this.finalSecondsAlive = this.secondsAlive;
      this.secondsAlive = 0;
      this.didDie = true;
    } else if (this.didDie) {
      return;
    }

    this.handleFloor(counter);
    this.updateAngle(delta);

    //TODO Method
    if (this.isShiftDown && this.shield.current > 0) {
      this.shield.current -= delta * this.shield.multiplier;
      this.shield.isActive = true;
      if (this.shield.current <= 0) this.shield.current = 0;

      this.width = PLAYER_SIZE + 275;
      this.height = PLAYER_SIZE + 275;
    } else {
      this.shield.isActive = false;
      this.width = PLAYER_SIZE;
      this.height = PLAYER_SIZE;
    }

    if (this.isSpaceDown) {
      this.maxSpeed = this.initialBoostSpeed;
    } else {
      if (this.maxSpeed > this.initialMaxSpeed) {
        this.maxSpeed -= delta * 250;
      } else {
        this.maxSpeed = this.initialMaxSpeed;
      }
    }

    if (this.isSpaceDown) {
      this.moveInDirectionOfAngle(this.angle);
    }

    if (this.isStartProtected) {
      this.shield.isActive = true;

      if (
        this.cursors.length > 0 ||
        this.isSpaceDown ||
        this.isShiftDown ||
        this.isPointerDown.left ||
        this.isPointerDown.right
      ) {
        this.isStartProtected = false;
        this.update(delta, counter);
      }
      return;
    }

    this.applyMovement(delta);

    // this.inventory.updateDurability(this.primaryWeapon?.durability?.current);
    this.primaryWeapon?.update(delta);
    // if (this.primaryWeapon?.durability?.current <= 0) {
    //   this.inventory.hotkeys[this.inventory.hotkeyIndex] = null;
    //   this.inventory.hotkeyIndex = -1;
    // }

    if (this.secondaryWeapon) {
      this.inventory.updateDurability(
        this.secondaryWeapon?.durability?.current
      );
      this.secondaryWeapon?.update(delta);
    }

    //Always reverts to false
    this.isPointerJustDown.left = false;
    this.isPointerJustDown.right = false;
  }
  distanceFromPointer(): number {
    const deltaX = this.pointerX - this.x;
    const deltaY = this.pointerY - this.y;

    // Euclidean distance formula: distance = sqrt((x2 - x1)^2 + (y2 - y1)^2)
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    return distance;
  }

  handleInput() {
    // Assuming you have some way to detect input (e.g., key presses)
    const horizontalInput =
      (this.cursors.includes("right") ? 1 : 0) -
      (this.cursors.includes("left") ? 1 : 0);
    const verticalInput =
      (this.cursors.includes("down") ? 1 : 0) -
      (this.cursors.includes("up") ? 1 : 0);

    // Diagonal movement should be equally as fast as horizontal/vertical movement
    const diagonalFactor = Math.sqrt(2) / 2;

    this.velocityX += horizontalInput * this.acceleration * diagonalFactor;
    this.velocityY += verticalInput * this.acceleration * diagonalFactor;
  }
  getAngleFromVelocity(): number {
    // Calculate the angle in radians
    const angleInRadians = Math.atan2(this.velocityY, this.velocityX);

    // Convert radians to degrees
    const angleInDegrees = (angleInRadians * 180) / Math.PI;

    // Ensure the angle is positive
    const positiveAngle =
      angleInDegrees < 0 ? angleInDegrees + 360 : angleInDegrees;

    return positiveAngle;
  }

  moveInDirectionOfAngle(angle: number): void {
    const angleInRadians = (angle * Math.PI) / 180; // Convert angle to radians
    const accelerationX = this.acceleration * 0.75 * Math.cos(angleInRadians);
    const accelerationY = this.acceleration * 0.75 * Math.sin(angleInRadians);

    // Update velocity components
    this.velocityX += accelerationX;

    if (Math.abs(this.velocityX) > this.maxSpeed) {
      this.velocityX = Math.sign(this.velocityX) * this.maxSpeed;
    }

    this.velocityY += accelerationY;

    if (Math.abs(this.velocityY) > this.maxSpeed) {
      this.velocityY = Math.sign(this.velocityY) * this.maxSpeed;
    }
  }

  applyMovement(delta: number) {
    if (this.state === "falling") return;
    // Apply deceleration
    // this.velocityX *= Math.pow(this.deceleration, delta);
    // this.velocityY *= Math.pow(this.deceleration, delta);

    // Limit speed
    const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
    if (speed > this.maxSpeed) {
      const ratio = this.maxSpeed / speed;
      this.velocityX *= ratio;
      this.velocityY *= ratio;
    }

    let x = this.x + this.velocityX * delta;
    let y = this.y + this.velocityY * delta;

    const direction = getDirection(this.velocityX, this.velocityY);
    const boundingBox = {
      top: y - this.height / 2,
      bottom: y + this.height / 2,
      left: x - this.width / 2,
      right: x + this.width / 2,
    };

    for (const pos of this.touchedCells) {
      const cell = this.floor.tracker.cells.get(pos);
      if (!cell) continue;
      for (const obj of cell) {
        if (obj === this) continue;
        if (obj instanceof Collider) {
          if (obj.isObstructing) {
            const collidesAt = obj.getCollisionSide(
              boundingBox,
              obj instanceof Wall ? obj.adjacentWalls : undefined
            );
            if (collidesAt) {
              if (obj instanceof Asteroid) {
                // Limit this.maxSpeed to obj.maxSpeed
                this.maxSpeed = obj.maxSpeed;
                // Adjust velocities proportionally to the new maxSpeed
                const ratio = obj.maxSpeed / this.maxSpeed;
                this.velocityX *= ratio;
                this.velocityY *= ratio;
              }
              if (obj instanceof Asteroid) {
                obj.collide(this);
                break;
              }
              if (collidesAt === "top") {
                y = obj.boundingBox.top - this.height / 2;
              } else if (collidesAt === "bottom") {
                y = obj.boundingBox.bottom + this.height / 2;
              } else if (collidesAt === "left") {
                x = obj.boundingBox.left - this.width / 2;
              } else if (collidesAt === "right") {
                x = obj.boundingBox.right + this.width / 2;
              }

              this.direction = direction;
            }
          } else {
            if (obj instanceof Projectile) {
              if (obj.type === "boomerang" && obj.state.startsWith("on")) {
                if (obj.overlapsWith(this.boundingBox)) obj.get(this);
              }
            } else if (obj instanceof ItemDrop) {
              if (obj.overlapsWith(this.boundingBox)) {
                obj.get(this);
                console.log("Overlaps");
              } else {
                console.log("No overlap");
                if (obj.x > this.x) obj.x -= 200 * delta;
                else if (obj.x < this.x) obj.x += 200 * delta;
                if (obj.y > this.y) obj.y -= 200 * delta;
                else if (obj.y < this.y) obj.y += 200 * delta;
              }
            }
          }
        } else if (obj instanceof RandomPolygon) {
          if (obj.collidesWithBoundingBox(this.boundingBox)) {
            obj.collide(this);
          }
        }
      }
    }

    this.x = x;
    this.y = y;
    this.direction = direction;
    this.updateBoundingBox();

    this.floor.tracker.track(this);
  }
  handleFloor(counter: number) {
    if (counter % 6 === 0) {
      for (const pos of this.touchedCells) {
        const cell = this.floor.tracker.cells.get(pos);
        if (!cell) continue;
        for (const obj of cell) {
          if (obj instanceof Collider) {
            if (!obj.isObstructing) {
              if (obj.overlapsWith(this.boundingBox)) {
                if (obj instanceof Spikes && obj.state === "on") {
                  this.hurt(5);
                }
              }
            }
          }
        }
      }
    }
  }

  hurt(value: number, iFrames?: number) {
    if (this.shield.isActive) return;
    if (!this.iFrames) {
      this.health -= value;
      this.wasHit = true;
    }
    if (iFrames) {
      this.iFrames = iFrames;
    }
  }
  moveToCell(row: number, col: number) {
    if (!this.game) return;
    this.x = col * CELL_SIZE + CELL_SIZE / 2;
    this.y = row * CELL_SIZE + CELL_SIZE / 2;
    this.floor.tracker.track(this);
  }

  doesCollide(x: number, y: number) {
    return !(
      x < this.x - PLAYER_SIZE / 2 ||
      x > this.x - PLAYER_SIZE / 2 + PLAYER_SIZE ||
      y < this.y - PLAYER_SIZE / 2 ||
      y > this.y - PLAYER_SIZE / 2 + PLAYER_SIZE
    );
  }
}

declare module "socket.io" {
  interface Socket {
    player: Player;
  }
}

function getDirection(xSpeed: number, ySpeed: number) {
  if (xSpeed === 0 && ySpeed === 0) {
    return "stationary";
  }

  let direction = "";

  if (ySpeed < 0) {
    direction += "up";
  } else if (ySpeed > 0) {
    direction += "down";
  }

  if (xSpeed < 0) {
    direction += "left";
  } else if (xSpeed > 0) {
    direction += "right";
  }

  return direction;
}

function getRelativeObjectPosition(
  playerX: number,
  playerY: number,
  objectAX: number,
  objectAY: number
) {
  const horizontalDistance = objectAX - playerX;
  const verticalDistance = objectAY - playerY;

  if (horizontalDistance > 0) {
    if (verticalDistance > 0) {
      return "downright";
    } else if (verticalDistance < 0) {
      return "upright";
    } else {
      return "right";
    }
  } else if (horizontalDistance < 0) {
    if (verticalDistance > 0) {
      return "downleft";
    } else if (verticalDistance < 0) {
      return "upleft";
    } else {
      return "left";
    }
  } else {
    if (verticalDistance > 0) {
      return "down";
    } else if (verticalDistance < 0) {
      return "up";
    } else {
      return "same position";
    }
  }
}
