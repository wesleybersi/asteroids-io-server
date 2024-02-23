import {
  CELL_SIZE,
  MAX_ASTEROID_RADIUS,
  MIN_ASTEROID_RADIUS,
} from "../../../constants";
import { getRandomInt } from "../../../utilities";
import { Asteroid } from "../entities/Asteroid/Pot";
import { Projectile } from "../entities/Projectile/Projectile";
import Floor from "../Floor";

export function update(this: Floor, delta: number, counter: number) {
  this.emissionData = {
    players: [],
    updaters: [],
    pickups: [],
    tracker: [],
  };

  this.updatePlayers(delta, counter);

  for (const updater of this.updaters) {
    updater.update(delta);
  }

  for (const emission of this.emissions) {
    this.emissionData.updaters.push(emission);
    if (emission.id) {
      this.lastEmissions.set(emission.id, emission);
    }
  }

  if (this.game.globalTimers[4] === 0) {
    let totalSpawns = 0;
    let totalMass = 0;
    let totalAsteroids = 0;
    for (const [index, set] of this.asteroidOrigins) {
      if (set.size === 0) {
        //TODO Spawn offscreen, or where no players reside
        set.add(
          new Asteroid(
            this,
            index,
            getRandomInt(Math.floor(this.cols * CELL_SIZE)),
            getRandomInt(Math.floor(this.rows * CELL_SIZE)),
            getRandomInt(MIN_ASTEROID_RADIUS, MAX_ASTEROID_RADIUS)
          )
        );
        totalSpawns++;
      }
      totalMass += Array.from(set).reduce(
        (sum, current) => sum + current.width * current.height,
        0
      );
      totalAsteroids += set.size;
    }
    console.log("Spawning", totalSpawns, "new asteroids");
    console.log("----------------");
    console.log("Current asteroid amount:", totalAsteroids);
    console.log("Initial asteroid amount:", this.initialAsteroidCount);
    console.log("----------------");
    console.log("Current mass:", Math.floor(totalMass), "km2");
    console.log("Initial mass:", Math.floor(this.initialMass), "km2");
    console.log("Difference:", Math.floor(totalMass - this.initialMass), "km2");
  }

  this.emissions = [];

  this.tracker.update();
}
