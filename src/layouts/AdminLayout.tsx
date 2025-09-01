import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'

import AdminDrawer from '@/components/admin/AdminDrawer'
import AdminHeader from '@/components/admin/AdminHeader'
import Flex from '@/components/common/display/Flex'
import { DRAWER_WIDTH } from '@/constants/admin'

const AdminLayout = () => (
  <Flex className="full-width full-height max-full-width" style={{ minHeight: '100vh', minWidth: '1440px' }}>
    <AdminDrawer />
    <Box height={'100vh'} style={{ width: '100%', minWidth: `calc(100% - ${DRAWER_WIDTH.OPEN}px)` }}>
      <Flex direction="column" className="main flex-grow-1 full-height">
        <AdminHeader />
        <Box className="content">
          <Box className="full-width">
            <Outlet />
          </Box>
        </Box>
      </Flex>
    </Box>
  </Flex>
)

export default AdminLayout
