import { HandData, FaceData, HandLandmark, FaceLandmark, Point, BoundingBox } from '../interfaces/hand.model';

export function convertHandLandmarksToBoundingBox(landmarks: HandLandmark[]): HandData['boundingBox'] {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    let top: HandLandmark = landmarks[0], 
        bottom: HandLandmark = landmarks[0], 
        left: HandLandmark = landmarks[0], 
        right: HandLandmark = landmarks[0];

    landmarks.forEach(landmark => {
        if (landmark.x < minX) {
            minX = landmark.x;
            left = landmark;
        }
        if (landmark.x > maxX) {
            maxX = landmark.x;
            right = landmark;
        }
        if (landmark.y < minY) {
            minY = landmark.y;
            top = landmark;
        }
        if (landmark.y > maxY) {
            maxY = landmark.y;
            bottom = landmark;
        }
    });

    return {
        topLeft: { x: left.x, y: top.y },
        bottomRight: { x: right.x, y: bottom.y }
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

export function getBoundingBoxCenter(box: BoundingBox): Point {
    return {
        x: (box.topLeft.x + box.bottomRight.x) / 2,
        y: (box.topLeft.y + box.bottomRight.y) / 2
    };
}

export function calculateVelocity(
    currentBox: BoundingBox,
    previousBox: BoundingBox,
    timeElapsed: number
): number {
    if (timeElapsed === 0) return 0; // Avoid division by zero

    const currentCenter = getBoundingBoxCenter(currentBox);
    const previousCenter = getBoundingBoxCenter(previousBox);
    
    const dx = currentCenter.x - previousCenter.x;
    const dy = currentCenter.y - previousCenter.y;
    
    // Calculate distance between centers
    const distance = Math.sqrt(dx * dx + dy * dy);
    
//     // Calculate size change (expansion/contraction)
//     const currentWidth = currentBox.bottomRight.x - currentBox.topLeft.x;
//     const currentHeight = currentBox.bottomRight.y - currentBox.topLeft.y;
//     const previousWidth = previousBox.bottomRight.x - previousBox.topLeft.x;
//     const previousHeight = previousBox.bottomRight.y - previousBox.topLeft.y;
    
//     const sizeChange = Math.abs(
//         (currentWidth * currentHeight) - (previousWidth * previousHeight)
//     );
    
    // Combine linear movement and size change for final velocity
    const totalChange = distance; // Adjust weight of size change
    
    const velocity = totalChange / timeElapsed; // units per millisecond

    return velocity;
}

export function calculateDirection(
    currentBox: BoundingBox,
    previousBox: BoundingBox
): number {
    const currentCenter = getBoundingBoxCenter(currentBox);
    const previousCenter = getBoundingBoxCenter(previousBox);
    
    const dx = currentCenter.x - previousCenter.x;
    const dy = currentCenter.y - previousCenter.y;
    
    // Calculate angle in degrees (-180 to +180)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return angle;
}

// Function to check if two bounding boxes intersect
export function checkCollision(box1: BoundingBox, box2: BoundingBox): boolean {
    return (
        box1.topLeft.x < box2.bottomRight.x &&
        box1.bottomRight.x > box2.topLeft.x &&
        box1.topLeft.y < box2.bottomRight.y &&
        box1.bottomRight.y > box2.topLeft.y
    );
}

