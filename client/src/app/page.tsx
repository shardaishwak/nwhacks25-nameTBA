/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
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

interface WebRTCState {
  remoteStreamExists: boolean;
  roomId: string | null;
}

export default function Home() {
  // Refs to video and canvas elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // WebRTC refs
  const socketRef = useRef<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // State
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
    null
  );
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(
    null
  );
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [remoteCtx, setRemoteCtx] = useState<CanvasRenderingContext2D | null>(
    null
  );
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [webRTCState, setWebRTCState] = useState<WebRTCState>({
    remoteStreamExists: false,
    roomId: null,
  });

  // Add state for joining
  const [joinRoomId, setJoinRoomId] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);

  // Add room management state
  const [isInRoom, setIsInRoom] = useState(false);

  // Add local stream ref
  const localStreamRef = useRef<MediaStream | null>(null);

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
        const localContext = canvasRef.current?.getContext('2d');
        const remoteContext = remoteCanvasRef.current?.getContext('2d');

        if (localContext) {
          localContext.globalAlpha = 0.8;
          setCtx(localContext);
        }
        if (remoteContext) {
          remoteContext.globalAlpha = 0.8;
          setRemoteCtx(remoteContext);
        }
      } catch (error) {
        console.error('Error initializing:', error);
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
            video: { width: 640, height: 480, frameRate: { ideal: 30 } },
            audio: true,
          });

          localStreamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setWebcamRunning(true);
            };
          }

          // Add tracks to peer connection if it exists
          if (peerConnectionRef.current) {
            stream.getTracks().forEach((track) => {
              if (localStreamRef.current) {
                peerConnectionRef.current?.addTrack(
                  track,
                  localStreamRef.current
                );
              }
            });
          }
        } catch (err) {
          console.error('Error accessing webcam:', err);
        }
      };
      startWebcam();
    }
  }, [faceLandmarker]);

  // Modified WebRTC setup
  useEffect(() => {
    if (!faceLandmarker) return;

    const roomId = isJoining
      ? joinRoomId
      : Math.random().toString(36).substring(7);

    // 1) Connect to Socket.IO signaling server
    // socketRef.current = io("https://nwhacks25-nametba.onrender.com", {
    socketRef.current = io('https://nwhacks25-nametba.onrender.com', {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server:', socketRef.current.id);
      socketRef.current.emit('join-room', roomId);
      setWebRTCState((prev) => ({ ...prev, roomId }));
    });

    // 2) Create RTCPeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    peerConnectionRef.current = pc;

    // 3) Add local tracks to peer connection when available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
    }

    // 4) Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', {
          roomId,
          data: { candidate: event.candidate },
        });
      }
    };

    // 5) Handle remote stream
    pc.ontrack = (event) => {
      console.log('Got remote track:', event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setWebRTCState((prev) => ({ ...prev, remoteStreamExists: true }));
      }
    };

    // 6) Handle peer joining
    socketRef.current.on('peer-joined', async (newPeerId: string) => {
      console.log('Peer joined:', newPeerId);
      if (socketRef.current.id < newPeerId) {
        await createOffer();
      }
    });

    // 7) Handle signaling
    socketRef.current.on('signal', async ({ from, data }: any) => {
      try {
        if (data.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit('signal', { roomId, data: answer });
        } else if (data.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        } else if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [faceLandmarker, isJoining, joinRoomId]);

  // Modified detection function to handle both streams
  const detectFeaturesInVideo = async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D
  ) => {
    if (
      !video ||
      !canvas ||
      !context ||
      video.paused ||
      video.ended ||
      video.readyState !== 4
    )
      return;

    try {
      const timestamp = performance.now();

      // Detect faces
      const faceResults = faceLandmarker?.detectForVideo(
        video,
        timestamp
      ) as DetectionResults;

      // Detect hands
      const handResults = handLandmarker?.detectForVideo(
        video,
        timestamp
      ) as HandDetectionResults;

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw landmarks
      if (faceResults?.faceLandmarks) {
        faceResults.faceLandmarks.forEach((landmarks) => {
          landmarks.forEach((landmark) => {
            context.beginPath();
            context.arc(
              landmark.x * canvas.width,
              landmark.y * canvas.height,
              2,
              0,
              Math.PI * 2
            );
            context.fillStyle = '#FFFFFF';
            context.fill();
          });
        });
      }

      if (handResults?.landmarks) {
        handResults.landmarks.forEach((landmarks) => {
          landmarks.forEach((landmark) => {
            context.beginPath();
            context.arc(
              landmark.x * canvas.width,
              landmark.y * canvas.height,
              3,
              0,
              Math.PI * 2
            );
            context.fillStyle = '#00FF00';
            context.fill();
          });
        });
      }
    } catch (error) {
      console.error('Error in detection:', error);
    }
  };

  // Animation frame handler
  useEffect(() => {
    let animationFrameId: number;

    const animate = async () => {
      if (videoRef.current && canvasRef.current && ctx) {
        await detectFeaturesInVideo(videoRef.current, canvasRef.current, ctx);
      }

      if (
        remoteVideoRef.current &&
        remoteCanvasRef.current &&
        remoteCtx &&
        webRTCState.remoteStreamExists
      ) {
        await detectFeaturesInVideo(
          remoteVideoRef.current,
          remoteCanvasRef.current,
          remoteCtx
        );
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (webcamRunning) {
      animate();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    faceLandmarker,
    handLandmarker,
    ctx,
    remoteCtx,
    webcamRunning,
    webRTCState.remoteStreamExists,
  ]);

  // Modified join room handler
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      setIsJoining(true);
      setIsInRoom(true);
    }
  };

  // Add leave room handler
  const handleLeaveRoom = () => {
    if (socketRef.current) socketRef.current.disconnect();
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    setIsInRoom(false);
    setIsJoining(false);
    setWebRTCState({ remoteStreamExists: false, roomId: null });
  };

  // Move createOffer inside component
  const createOffer = async () => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('signal', {
        roomId: webRTCState.roomId,
        data: offer,
      });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  return (
    <div className='grid grid-cols-2 items-center justify-center mx-auto h-screen bg-gray-800 gap-4 p-4'>
      {/* Left side - Remote video */}
      <div className='relative w-full h-full flex items-center justify-center'>
        {webRTCState.remoteStreamExists ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className='w-[640px] h-[480px] object-cover'
            />
            <canvas
              ref={remoteCanvasRef}
              width='640'
              height='480'
              className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
            />
          </>
        ) : (
          <div className='flex flex-col items-center gap-4 text-gray-400'>
            {isInRoom ? (
              <>
                <div className='text-lg'>
                  {isJoining
                    ? `Joining Room: ${joinRoomId}`
                    : 'Share this Room ID:'}
                </div>
                <div className='text-xl font-mono bg-gray-700 px-4 py-2 rounded'>
                  {webRTCState.roomId}
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 mt-4'
                >
                  Leave Room
                </button>
              </>
            ) : (
              <form onSubmit={handleJoinRoom} className='flex flex-col gap-2'>
                <input
                  type='text'
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder='Enter Room ID to join'
                  className='px-4 py-2 rounded bg-gray-700 text-white'
                />
                <button
                  type='submit'
                  className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500'
                >
                  Join Room
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Right side - Local video with landmarks */}
      <div className='relative w-full h-full flex items-center justify-center'>
        <video ref={videoRef} className='w-[640px] h-[480px] object-cover' />
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
