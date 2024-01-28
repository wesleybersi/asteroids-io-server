import Floor, { MatrixCellType, SpriteGridType, SpriteIDType } from "../Floor";
import { WeaponType } from "../../entities/Player/entities/Weapon/types";
import { WeaponPickup } from "../entities/Pickup/Pickup";
import { Socket } from "socket.io";
import { Emission } from "../types";

export function emitInitialData(this: Floor, socket: Socket) {
  const players = [];
  for (const [, player] of this.players) {
    players.push({
      id: player.id,
      name: player.name,
      color: player.color,
      x: player.x,
      y: player.y,
      weapon:
        player.weaponIndex >= 0
          ? {
              type: player.weaponry[player.weaponIndex]?.type,
              tier: player.weaponry[player.weaponIndex]?.tier,
            }
          : null,
      angle: player.angle,
      height: player.height,
      width: player.width,
    });
  }

  const pickups = [];
  for (const [, pickup] of this.pickups) {
    if (pickup instanceof WeaponPickup) {
      const { row, col, weaponType } = pickup;
      pickups.push({
        type: weaponType,
        row,
        col,
      });
    }
  }
  const spriteGridMatrix: [string, SpriteGridType][] = [];
  const lastEmissions: [string, Emission][] = [];

  for (const sprite of this.spriteGridMatrix) {
    spriteGridMatrix.push(sprite);
  }

  for (const emission of this.lastEmissions) {
    lastEmissions.push(emission);
  }

  const initialData: InitialFloorData = {
    id: socket.id,
    players,
    pickups,
    objectMatrix: this.objectMatrix,
    spriteGridMatrix,
    lastEmissions: lastEmissions,
    size: {
      rows: this.rows,
      cols: this.cols,
    },
    decoration: this.decoration,
  };
  socket.emit("Initial Floor Data", initialData);
}

export interface InitialFloorData {
  id: string;
  size: {
    rows: number;
    cols: number;
  };
  players: {
    id: string;
    name: string;
    color: number;
    angle: number;
    x: number;
    y: number;
    height: number;
    width: number;
  }[];
  objectMatrix: MatrixCellType[][];
  spriteGridMatrix: [string, SpriteGridType][];
  lastEmissions: [string, Emission][];
  pickups: {
    type: WeaponType;
    row: number;
    col: number;
  }[];
  decoration: {
    torches: { row: number; col: number }[];
  };
}
