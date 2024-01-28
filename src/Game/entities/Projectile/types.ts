import { Player } from "../Player/Player";
import { Shooter } from "../../Floor/entities/Shooter/Shooter";
import { SpearTier } from "../Player/entities/Weapon/types";

export type ProjectileType =
  | "arrow"
  | "pot"
  | "spear"
  | "boomerang"
  | "spear-collider"
  | "sword-collider";
export type ProjectileState =
  | "active"
  | "holding"
  | "on-ground"
  | "on-object"
  | "on-target"
  | "removed"
  | "destroyed";

export interface ProjectileConfig {
  shooter: Player | Shooter;
  x: number;
  y: number;
  z?: number;
  angle: number;
  speed: number;
  damage: number;
  initialState?: ProjectileState;
  acceleration?: number;
  decceleration?: number;
  maxSpeed?: number;
  spread?: number;
  delayedImpact?: number;
  bounce?: boolean;
  hold?: boolean;
  durability?: number;
  tier?: SpearTier;
  iterations?: number;
}
