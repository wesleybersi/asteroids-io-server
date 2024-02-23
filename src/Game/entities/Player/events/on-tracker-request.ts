import { Socket } from "socket.io";
import { Player } from "../Player";

export function onTrackerRequest(this: Player, socket: Socket) {
  socket.on("Emit Tracker", (emit: boolean) => {
    if (this.isAdmin) {
      if (emit) this.floor.tracker.emitTo.add(this);
      else this.floor.tracker.emitTo.delete(this);
    }
  });
}
