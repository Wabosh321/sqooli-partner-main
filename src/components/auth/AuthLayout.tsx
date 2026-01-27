import React from "react";
import { useDeviceSize } from "../../hooks/useDeviceSize";

// Public assets from /public/images/
const leftPanelImage = "/images/frame-2085664693.png";
const headingImage = "/images/heading-and-supporting-text.png";
const sqooliLogo = "/images/sqooli-logo.svg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile, isTablet } = useDeviceSize();

  return (
    <div
      className="bg-white relative w-full min-h-screen flex flex-col lg:flex-row"
      data-name="AuthLayout"
    >
      {/* Left Side - image panel */}
      <div className="hidden lg:block relative h-screen w-[663px] overflow-hidden rounded-[24px] ml-[15px] my-[24px]">
        <img
          src={leftPanelImage}
          alt="Left panel"
          className="w-full h-full object-cover rounded-[24px]"
        />
        <div className="absolute top-[114px] left-[128px] w-[437px] text-center text-white z-10">
          <img
            src={headingImage}
            alt="Welcome heading"
            className="w-[437px] h-[121px]"
          />
        </div>
      </div>

      {/* Right Side wrapper */}
      <div
        className={`flex-1 flex items-center justify-center overflow-y-auto ${isMobile ? "p-3" : isTablet ? "p-4" : "p-4 lg:p-8"}`}
      >
        <div
          className={`w-full ${isMobile ? "max-w-[320px]" : isTablet ? "max-w-[380px]" : "max-w-[400px]"}`}
        >
          {/* Logo */}
          <div className={`flex justify-center mb-${isMobile ? "8" : "12"}`}>
            <img
              alt="Sqooli Logo"
              className={`${isMobile ? "h-12" : isTablet ? "h-14" : "h-[60px]"} w-auto`}
              src={sqooliLogo}
            />
          </div>

          {/* Children (form) */}
          {children}
        </div>
      </div>
    </div>
  );
}
