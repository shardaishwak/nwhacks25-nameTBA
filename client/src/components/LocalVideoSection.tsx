// components/LocalVideoSection.tsx

import React, { RefObject } from 'react';

interface LocalVideoSectionProps {
  localVideoRef: RefObject<HTMLVideoElement>;
  localFaceCanvasRef: RefObject<HTMLCanvasElement>;
  remoteHandCanvasRef: RefObject<HTMLCanvasElement>;
}

export default function LocalVideoSection({
  localVideoRef,
  localFaceCanvasRef,
  remoteHandCanvasRef,
}: LocalVideoSectionProps) {
  return (
    <div className="relative">
      {/* Local video (mirrored) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      {/* Face canvas */}
      <canvas
        ref={localFaceCanvasRef}
        width={640}
        height={480}
        className="absolute top-0 left-0 w-full h-full"
        style={{ transform: 'scaleX(1)' }}
      />
      {/* Hand canvas */}
      <canvas
        ref={remoteHandCanvasRef}
        width={640}
        height={480}
        className="absolute top-0 left-0 w-full h-full"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
}
