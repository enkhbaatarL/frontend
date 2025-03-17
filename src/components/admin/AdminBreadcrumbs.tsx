import { Home, NavigateNext } from '@mui/icons-material'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'

import useAdminMenuItems from '@/hooks/useAdminMenuItems'
import useAdminPageInfo from '@/hooks/useAdminPageInfo'

const AdminBreadcrumbs = () => {
  const navigate = useNavigate()
  const { adminPageInfo } = useAdminPageInfo()
  const adminMenuItems = useAdminMenuItems()
  const pathSegments = adminPageInfo.path.split('/').filter(Boolean)
  const getBreadcrumbLabel = (segment: string, fullPath: string) => {
    const parentMenuItem = adminMenuItems.find((item) => item.children?.some((child) => child.path === fullPath) || item.path === fullPath)

    if (parentMenuItem) {
      if (fullPath === parentMenuItem.path) {
        return parentMenuItem.label
      }

      const childItem = parentMenuItem.children?.find((child) => child.path === fullPath)

      if (childItem) {
        return childItem.label
      }
    }

    return segment
  }

  return (
    <nav>
      <Breadcrumbs aria-label="breadcrumb" separator={<NavigateNext fontSize="small" />}>
        <Link color="inherit" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
        </Link>
        {pathSegments.slice(1).map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 2).join('/')}`
          const isLast = index === pathSegments.length - 2

          return isLast ? (
            <Typography key={segment} sx={{ color: 'text.primary' }}>
              {getBreadcrumbLabel(segment, path)}
            </Typography>
          ) : (
            <Link key={segment} underline="hover" color="inherit" onClick={() => navigate(path)} style={{ cursor: 'pointer' }}>
              {getBreadcrumbLabel(segment, path)}
            </Link>
          )
        })}
      </Breadcrumbs>
    </nav>
  )
}

export default AdminBreadcrumbs
