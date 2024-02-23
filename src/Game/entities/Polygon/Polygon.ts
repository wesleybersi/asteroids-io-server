import { getRandomFloat, getRandomInt, oneIn } from "../../../utilities";

export interface BoundingBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export class RandomPolygon {
  x: number;
  y: number;
  angle: number = 0;
  vertices: number[];
  width: number = 0;
  height: number = 0;
  radius: number = 0;
  boundingBox: BoundingBox;
  constructor(x: number, y: number, initialRadius: number) {
    // if (oneIn(10)) {
    //   const multiplier = getRandomInt(5);
    //   initialRadius *= multiplier;
    // }
    this.x = x;
    this.y = y;
    this.vertices = this.generatePolygon(
      getRandomInt(6, Math.max(Math.floor(initialRadius / 15), 6)),
      initialRadius
    );
    this.moveToCenter();
    this.radius = this.getRadius();
    this.boundingBox = this.getBoundingBox();
  }

  generatePolygon(numVertices: number, radius: number) {
    const polygonVertices: number[] = [];

    let randomness = 0.2;

    if (oneIn(2)) {
      randomness += 0.2;
    }
    if (oneIn(2)) {
      randomness -= 0.1;
    }

    if (randomness <= 0) randomness = 0;

    for (let i = 0; i < numVertices; i++) {
      // Generate random angle for each vertex with additional randomness
      const angle =
        (360 / numVertices) * i * (Math.PI / 180) + getRandomFloat(-0.2, 0.2);

      // Generate random radius for each vertex within a range with additional randomness
      const randomRadius =
        radius + getRandomFloat(-radius * randomness, radius * randomness);

      // Calculate the x and y coordinates of the vertex
      const x = randomRadius * Math.cos(angle);
      const y = randomRadius * Math.sin(angle);

      // Add the vertex to the array
      polygonVertices.push(x, y);
    }

    return polygonVertices;
  }

  getBoundingBox(): {
    top: number;
    left: number;
    bottom: number;
    right: number;
  } {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    // Iterate through vertices to find the min and max values
    for (let i = 0; i < this.vertices.length; i += 2) {
      const x = this.vertices[i];
      const y = this.vertices[i + 1];

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    this.width = maxX - minX;
    this.height = maxY - minY;

    // Return the bounding box
    return {
      top: minY,
      left: minX,
      bottom: maxY,
      right: maxX,
    };
  }
  getRadius(): number {
    let maxDistanceSquared = 0;

    // Calculate centroid (average) of x and y coordinates
    const centerX =
      this.vertices.reduce(
        (sum, _, index) => (index % 2 === 0 ? sum + this.vertices[index] : sum),
        0
      ) /
      (this.vertices.length / 2);
    const centerY =
      this.vertices.reduce(
        (sum, _, index) => (index % 2 !== 0 ? sum + this.vertices[index] : sum),
        0
      ) /
      (this.vertices.length / 2);

    // Iterate through vertices to find the maximum distance squared
    for (let i = 0; i < this.vertices.length; i += 2) {
      const x = this.vertices[i];
      const y = this.vertices[i + 1];

      const distanceSquared =
        Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2);
      maxDistanceSquared = Math.max(maxDistanceSquared, distanceSquared);
    }

    // Return the square root of the maximum distance squared to get the exact radius
    return Math.sqrt(maxDistanceSquared);
  }

  moveToCenter() {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    // Iterate through vertices to find the min and max values
    for (let i = 0; i < this.vertices.length; i += 2) {
      const x = this.vertices[i];
      const y = this.vertices[i + 1];

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    // Calculate center coordinates with initial x and y values
    const initialX = this.x;
    const initialY = this.y;
    const centerX = (minX + maxX) / 2 + initialX;
    const centerY = (minY + maxY) / 2 + initialY;

    // Set x and y to the center coordinates
    this.x = centerX;
    this.y = centerY;
  }

  collidesWithBoundingBox(boundingBox: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  }): boolean {
    const { top, left, bottom, right } = boundingBox;

    // Convert rotation angle to radians
    const angleRad = this.angle * (Math.PI / 180);

    // Check each edge of the rotated polygon
    for (let i = 0; i < this.vertices.length; i += 2) {
      const x1 =
        this.vertices[i] * Math.cos(angleRad) -
        this.vertices[i + 1] * Math.sin(angleRad) +
        this.x;
      const y1 =
        this.vertices[i] * Math.sin(angleRad) +
        this.vertices[i + 1] * Math.cos(angleRad) +
        this.y;

      const x2 =
        this.vertices[(i + 2) % this.vertices.length] * Math.cos(angleRad) -
        this.vertices[(i + 3) % this.vertices.length] * Math.sin(angleRad) +
        this.x;
      const y2 =
        this.vertices[(i + 2) % this.vertices.length] * Math.sin(angleRad) +
        this.vertices[(i + 3) % this.vertices.length] * Math.cos(angleRad) +
        this.y;

      // Check if the edge intersects with any of the bounding box edges
      if (
        this.checkCollisionLineSegment(top, left, bottom, right, x1, y1, x2, y2)
      ) {
        return true; // Collision detected
      }
    }

    // Check if any vertex is inside the bounding box
    for (let i = 0; i < this.vertices.length; i += 2) {
      const x =
        this.vertices[i] * Math.cos(angleRad) -
        this.vertices[i + 1] * Math.sin(angleRad) +
        this.x;
      const y =
        this.vertices[i] * Math.sin(angleRad) +
        this.vertices[i + 1] * Math.cos(angleRad) +
        this.y;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return true; // Collision detected
      }
    }

    return false; // No collision detected
  }

  private checkCollisionLineSegment(
    top: number,
    left: number,
    bottom: number,
    right: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): boolean {
    // Check if both endpoints are on one side of the bounding box
    if (
      (x1 < left && x2 < left) ||
      (x1 > right && x2 > right) ||
      (y1 < top && y2 < top) ||
      (y1 > bottom && y2 > bottom)
    ) {
      return false;
    }

    // Check if the line segment intersects with any of the bounding box edges
    const m = (y2 - y1) / (x2 - x1);

    const yLeft = m * (left - x1) + y1;
    const yRight = m * (right - x1) + y1;
    const xTop = (top - y1) / m + x1;
    const xBottom = (bottom - y1) / m + x1;

    return (
      (yLeft >= top && yLeft <= bottom) ||
      (yRight >= top && yRight <= bottom) ||
      (xTop >= left && xTop <= right) ||
      (xBottom >= left && xBottom <= right)
    );
  }
}
