import { HandData, FaceData, HandLandmark, FaceLandmark } from '../interfaces/hand.model';

export function convertHandLandmarksToBoundingBox(landmarks: HandLandmark[]): HandData['boundingBox'] {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    landmarks.forEach(landmark => {
        minX = Math.min(minX, landmark.x);
        minY = Math.min(minY, landmark.y);
        maxX = Math.max(maxX, landmark.x);
        maxY = Math.max(maxY, landmark.y);
    });

    return {
        topLeft: { x: minX, y: minY },
        bottomRight: { x: maxX, y: maxY }
    };
}

export function convertFaceLandmarksToBoundingBox(landmarks: FaceLandmark[]): FaceData['boundingBox'] {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    landmarks.forEach(landmark => {
        minX = Math.min(minX, landmark.x);
        minY = Math.min(minY, landmark.y);
        maxX = Math.max(maxX, landmark.x);
        maxY = Math.max(maxY, landmark.y);
    });

    return {
        topLeft: { x: minX, y: minY },
        bottomRight: { x: maxX, y: maxY }
    };
}




