import { CELL_SIZE, PLAYER_SIZE } from "../../../constants";
import { Pickup } from "../../entities/Pickup/Pickup";
import Floor, { GridObject } from "../Floor";
import { Hole } from "../../entities/Hole/Hole";
import { Wall } from "../../entities/Wall/Wall";
import { Stairs } from "../../entities/Stairs/Stairs";
import { Spikes } from "../../entities/Spikes/Spikes";
import { Pot } from "../../entities/Pot/Pot";

export function trackPosition(
  this: Floor,
  object: GridObject,
  width = CELL_SIZE,
  height = CELL_SIZE
) {
  if (
    object instanceof Wall ||
    object instanceof Pickup ||
    object instanceof Hole ||
    object instanceof Stairs ||
    object instanceof Spikes ||
    object instanceof Pot
  )
    return;
  this.removeFromTracker(object);
  object.touchedCells = this.getTouchedCells(object.x, object.y, width, height);
  for (const cellKey of object.touchedCells) {
    const cell = this.tracker.get(cellKey);
    if (cell) {
      cell.add(object);
    } else {
      this.tracker.set(cellKey, new Set([object]));
    }
  }
}