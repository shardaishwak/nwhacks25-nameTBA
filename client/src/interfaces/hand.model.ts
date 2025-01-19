export interface Point {
    x: number;
    y: number;
}

export interface BoundingBox {
    topLeft: Point;
    bottomRight: Point;
}

export interface FaceLandmark {
  x: number;
  y: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface DetectionResults {
  faceLandmarks: FaceLandmark[][];
}

export interface HandDetectionResults {
  landmarks: HandLandmark[][];
}

export interface HandData {
    speed: number;
    boundingBox: BoundingBox;
    direction: number;
    powerup: boolean;
}

export interface FaceData {
    boundingBox: BoundingBox;
}

export interface MovementData {
    velocity: number;
    direction: number;
}
