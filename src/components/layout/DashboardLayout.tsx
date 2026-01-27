"use client";

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { AppSidebar } from "./Sidebar";
import { useDeviceSize } from "../../hooks/useDeviceSize";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout - Authenticated dashboard-only layout
 *
 * Structure for Desktop (lg and above):
 * ┌─────────────────────────────────┐
 * │  Header (Logo + Navbar)         │
 * ├────────────┬────────────────────┤
 * │  Sidebar   │  Main Content      │
 * │  (Left)    │  (Scrollable)      │
 * │            │                    │
 * └────────────┴────────────────────┘
 *
 * Mobile (<lg):
 * ┌─────────────────────────────────┐
 * │  Header (Menu + Logo + Avatar)  │
 * ├─────────────────────────────────┤
 * │  Main Content (Full Width)      │
 * │                                 │
 * │  [Sidebar Drawer Overlay]       │
 * └─────────────────────────────────┘
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useDeviceSize();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Extract active item from URL query param or path
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") || "dashboard";
    setActiveItem(tab);
  }, [location.search]);

  // Close drawer on mobile when navigating
  useEffect(() => {
    if (mobileDrawerOpen && isMobile) {
      // We'll close drawer when user selects an item (handled in handleNavigation)
    }
  }, [activeItem, isMobile, mobileDrawerOpen]);

  // Handle sidebar navigation
  const handleNavigation = (id: string) => {
    setActiveItem(id);
    navigate(`/dashboard?tab=${id}`);
    // Close mobile drawer after navigation
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  // Close drawer on escape key
  useEffect(() => {
    if (!mobileDrawerOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileDrawerOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  return (
    <div className="w-full h-screen bg-[#F7F9FC] overflow-hidden">
      {/* Header - Full width, fixed at top with z-30 to allow modals to overlay */}
      <div className="relative z-30">
        <Header
          isDashboard={true}
          mobileDrawerOpen={mobileDrawerOpen}
          onMobileDrawerToggle={setMobileDrawerOpen}
        />
      </div>

      {/* Main Content Container - offset for fixed header, responsive sidebar spacing */}
      <div
        style={{ marginTop: "70px" }}
        className="h-[calc(100vh-70px)] w-full overflow-hidden flex"
      >
        {/* Main Content Area - full width, responsive padding for sidebar (136px → 9.44vw) */}
        <main
          className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FC]"
          style={{
            paddingLeft: "max(9.44vw, 136px)",
            paddingRight: "max(2.22vw, 32px)",
          }}
        >
          {/* Page Content - scrollable, starts at top aligned with sidebar, hidden scrollbar */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {children}
          </div>
        </main>
      </div>

      {/* Global styles for hiding scrollbar */}
      <style>{`
        * {
          scrollbar-width: none; /* Firefox */
        }
        *::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
          width: 0;
          height: 0;
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
          width: 0;
          height: 0;
        }
      `}</style>

      {/* Desktop Sidebar - AppSidebar applies fixed positioning when rendered for dashboard */}
      <div className="hidden lg:block z-40">
        <AppSidebar
          activeItem={activeItem}
          onSelect={handleNavigation}
          isDashboard={true}
          isMobileDrawer={false}
        />
      </div>

      {/* Mobile Sidebar Drawer - visible on mobile */}
      <div className="lg:hidden">
        {/* Overlay backdrop for mobile */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-35"
            onClick={() => setMobileDrawerOpen(false)}
            role="presentation"
            aria-hidden="true"
          />
        )}

        {/* Mobile Drawer Sidebar */}
        <div
          className={`fixed left-0 bottom-0 z-50 w-72 max-w-[calc(100vw-1rem)] bg-background border-r border-border shadow-lg transition-transform duration-300 ease-in-out overflow-y-auto ${
            mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ top: "70px" }}
          role="navigation"
          aria-label="Mobile navigation drawer"
          aria-hidden={!mobileDrawerOpen}
        >
          <AppSidebar
            activeItem={activeItem}
            onSelect={handleNavigation}
            isDashboard={true}
            isMobileDrawer={true}
          />
        </div>
      </div>
    </div>
  );
}
