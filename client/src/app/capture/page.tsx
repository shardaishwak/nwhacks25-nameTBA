"use client";

import { useEffect, useRef, useState } from "react";
import { emitGameState, createInitialGameState, listenToGameState } from "@/lib/socket";
import { StreamData } from "@/interfaces/stream.model";

export default function Capture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gameState, setGameState] = useState<StreamData>(() => {
    // Only create initial state after mounting
    if (typeof window === 'undefined') return null as any;
    return createInitialGameState();
  });

  useEffect(() => {
    // Initialize game state if not already done
    if (!gameState) {
      setGameState(createInitialGameState());
    }

    // Initialize game state and video stream
    let stream: MediaStream;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Update game state with new video stream
        setGameState(prevState => ({
          ...prevState,
          video: stream
        }));

        // Start emitting game state periodically
        const intervalId = setInterval(() => {
          emitGameState(gameState);
        }, 100); // Send updates every 100ms

        return () => {
          clearInterval(intervalId);
          stream.getTracks().forEach(track => track.stop());
        };
      })
      .catch((error) => console.error("Error accessing media devices:", error));

    // Listen for game state updates from other players
    const cleanup = listenToGameState((newState) => {
      setGameState(prevState => ({
        ...newState,
        video: prevState.video // Keep our local video stream
      }));
    });

    return () => {
      cleanup();
    };
  }, []);

  // Example of updating hand data
  const updateHandPosition = (x: number, y: number) => {
    setGameState(prevState => ({
      ...prevState,
      handData: {
        ...prevState.handData,
        position: { x, y }
      }
    }));
  };

  return (
    <div>
      <h1>Capture</h1>
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        style={{ width: "100%" }} 
      />
      {/* Example of displaying game state */}
      <div>
        <p>Health: {gameState.healthData.current_health}</p>
        <p>Hand Position: {JSON.stringify(gameState.handData.position)}</p>
      </div>
    </div>
  );
}
