"use client"

import React from 'react'
import { SidebarProvider, useSidebarContext } from './SidebarContext'
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from './sidebar.styles'
import { TooltipProvider } from '../../ui/tooltip'

export function SidebarRoot({ children, defaultOpen = true }: React.PropsWithChildren<{ defaultOpen?: boolean }>) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={{
            ['--sidebar-width' as any]: SIDEBAR_WIDTH,
            ['--sidebar-width-icon' as any]: SIDEBAR_WIDTH_ICON,
          } as React.CSSProperties}
          className="group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full"
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarProvider>
  )
}

export default SidebarRoot
