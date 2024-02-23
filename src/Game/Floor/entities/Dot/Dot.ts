import Floor from "../../Floor";
import { Player } from "../../../entities/Player/Player";
import { Collider } from "../../../entities/Collider/Collider";
import { getRandomInt } from "../../../../utilities";

export class Star extends Collider {
  id: string;
  floor: Floor;
  touchedCells: string[] = [];
  size: number;
  constructor(floor: Floor, y: number, x: number, color: number, size: number) {
    super(x, y, size, size, false);
    this.floor = floor;
    this.size = size;

    this.id = `${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`;
    this.floor.emissions.push({
      id: this.id,
      type: "dot",
      color: colors[getRandomInt(colors.length)],
      radius: size,
      y,
      x,
    });
  }
}

const colors = [
  0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xb7ffff, 0x634761,
  0xb7ffff, 0x858e64, 0x7b6261, 0xeef880,
];
