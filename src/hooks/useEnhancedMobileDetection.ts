import { useState, useEffect } from 'react';

export const useEnhancedMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      // Account for mobile browser UI that may hide/show
      const actualViewportHeight = window.visualViewport?.height || window.innerHeight;
      const currentOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      
      setIsMobile(isMobileDevice || (hasTouch && isSmallScreen));
      setOrientation(currentOrientation);
      setViewportHeight(actualViewportHeight);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    // Listen for viewport changes (mobile browser UI)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkMobile);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkMobile);
      }
    };
  }, []);

  return { isMobile, orientation, viewportHeight };
};