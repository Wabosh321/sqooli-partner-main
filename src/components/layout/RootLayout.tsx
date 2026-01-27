'use client';

import React from 'react';
import { useLocation } from 'react-router-dom';
import { HeroHeader } from './HeroHeader';
import { useAuth } from '../../hooks/useAuth';
import Footer from '../landing/Footer';
import { DashboardLayout } from './DashboardLayout';

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * RootLayout component that manages which navigation bars to show
 * based on the current route and authentication state.
 * 
 * - HeroHeader: Shown on public pages (/, /signIn)
 * - DashboardLayout: Shown on protected/dashboard pages (Sidebar left + Header top)
 * - No headers: Shown on onboarding page
 */
export function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Determine which layout to show based on route
  const isPublicPage = ['/', '/signIn', '/signUp'].includes(location.pathname);
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  // Show HeroHeader on public pages
  const showHeroHeader = isPublicPage;

  // Show DashboardLayout for authenticated dashboard pages
  const showDashboardLayout = isDashboardPage && user && !loading;

  // Always show HeroHeader for public pages
  if (showHeroHeader) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </div>
    );
  }

  // Show DashboardLayout for authenticated dashboard pages
  if (showDashboardLayout) {
    return (
      <DashboardLayout>
        {children}
      </DashboardLayout>
    );
  }

  // For onboarding and other pages, just render children without layout
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
