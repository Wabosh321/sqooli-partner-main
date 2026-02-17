import type { HeaderContainerProps } from "./types";

/**
 * HeaderContainer
 *
 * Provides the fixed header structure and shared styling.
 * Wraps content with consistent padding and layout.
 */
export function HeaderContainer({ children, isMobile }: HeaderContainerProps) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        borderBottomWidth: "1px",
      }}
      className="bg-background border-b border-border shrink-0 shadow-sm"
    >
      <div
        className="flex items-center justify-between gap-2"
        style={{
          height: "70px",
          paddingLeft: isMobile ? "max(0.83vw, 12px)" : "max(2.22vw, 32px)",
          paddingRight: isMobile ? "max(0.83vw, 12px)" : "max(2.22vw, 32px)",
        }}
      >
        {children}
      </div>
    </header>
  );
}
