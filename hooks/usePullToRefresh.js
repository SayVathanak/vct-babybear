'use client'; // This hook must be a client component

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function usePullToRefresh() {
  const router = useRouter();
  const [pullStart, setPullStart] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    // Threshold in pixels to trigger a refresh
    const PULL_THRESHOLD = 80;

    const onTouchStart = (e) => {
      // Only enable pull-to-refresh at the very top of the page
      if (window.scrollY === 0) {
        setPullStart(e.touches[0].clientY);
        setIsPulling(true);
      }
    };

    const onTouchMove = (e) => {
      if (!isPulling) return;
      const pullDistance = e.touches[0].clientY - pullStart;
      
      // Prevent the default browser scroll only when pulling down
      if (pullDistance > 0) {
        e.preventDefault();
        // You could add a visual indicator here if you want
      }
    };

    const onTouchEnd = (e) => {
      if (!isPulling) return;
      
      const pullDistance = e.changedTouches[0].clientY - pullStart;
      
      if (pullDistance > PULL_THRESHOLD) {
        // Trigger a hard refresh
        router.refresh(); 
      }
      
      setIsPulling(false);
      setPullStart(0);
    };

    // Add event listeners to the document
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

    // Cleanup function to remove event listeners on unmount
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isPulling, pullStart, router]);
}