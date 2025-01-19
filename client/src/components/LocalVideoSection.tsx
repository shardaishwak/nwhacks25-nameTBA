// components/LocalVideoSection.tsx

import React, { RefObject, useEffect } from 'react';
import { useDraggable } from '@/hooks/useDraggable';

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
  const {
    position,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useDraggable({ x: window.innerWidth - 300, y: 20 });

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="relative rounded-lg overflow-hidden shadow-lg cursor-grab select-none"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '300px',
        zIndex: 50,
      }}
      onMouseDown={handleMouseDown}
    >
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
