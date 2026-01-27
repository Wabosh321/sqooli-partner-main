"use client"

import React from 'react'
import { Lock } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface SidebarItemProps {
  id: string
  label: string
  icon?: React.ElementType
  active?: boolean
  locked?: boolean
  onClick?: (id: string) => void
  isMobile?: boolean
  isMobileDrawer?: boolean
}

export function SidebarItem({ id, label, icon: Icon, active, locked, onClick, isMobile, isMobileDrawer }: SidebarItemProps) {
  const handle = () => {
    if (locked) return
    onClick?.(id)
  }
  const iconSize = isMobileDrawer ? 'h-5 w-5' : isMobile ? 'h-4 w-4' : 'h-5 w-5'

  // On desktop (not mobile, not mobile drawer) we want a stacked layout: icon above label
  const isStacked = !isMobile && !isMobileDrawer

  return (
    <button
      onClick={handle}
      disabled={locked}
      title={locked ? `${label} (Locked)` : label}
      aria-pressed={!!active}
      className={cn(
        'relative transition-all rounded-md',
        isStacked
          ? 'flex flex-col items-center gap-2 py-3 px-2 w-full'
          : 'flex items-center gap-2 w-full py-2.5 px-2',
        active && !locked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
        locked && 'text-muted-foreground/40 cursor-not-allowed opacity-50'
      )}
    >
      {Icon && (
        <div className={cn('relative flex items-center justify-center') }>
          <Icon className={cn('shrink-0', isStacked ? 'h-6 w-6' : iconSize)} />
          {locked && (
            <Lock className="absolute -top-1 -right-1 h-3 w-3 text-destructive" />
          )}
        </div>
      )}

      {/* Label placement: under icon when stacked, inline otherwise */}
      <span className={cn('font-medium truncate', isStacked ? 'text-xs' : '')}>{label}</span>

      {locked && (
        <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px] rounded-md" />
      )}
    </button>
  )
}

export default SidebarItem
