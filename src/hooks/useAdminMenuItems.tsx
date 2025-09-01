import { t } from 'i18next'
import { JSX, useMemo } from 'react'

import AdminRoutes from '@/routes/AdminRoutes'
import { UserRole } from '@/service/admin/members'
import useAuthStore from '@/store/useAuthStore'
import { ICustomRouteObject } from '@/types/common'

export const useAdminMenuItems = () => {
  const { user } = useAuthStore()

  const removeNavigateItems = (routes: ICustomRouteObject, parentPath: string = ''): ICustomRouteObject => {
    const currentPath = parentPath ? `${parentPath}/${routes.path}` : `/${routes.path}`

    const filteredChildren = routes.children
      ?.filter((route) => {
        const element = route.element as JSX.Element

        return element?.type?.name !== 'Navigate'
      })
      .map((route) => removeNavigateItems(route, currentPath))

    const indexChild = filteredChildren?.find((child) => child.index)
    const childrenWithoutIndex = filteredChildren?.filter((child) => !child.index)
    const labelText = indexChild?.label ?? routes.label

    return {
      ...routes,
      path: currentPath,
      element: indexChild ? indexChild.element : undefined,
      label: labelText ? t(labelText) : undefined,
      icon: indexChild?.icon ?? routes.icon,
      children: childrenWithoutIndex,
      hasBack: indexChild?.hasBack ?? routes.hasBack,
    }
  }

  const targetRoutes = useMemo(
    () =>
      user?.userRoleCd === UserRole.OPERATOR
        ? {
            ...AdminRoutes,
            children: AdminRoutes.children?.filter((child) => child.path && ['data-providers', 'tokens'].includes(child.path)),
          }
        : AdminRoutes,
    [user?.userRoleCd],
  )

  return removeNavigateItems(targetRoutes).children ?? []
}

export default useAdminMenuItems
