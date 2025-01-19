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
    boundingBox: {
        topLeft: { x: number; y: number };
        bottomRight: { x: number; y: number };
    };
    direction: string;
    powerup: boolean;
}

export interface FaceData {
    boundingBox: {
        topLeft: { x: number; y: number };
        bottomRight: { x: number; y: number };
    };
}


