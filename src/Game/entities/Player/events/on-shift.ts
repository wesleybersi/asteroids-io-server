import { Socket } from "socket.io";
import { Player } from "../Player";
import { Direction } from "../../../../types";

export default function onShift(this: Player, socket: Socket) {
  socket.on("Player Shift", (isDown: boolean) => {
    console.log("PLayer shift", isDown.toString());
    this.isShiftDown = isDown;
  });
}
