import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'

import HomeIcon from '@/components/common/icons/HomeIcon'
import useAdminMenuItems from '@/hooks/useAdminMenuItems'
import useAdminPageInfo from '@/hooks/useAdminPageInfo'
import { ICustomRouteObject } from '@/types/common'

const AdminBreadcrumbs = () => {
  const navigate = useNavigate()
  const { adminPageInfo } = useAdminPageInfo()
  const adminMenuItems = useAdminMenuItems()
  const pathSegments = adminPageInfo.path.split('/').filter(Boolean)
  const getBreadcrumbLabel = (segment: string, fullPath: string) => {
    const findLabel = (items: ICustomRouteObject[], path: string): string | undefined => {
      for (const item of items) {
        if (item.path === path) {
          return item.label
        }
        if (item.children) {
          const childLabel = findLabel(item.children, path)

          if (childLabel) {
            return childLabel
          }
        }
      }

      return undefined
    }

    const label = findLabel(adminMenuItems, fullPath)

    return label ?? segment
  }

  return (
    <nav>
      <Breadcrumbs color="gray.60" aria-label="breadcrumb" sx={{ fontWeight: 400, fontSize: '13px' }}>
        <Link color="gray.60" variant="breadcrumbs" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <HomeIcon />
        </Link>
        {pathSegments.slice(1).map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 2).join('/')}`
          const isLast = index === pathSegments.length - 2

          return isLast ? (
            <Typography color="gray.90" variant="breadcrumbs" key={segment}>
              {getBreadcrumbLabel(segment, path)}
            </Typography>
          ) : (
            <Link
              key={segment}
              underline="hover"
              color="gray.60"
              variant="breadcrumbs"
              onClick={() => navigate(path)}
              style={{ cursor: 'pointer' }}
            >
              {getBreadcrumbLabel(segment, path)}
            </Link>
          )
        })}
      </Breadcrumbs>
    </nav>
  )
}

export default AdminBreadcrumbs
