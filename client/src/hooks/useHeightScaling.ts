import { useState, useEffect } from 'react';

export const useHeightScaling = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const viewportHeight = window.innerHeight;
      // Calculate scale based on viewport height
      // Assuming we want the video to take up 80% of the viewport height
      const targetHeight = viewportHeight * 0.8;
      const originalHeight = 480; // Original video height
      const newScale = targetHeight / originalHeight;
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return scale;
};
