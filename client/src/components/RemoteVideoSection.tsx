// components/RemoteVideoSection.tsx

import React, { RefObject } from 'react';
import { useHeightScaling } from '@/hooks/useHeightScaling';

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
  // const scale = useHeightScaling();
  
  // const containerStyle = {
  //   width: `${640 * scale}px`,
  //   height: `${480 * scale}px`,
  // };

  return (
    <div className="relative mx-auto rounded-lg overflow-hidden shadow-lg">
      {/* Remote video (mirrored) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute top-0 left-0 w-full h-full object-contain bg-gray-900 rounded-lg"
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
