// components/RemoteVideoSection.tsx

import React, { RefObject } from 'react';

interface RemoteVideoSectionProps {
  remoteVideoRef: RefObject<HTMLVideoElement>;
  remoteStreamExists: boolean;
  remoteFaceCanvasRef: RefObject<HTMLCanvasElement>;
  localHandCanvasRef: RefObject<HTMLCanvasElement>;
}

export default function RemoteVideoSection({
  remoteVideoRef,
  remoteStreamExists,
  remoteFaceCanvasRef,
  localHandCanvasRef,
}: RemoteVideoSectionProps) {
  return (
    <div className="relative w-[640px] h-[480px] mx-auto">
      {/* Remote video (mirrored) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover bg-gray-900 rounded-lg"
        style={{ transform: 'scaleX(-1)' }}
      />
      {/* If no remote stream yet, overlay a waiting message */}
      {!remoteStreamExists && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
          Waiting for remote stream...
        </div>
      )}

      {/* Face canvas */}
      <canvas
        ref={remoteFaceCanvasRef}
        width={640}
        height={480}
        className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
        style={{ transform: 'scaleX(-1)' }}
      />
      {/* Hand canvas */}
      <canvas
        ref={localHandCanvasRef}
        width={640}
        height={480}
        className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
        style={{ transform: 'scaleX(1)' }}
      />
    </div>
  );
}
