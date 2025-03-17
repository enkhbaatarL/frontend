import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useAdminPageInfo from '@/hooks/useAdminPageInfo'

const AdminHeader = () => {
  const { customComponent } = useAdminHeader()
  const { adminPageInfo } = useAdminPageInfo()

  return (
    <header className="full-width">
      <AdminBreadcrumbs />
      <Flex align="start" justify="space-between">
        <h3>{adminPageInfo.label}</h3>
        {customComponent}
      </Flex>
    </header>
  )
}

export default AdminHeader
