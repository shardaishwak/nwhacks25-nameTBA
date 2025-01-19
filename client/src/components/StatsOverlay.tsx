// components/StatsOverlay.tsx

import React, { useState, useEffect, useRef } from 'react';
import { calculateDamage } from '@/lib/logic';
import { HealthScoreIcon } from './healthScore';

interface StatsOverlayProps {
  handSpeed: number;
  isColliding: boolean;
  remoteHandSpeed: number;
  isRemoteColliding: boolean;
}

export default function StatsOverlay({
  handSpeed,
  isColliding,
  remoteHandSpeed,
  isRemoteColliding,
}: StatsOverlayProps) {

  const [localLastInflictedDamage, setLocalLastInflictedDamage] = useState<number>(0);
  const [remoteLastInflictedDamage, setRemoteLastInflictedDamage] = useState<number>(0);

  // -------------- Health States --------------
  const [localHealth, setLocalHealth] = useState<number>(100);
  const [remoteHealth, setRemoteHealth] = useState<number>(100);

  const prevLocalCollision = useRef(false);
  const prevRemoteCollision = useRef(false);

  useEffect(() => {
    if (isColliding && !prevLocalCollision.current) {
      const damage = calculateDamage(handSpeed);
      setRemoteLastInflictedDamage(damage.damage);
      setRemoteHealth(prev => Math.max(0, prev - damage.damage));
    }
    prevLocalCollision.current = isColliding;
  }, [isColliding, handSpeed]);

  useEffect(() => {
    if (isRemoteColliding && !prevRemoteCollision.current) {
      const damage = calculateDamage(remoteHandSpeed);
      setLocalLastInflictedDamage(damage.damage);
      setLocalHealth(prev => Math.max(0, prev - damage.damage));
    }
    prevRemoteCollision.current = isRemoteColliding;
  }, [isRemoteColliding, remoteHandSpeed]);

  return (
    <div className="bg-black/50 p-4 rounded-lg text-white font-mono">
      <div className="grid grid-cols-2 gap-4">

        {/* Local Stats */}
        <div className="flex flex-col gap-2">
          <h3 className="font-bold">Local</h3>
          <div className='w-full'>
            <HealthScoreIcon score={Math.floor(localHealth / 10)} color="blue" />
          </div>
          <div>
            Speed: {handSpeed.toFixed(2)} units/ms
            <div className="w-32 h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-green-500 rounded transition-all"
                style={{ width: `${Math.min(handSpeed * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>Last Damage Taken: {localLastInflictedDamage.toFixed(1)}</div>
          <div>
            Collision:{' '}
            <span className={isColliding ? 'text-red-500' : 'text-green-500'}>
              {isColliding ? 'YES' : 'NO'}
            </span>
          </div>
        </div>

        {/* Remote Stats */}
        <div className="flex flex-col gap-2 w-full items-end">
          <h3 className="font-bold">Remote</h3>
          <HealthScoreIcon score={Math.floor(remoteHealth / 10)} color="red" />
          <div>
            Speed: {remoteHandSpeed.toFixed(2)} units/ms
            <div className="w-32 h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-green-500 rounded transition-all"
                style={{ width: `${Math.min(remoteHandSpeed * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>Last Damage Taken: {remoteLastInflictedDamage.toFixed(1)}</div>
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
