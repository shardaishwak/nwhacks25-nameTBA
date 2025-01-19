import { BoundingBox, Point } from '@/interfaces/hand.model';

export function interpolatePoints(start: Point, end: Point, t: number): Point {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t
  };
}

export function interpolateBoundingBox(start: BoundingBox, end: BoundingBox, t: number): BoundingBox {
  return {
    topLeft: interpolatePoints(start.topLeft, end.topLeft, t),
    bottomRight: interpolatePoints(start.bottomRight, end.bottomRight, t),
    z: start.z !== undefined && end.z !== undefined ? 
      start.z + (end.z - start.z) * t : 
      undefined
  };
}

export function generateInterpolatedFrames(
  start: BoundingBox,
  end: BoundingBox,
  timeElapsed: number,
  targetFPS: number = 120
): BoundingBox[] {
  const frames: BoundingBox[] = [];
  const frameTime = 1000 / targetFPS; // time per frame in ms
  const numFrames = Math.floor(timeElapsed / frameTime);

  for (let i = 1; i < numFrames; i++) {
    const t = i / numFrames;
    frames.push(interpolateBoundingBox(start, end, t));
  }

  return frames;
}
