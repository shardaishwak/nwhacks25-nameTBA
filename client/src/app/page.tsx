'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  HandLandmarker,
  FaceLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';

interface FaceLandmark {
  x: number;
  y: number;
}

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface DetectionResults {
  faceLandmarks: FaceLandmark[][];
}

interface HandDetectionResults {
  landmarks: HandLandmark[][];
}

export default function Home() {
  // Refs to video and canvas elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
    null
  );
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(
    null
  );
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [webcamRunning, setWebcamRunning] = useState(false);

  useEffect(() => {
    const initializeFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          '/models/wasm'
        );
        const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: '/models/face_landmarker.task',
              delegate: 'GPU',
            },
            outputFaceBlendshapes: true,
            runningMode: 'VIDEO',
            numFaces: 5,
          }
        );

        const handLandmarkerInstance = await HandLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: '/models/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 4,
          }
        );

        setFaceLandmarker(faceLandmarkerInstance);
        setHandLandmarker(handLandmarkerInstance);
        // Initialize canvas context
        const context = canvasRef.current?.getContext('2d');
        if (context) {
          context.globalAlpha = 0.8; // Adjust transparency of landmarks
          setCtx(context);
        }
      } catch (error) {
        console.error('Error initializing FaceLandmarker:', error);
      }
    };
    initializeFaceLandmarker();
  }, []);

  // Step 2: Start Webcam and Face Detection
  useEffect(() => {
    if (faceLandmarker) {
      const startWebcam = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480,
              frameRate: { ideal: 30 },
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Ensure video metadata is loaded
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                videoRef.current.play();
                // Wait a brief moment to ensure video is actually playing
                setTimeout(() => {
                  setWebcamRunning(true);
                }, 100);
              }
            };
          }
        } catch (err) {
          console.error('Error accessing webcam:', err);
        }
      };
      startWebcam();
    }
  }, [faceLandmarker]);

  // Step 3: Real-time face and hand detection
  useEffect(() => {
    let isDetecting = false;
    let animationFrameId: number;
    let frameCount = 0;

    const detectFeaturesInVideo = async () => {
      if (
        !faceLandmarker ||
        !handLandmarker ||
        !ctx ||
        !webcamRunning ||
        !canvasRef.current ||
        !videoRef.current ||
        isDetecting
      )
        return;

      if (
        videoRef.current.paused ||
        videoRef.current.ended ||
        videoRef.current.readyState !== 4
      )
        return;

      try {
        isDetecting = true;
        const timestamp = performance.now();
        frameCount++;

        // Detect faces
        const faceResults = faceLandmarker.detectForVideo(
          videoRef.current,
          timestamp
        ) as DetectionResults;

        // Detect hands
        const handResults = handLandmarker.detectForVideo(
          videoRef.current,
          timestamp
        ) as HandDetectionResults;

        // Log frame data every 30 frames (approximately once per second at 30fps)
        if (frameCount % 30 === 0) {
          const frameData = {
            timestamp,
            frameNumber: frameCount,
            faces: {
              count: faceResults.faceLandmarks?.length || 0,
              landmarks: faceResults.faceLandmarks?.map(landmarks => 
                landmarks.map(point => ({
                  x: Math.round(point.x * 1000) / 1000,
                  y: Math.round(point.y * 1000) / 1000
                }))
              )
            },
            hands: {
              count: handResults.landmarks?.length || 0,
              landmarks: handResults.landmarks?.map(landmarks =>
                landmarks.map(point => ({
                  x: Math.round(point.x * 1000) / 1000,
                  y: Math.round(point.y * 1000) / 1000,
                  z: Math.round(point.z * 1000) / 1000
                }))
              )
            }
          };

          // Calculate size in bytes
          const dataSizeBytes = new TextEncoder().encode(JSON.stringify(frameData)).length;
          const dataSizeKB = Math.round((dataSizeBytes / 1024) * 100) / 100;

          console.log('=== Frame Data ===', {
            ...frameData,
            dataSize: {
              bytes: dataSizeBytes,
              kilobytes: dataSizeKB
            }
          });
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw face landmarks
        if (faceResults.faceLandmarks) {
          faceResults.faceLandmarks.forEach((landmarks) => {
            landmarks.forEach((landmark) => {
              ctx.beginPath();
              ctx.arc(
                landmark.x * canvasRef.current!.width,
                landmark.y * canvasRef.current!.height,
                2,
                0,
                Math.PI * 2
              );
              ctx.fillStyle = '#FFFFFF';
              ctx.fill();
            });
          });
        }

        // Draw hand landmarks
        if (handResults.landmarks) {
          handResults.landmarks.forEach((landmarks) => {
            landmarks.forEach((landmark) => {
              ctx.beginPath();
              ctx.arc(
                landmark.x * canvasRef.current!.width,
                landmark.y * canvasRef.current!.height,
                3,
                0,
                Math.PI * 2
              );
              ctx.fillStyle = '#00FF00';
              ctx.fill();
            });
          });
        }
      } catch (error) {
        console.error('Error in detection:', error);
      } finally {
        isDetecting = false;
        animationFrameId = requestAnimationFrame(detectFeaturesInVideo);
      }
    };

    if (webcamRunning) {
      detectFeaturesInVideo();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [faceLandmarker, handLandmarker, ctx, webcamRunning]);

  return (
    <div className='grid grid-cols-2 items-center justify-center mx-auto h-screen bg-gray-800 gap-4 p-4'>
      {/* Left side - Reserved for remote video */}
      <div className='relative w-full h-full flex items-center justify-center'>
        <div className='text-gray-400 text-lg'>
          Waiting for connection...
        </div>
      </div>

      {/* Right side - Local video with landmarks */}
      <div className='relative w-full h-full flex items-center justify-center'>
        <video 
          ref={videoRef} 
          className='w-[640px] h-[480px] object-cover'
        />
        <canvas
          ref={canvasRef}
          width='640'
          height='480'
          className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        />
      </div>
    </div>
  );
}
