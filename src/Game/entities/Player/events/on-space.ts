import { Socket } from "socket.io";
import { Player } from "../Player";

export default function onSpace(this: Player, socket: Socket) {
  socket.on("Player Space", (isDown: boolean) => {
    this.isSpaceDown = isDown;
  });
}
