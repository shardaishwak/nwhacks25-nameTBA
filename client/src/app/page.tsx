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

  const takeSnapshot = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'snapshot.png';
    link.click();
  };

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
              frameRate: { ideal: 30 }
            }
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
    
    const detectFeaturesInVideo = async () => {
      if (!faceLandmarker || !handLandmarker || !ctx || !webcamRunning || 
          !canvasRef.current || !videoRef.current || isDetecting) return;

      if (videoRef.current.paused || videoRef.current.ended || 
          videoRef.current.readyState !== 4) return;

      try {
        isDetecting = true;
        const timestamp = performance.now();

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

        // Clear canvas
        ctx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

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
        // Schedule next detection
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
    <div className='flex flex-col items-center justify-center h-screen bg-gray-800 gap-4'>
      <div className='relative'>
        <video 
          ref={videoRef} 
          className='w-[640px] h-[480px]'
        />
        <canvas 
          ref={canvasRef} 
          width='640' 
          height='480' 
          className='absolute top-0 left-0'
        />
      </div>
      <button
        onClick={takeSnapshot}
        className='px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-500'
      >
        Take Snapshot
      </button>
    </div>
  );
}
