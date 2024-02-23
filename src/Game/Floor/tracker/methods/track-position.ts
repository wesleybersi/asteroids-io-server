import { CELL_SIZE } from "../../../../constants";
import { Tracker } from "../Tracker";
import { TrackerObject } from "../types";

export function trackPosition(
  this: Tracker,
  object: TrackerObject,
  width?: number,
  height?: number
) {
  if (Tracker.isStaticObject(object)) return;
  this.remove(object);
  const grace = 64;
  object.touchedCells = this.getOverlappingCells(
    object.x,
    object.y,
    width ? width : object.width + grace,
    height ? height : object.height + grace
  );
  for (const cellKey of object.touchedCells) {
    const cell = this.cells.get(cellKey);
    if (cell) {
      cell.add(object);
    } else {
      this.cells.set(cellKey, new Set([object]));
    }
  }
}
