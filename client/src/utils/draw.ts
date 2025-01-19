import { FaceLandmark, HandLandmark } from '@/interfaces/hand.model';

// Add these functions to define the specific points we need
export const drawFaceBoundingBox = (
  landmarks: FaceLandmark[],
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  isLocal: boolean
) => {
  // Function to get adjusted x coordinate
  const getX = (x: number) =>
    isLocal ? (1 - x) * canvas.width : x * canvas.width;
  const getY = (y: number) => y * canvas.height;

  ctx.beginPath();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;

  // Face outline
  ctx.moveTo(getX(landmarks[10].x), getY(landmarks[10].y));

  // Right side of face (forehead to chin)
  [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
    378, 400, 377, 152,
  ].forEach((index) => {
    ctx.lineTo(getX(landmarks[index].x), getY(landmarks[index].y));
  });

  // Left side of face (chin to forehead)
  [
    152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103,
    67, 109, 10,
  ].forEach((index) => {
    ctx.lineTo(getX(landmarks[index].x), getY(landmarks[index].y));
  });

  ctx.closePath();
  ctx.stroke();

  // Simple left eye (just the outline)
  ctx.beginPath();
  [33, 160, 158, 133, 33].forEach((index) => {
    const point = landmarks[index];
    if (index === 33) {
      ctx.moveTo(getX(point.x), getY(point.y));
    } else {
      ctx.lineTo(getX(point.x), getY(point.y));
    }
  });
  ctx.closePath();
  ctx.stroke();

  // Simple right eye (just the outline)
  ctx.beginPath();
  [362, 385, 387, 373, 362].forEach((index) => {
    const point = landmarks[index];
    if (index === 362) {
      ctx.moveTo(getX(point.x), getY(point.y));
    } else {
      ctx.lineTo(getX(point.x), getY(point.y));
    }
  });
  ctx.closePath();
  ctx.stroke();

  // Simple nose (just the bridge and base)
  ctx.beginPath();
  [6, 4, 1, 168].forEach((index) => {
    const point = landmarks[index];
    if (index === 6) {
      ctx.moveTo(getX(point.x), getY(point.y));
    } else {
      ctx.lineTo(getX(point.x), getY(point.y));
    }
  });
  ctx.stroke();

  // Simple mouth (just the outer lip)
  ctx.beginPath();
  [61, 37, 0, 267, 291, 321, 61].forEach((index) => {
    const point = landmarks[index];
    if (index === 61) {
      ctx.moveTo(getX(point.x), getY(point.y));
    } else {
      ctx.lineTo(getX(point.x), getY(point.y));
    }
  });
  ctx.closePath();
  ctx.stroke();
};

export const drawHandEdges = (
  landmarks: HandLandmark[],
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  isLocal: boolean
) => {
  // Define all important hand landmarks
  const handPoints = {
    wrist: landmarks[0],
    thumb: [landmarks[1], landmarks[2], landmarks[3], landmarks[4]], // Thumb joints
    index: [landmarks[5], landmarks[6], landmarks[7], landmarks[8]], // Index finger joints
    middle: [landmarks[9], landmarks[10], landmarks[11], landmarks[12]], // Middle finger joints
    ring: [landmarks[13], landmarks[14], landmarks[15], landmarks[16]], // Ring finger joints
    pinky: [landmarks[17], landmarks[18], landmarks[19], landmarks[20]], // Pinky joints
  };

  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;

  // Function to get adjusted x coordinate
  const getX = (x: number) =>
    isLocal ? (1 - x) * canvas.width : x * canvas.width;
  const getY = (y: number) => y * canvas.height;

  // Draw each finger
  const drawFinger = (points: HandLandmark[]) => {
    ctx.beginPath();
    ctx.moveTo(getX(handPoints.wrist.x), getY(handPoints.wrist.y));
    points.forEach((point) => {
      ctx.lineTo(getX(point.x), getY(point.y));
    });
    ctx.stroke();
  };

  // Draw palm base
  ctx.beginPath();
  ctx.moveTo(getX(handPoints.wrist.x), getY(handPoints.wrist.y));
  [
    handPoints.thumb[0],
    handPoints.index[0],
    handPoints.middle[0],
    handPoints.ring[0],
    handPoints.pinky[0],
  ].forEach((point) => {
    ctx.lineTo(getX(point.x), getY(point.y));
  });
  ctx.closePath();
  ctx.stroke();

  // Draw fingers
  [
    handPoints.thumb,
    handPoints.index,
    handPoints.middle,
    handPoints.ring,
    handPoints.pinky,
  ].forEach((finger) => {
    drawFinger(finger);
  });

  // Add joints
  landmarks.forEach((point) => {
    ctx.beginPath();
    ctx.fillStyle = '#00FF00';
    ctx.arc(getX(point.x), getY(point.y), 2, 0, Math.PI * 2);
    ctx.fill();
  });
};
