import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import useAdminMenuItems from '@/hooks/useAdminMenuItems'

export interface IAdminPageInfo {
  key: string
  label: string
  path: string
}

const useAdminPageInfo = () => {
  const location = useLocation()
  const adminMenuItems = useAdminMenuItems()

  const adminPageInfo = useMemo(() => {
    const currentPath = location.pathname
    const menuItem = adminMenuItems.find((item) => item.children?.some((child) => child.path === currentPath))
    const childItem = menuItem?.children?.find((child) => child.path === currentPath)

    return {
      key: childItem?.key ?? '',
      label: childItem?.label ?? '',
      path: currentPath,
    }
  }, [adminMenuItems, location.pathname])

  return { adminPageInfo }
}

export default useAdminPageInfo
