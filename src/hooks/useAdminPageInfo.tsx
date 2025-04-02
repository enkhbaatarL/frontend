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
          const found: ICustomRouteObject | null = findMenuItem(item.children, path)

          if (found) return found
        }
      }

      return null
    }

    const menuItem = findMenuItem(adminMenuItems, currentPath)

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
