"use client"

import { useNavigate, useLocation } from 'react-router-dom'
import { useCallback } from 'react'

export function useSidebarNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const navigateTo = useCallback((id: string) => {
    // keep behavior consistent with existing layout: tab query param
    navigate(`/dashboard?tab=${id}`)
  }, [navigate])

  const getActiveFromLocation = useCallback(() => {
    try {
      const search = new URLSearchParams(location.search)
      return search.get('tab') || 'dashboard'
    } catch (e) {
      return 'dashboard'
    }
  }, [location.search])

  return { navigateTo, getActiveFromLocation }
}

export default useSidebarNavigation
