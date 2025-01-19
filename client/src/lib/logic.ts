import { DamageData } from '@/interfaces/stats.model';
import { HandData, FaceData, HandLandmark, FaceLandmark, Point, BoundingBox, } from '../interfaces/hand.model';
import { Powerup } from '@/interfaces/attack.model';

export function convertHandLandmarksToBoundingBox(landmarks: HandLandmark[]): HandData['boundingBox'] {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    let top: HandLandmark = landmarks[0],
        bottom: HandLandmark = landmarks[0],
        left: HandLandmark = landmarks[0],
        right: HandLandmark = landmarks[0];
    let zIndexTotal = 0;

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
        zIndexTotal += landmark.z;
    });

    return {
        topLeft: { x: left.x, y: top.y },
        bottomRight: { x: right.x, y: bottom.y },
        z: zIndexTotal / landmarks.length
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
    const dz = (currentBox.z ?? 0) - (previousBox.z ?? 0); // Handle optional z values

    // Calculate distance between centers including z-axis
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Combine linear movement for final velocity
    const velocity = distance / timeElapsed; // units per millisecond

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
export function checkCollision(box1: BoundingBox, box2: BoundingBox, shouldMirror: boolean = false): boolean {
    // When checking collisions between local and remote elements, we need to mirror one of them
    const x1 = shouldMirror ? 1 - box1.bottomRight.x : box1.topLeft.x;
    const x2 = shouldMirror ? 1 - box1.topLeft.x : box1.bottomRight.x;

    return (
        x1 < box2.bottomRight.x &&
        x2 > box2.topLeft.x &&
        box1.topLeft.y < box2.bottomRight.y &&
        box1.bottomRight.y > box2.topLeft.y
    );
}

export function calculateDamage(velocity: number, powerups: Powerup[] = []): DamageData {

    const velocityScaler = 10; // Arbitrary scaling factor

    const isCritical = Math.random() < 0.1; // 10% chance of critical hit
    const baseDamage = velocity * velocityScaler * (isCritical ? 2 : 1); // Double damage on critical hit
    let finalDamage = baseDamage;

    if (powerups.length > 0) {
        finalDamage = powerups.reduce((damage: number, powerup) => {
            return powerup.scaling_function(damage);
        }, baseDamage);
    }

    return {
        damage: finalDamage,
        isCritical,
        velocity,
        powerups
    };
}
