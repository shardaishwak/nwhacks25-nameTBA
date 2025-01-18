"use client";

import { io } from "socket.io-client";
import { StreamData, HandData, VideoTrackData } from "../interfaces/stream.model";
import { ItemData } from "../interfaces/attack.model";
import { HealthData } from "../interfaces/stats.model";

export const socket = io();

// Unified game state emission with MediaStream
export const emitGameState = ({
  video,
  handData,
  itemData,
  healthData
}: StreamData) => {

  // Convert MediaStream to something that can be sent over socket
  const videoTracks: VideoTrackData[] = video.getTracks().map(track => ({
    id: track.id,
    kind: track.kind,
    label: track.label,
    enabled: track.enabled,
    muted: track.muted,
    readyState: track.readyState
  }));
  socket.emit('game-state', {
    videoTracks,
    handData,
    itemData,
    healthData,
    timestamp: Date.now()
  });
};

export const listenToGameState = (callback: (data: StreamData) => void) => {
  socket.on('game-state', (data) => {
    // Create new MediaStream from received track data
    const stream = new MediaStream();
    if (data.videoTracks) {
      data.videoTracks.forEach((trackData: any) => {
        const track = new MediaStreamTrack();
        Object.assign(track, trackData);
        stream.addTrack(track);
      });
    }
    
    callback({
      ...data,
      video: stream
    });
  });
  
  return () => {
    socket.off('game-state', callback);
  };
};

// Optional: Helper function to create initial game state
export const createInitialGameState = (): StreamData => ({
  video: typeof window !== 'undefined' ? new MediaStream() : null as any,
  handData: {
    speed: 0,
    position: { x: 0, y: 0 },
    direction: "none",
    powerup: false
  },
  itemData: {
    scaling_function: (input: number) => input,
    details: {
      type: "none",
      name: "none",
      description: "none",
      icon: "none"
    }
  },
  healthData: {
    max_health: 100,
    current_health: 100,
    change: 0
  }
});




