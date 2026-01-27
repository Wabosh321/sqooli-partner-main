import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceSize {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Custom hook that detects the current device display size and provides
 * responsive information about the viewport.
 * 
 * Breakpoints follow Tailwind CSS conventions:
 * - xs: 0px - 374px (extra small mobile)
 * - sm: 375px - 639px (small mobile)
 * - md: 640px - 767px (tablet portrait)
 * - lg: 768px - 1023px (tablet landscape)
 * - xl: 1024px - 1279px (small desktop)
 * - 2xl: 1280px+ (large desktop)
 * 
 * @returns {DeviceSize} Object containing width, height, device type, and breakpoint info
 */
export function useDeviceSize(): DeviceSize {
  const [size, setSize] = useState<DeviceSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    deviceType: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: '2xl',
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Determine device type
      let deviceType: DeviceType;
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;

      if (width < 640) {
        deviceType = 'mobile';
        isMobile = true;
      } else if (width < 1024) {
        deviceType = 'tablet';
        isTablet = true;
      } else {
        deviceType = 'desktop';
        isDesktop = true;
      }

      // Determine breakpoint (Tailwind CSS breakpoints)
      let breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
      if (width < 375) {
        breakpoint = 'xs';
      } else if (width < 640) {
        breakpoint = 'sm';
      } else if (width < 768) {
        breakpoint = 'md';
      } else if (width < 1024) {
        breakpoint = 'lg';
      } else if (width < 1280) {
        breakpoint = 'xl';
      } else {
        breakpoint = '2xl';
      }

      setSize({
        width,
        height,
        deviceType,
        isMobile,
        isTablet,
        isDesktop,
        breakpoint,
      });
    };

    // Set initial size
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
