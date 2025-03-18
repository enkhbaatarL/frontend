import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import useAdminMenuItems, { IMenuItem } from '@/hooks/useAdminMenuItems'

const useAdminPageInfo = () => {
  const location = useLocation()
  const { adminMenuItems } = useAdminMenuItems()

  const adminPageInfo = useMemo(() => {
    const currentPath = location.pathname

    const findMenuItem = (items: IMenuItem[], path: string): IMenuItem | null => {
      for (const item of items) {
        if (item.path === path) return item
        if (item.children) {
          const found: IMenuItem | null = findMenuItem(item.children, path)

          if (found) return found
        }
      }

      return null
    }

    const menuItem = findMenuItem(adminMenuItems, currentPath)

    return {
      key: menuItem?.key ?? '',
      label: menuItem?.label ?? '',
      path: menuItem?.path ?? currentPath,
    }
  }, [adminMenuItems, location.pathname])

  return { adminPageInfo }
}

export default useAdminPageInfo
