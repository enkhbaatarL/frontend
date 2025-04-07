import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import useAdminMenuItems from '@/hooks/useAdminMenuItems'
import { ICustomRouteObject } from '@/types/common'

const useAdminPageInfo = () => {
  const location = useLocation()
  const adminMenuItems = useAdminMenuItems()

  const adminPageInfo = useMemo(() => {
    const currentPath = location.pathname

    const findMenuItem = (items: ICustomRouteObject[], path: string): ICustomRouteObject | null => {
      for (const item of items) {
        if (item.path === path) return item
        if (item.children) {
          const found = findMenuItem(item.children, path)
          if (found) return found
        }
      }
      return null
    }

    const segments = currentPath.split('/').filter(Boolean)

    let menuItem: ICustomRouteObject | null = null
    for (let i = segments.length; i > 0; i--) {
      const tryPath = `/${segments.slice(0, i).join('/')}`
      menuItem = findMenuItem(adminMenuItems, tryPath)
      if (menuItem) break
    }

    return {
      key: menuItem?.path ?? '',
      label: menuItem?.label ?? '',
      path: menuItem?.path ?? currentPath,
      hasBack: menuItem?.hasBack ?? false,
    }
  }, [adminMenuItems, location.pathname])

  return { adminPageInfo }
}

export default useAdminPageInfo
