import { Outlet } from 'react-router-dom'

import AdminDrawer from '@/components/admin/AdminDrawer'
import AdminHeader from '@/components/admin/AdminHeader'
import Flex from '@/components/common/display/Flex'
import { DRAWER_WIDTH } from '@/constants/admin'
import AdminProvider from '@/providers/AdminProvider'

const AdminLayout = () => (
  <AdminProvider>
    <Flex className="full-width full-height max-full-width">
      <AdminDrawer />
      <Flex direction="column" className="main flex-grow-1 full-height" style={{ width: `calc(100% - ${DRAWER_WIDTH.OPEN}px)` }}>
        <AdminHeader />
        <div className="content full-width">
          <Outlet />
        </div>
      </Flex>
    </Flex>
  </AdminProvider>
)

export default AdminLayout
