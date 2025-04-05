import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export const useSmoothScroll = () => {
  const router = useRouter();
  
  const smoothScroll = useCallback((targetPath: string) => {
    // First smooth scroll to bottom with easing
    const start = window.scrollY;
    const end = document.documentElement.scrollHeight;
    const duration = 800; // Longer duration to match wall compression
    const startTime = performance.now();
    
    // Easing function for smoother acceleration/deceleration
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    // Smooth scroll animation
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      const current = start + (end - start) * eased;
      
      window.scrollTo(0, current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Navigate after animation completes
        setTimeout(() => {
          router.push(targetPath);
        }, 5); // Short delay after scroll completes
      }
    };

    requestAnimationFrame(animate);
  }, [router]);

  return smoothScroll;
};
