// components/StatsOverlay.tsx

import React from 'react';

interface StatsOverlayProps {
  handSpeed: number;
  // handDirection: number;
  isColliding: boolean;
  remoteHandSpeed: number;
  // remoteHandDirection: number;
  isRemoteColliding: boolean;
}

export default function StatsOverlay({
  handSpeed,
  // handDirection,
  isColliding,
  remoteHandSpeed,
  // remoteHandDirection,
  isRemoteColliding,
}: StatsOverlayProps) {
  return (
    <div className="absolute top-4 left-4 bg-black/50 p-4 rounded-lg text-white font-mono">
      <div className="grid grid-cols-2 gap-4">
        {/* Local Stats */}
        <div className="flex flex-col gap-2">
          <h3 className="font-bold">Local</h3>
          <div>
            Speed: {handSpeed.toFixed(2)} units/ms
            <div className="w-32 h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-green-500 rounded transition-all"
                style={{ width: `${Math.min(handSpeed * 100, 100)}%` }}
              />
            </div>
          </div>
          {/* <div>
            Direction: {handDirection.toFixed(0)}°
            <div className="relative w-8 h-8">
              <div
                className="absolute w-6 h-1 bg-blue-500 origin-left"
                style={{
                  transform: `rotate(${handDirection}deg)`,
                  transformOrigin: 'center',
                }}
              />
            </div>
          </div> */}
          <div>
            Collision:{' '}
            <span className={isColliding ? 'text-red-500' : 'text-green-500'}>
              {isColliding ? 'YES' : 'NO'}
            </span>
          </div>
        </div>

        {/* Remote Stats */}
        <div className="flex flex-col gap-2">
          <h3 className="font-bold">Remote</h3>
          <div>
            Speed: {remoteHandSpeed.toFixed(2)} units/ms
            <div className="w-32 h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-green-500 rounded transition-all"
                style={{ width: `${Math.min(remoteHandSpeed * 100, 100)}%` }}
              />
            </div>
          </div>
          {/* <div>
            Direction: {remoteHandDirection.toFixed(0)}°
            <div className="relative w-8 h-8">
              <div
                className="absolute w-6 h-1 bg-blue-500 origin-left"
                style={{
                  transform: `rotate(${remoteHandDirection}deg)`,
                  transformOrigin: 'center',
                }}
              />
            </div>
          </div> */}
          <div>
            Collision:{' '}
            <span
              className={isRemoteColliding ? 'text-red-500' : 'text-green-500'}
            >
              {isRemoteColliding ? 'YES' : 'NO'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
