"use client"

import React from 'react'
import { SidebarItem } from './SidebarItem'

export function SidebarSection({ items, onSelect, activeItem, isMobileDrawer }: {
  items: Array<{ id: string; label: string; icon?: any; locked?: boolean }>
  onSelect?: (id: string) => void
  activeItem?: string
  isMobileDrawer?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((it) => (
        <SidebarItem
          key={it.id}
          id={it.id}
          label={it.label}
          icon={it.icon}
          locked={it.locked}
          active={activeItem === it.id}
          onClick={onSelect}
          isMobileDrawer={isMobileDrawer}
        />
      ))}
    </div>
  )
}

export default SidebarSection
