import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useNavigate, useParams } from 'react-router-dom'

import HomeIcon from '@/components/common/icons/HomeIcon'
import useAdminMenuItems from '@/hooks/useAdminMenuItems'
import useAdminPageInfo from '@/hooks/useAdminPageInfo'
import useEnvironment from '@/hooks/useEnvironment.ts'
import { ICustomRouteObject } from '@/types/common'

const replaceParamsInPath = (template: string, params: Record<string, string | undefined>) =>
  template.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
    const value = params[key]
    if (!value) {
      return `:${key}`
    }
    return value
  })

const AdminBreadcrumbs = () => {
  const navigate = useNavigate()
  const { adminPageInfo } = useAdminPageInfo()
  const adminMenuItems = useAdminMenuItems()
  const pathSegments = adminPageInfo.path.split('/').filter(Boolean)
  const { isProd } = useEnvironment()

  const getBreadcrumbLabel = (items: ICustomRouteObject[], path: string): string | undefined => {
    for (const item of items) {
      if (item.path === path) {
        return item.label
      }
      if (item.children) {
        const childLabel = getBreadcrumbLabel(item.children, path)
        if (childLabel) {
          return childLabel
        }
      }
    }
    return undefined
  }

  const params = useParams()
  const onNavigate = (path: string) => {
    const resolvedPath = replaceParamsInPath(path, params)
    navigate(resolvedPath)
  }

  return (
    <nav>
      <Breadcrumbs color="gray.60" aria-label="breadcrumb" sx={{ fontWeight: 400, fontSize: '13px' }}>
        <Link
          color="gray.60"
          variant="breadcrumbs"
          onClick={() => {
            if (isProd) {
              navigate('/admin')
            } else {
              navigate('/')
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <HomeIcon />
        </Link>
        {pathSegments.slice(1).map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 2).join('/')}`
          const label = getBreadcrumbLabel(adminMenuItems, path)
          const isLast = index === pathSegments.length - 2

          if (!label) return null

          return isLast ? (
            <Typography color="gray.90" variant="breadcrumbs" key={segment}>
              {label}
            </Typography>
          ) : (
            <Link
              key={segment}
              underline="hover"
              color="gray.60"
              variant="breadcrumbs"
              onClick={() => onNavigate(path)}
              style={{ cursor: 'pointer' }}
            >
              {label}
            </Link>
          )
        })}
      </Breadcrumbs>
    </nav>
  )
}

export default AdminBreadcrumbs
