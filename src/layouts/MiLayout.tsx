import { Outlet } from 'react-router-dom'

import MiFooter from '@/components/mi/MiFooter'

const MiLayout = () => (
  <>
    <Outlet />
    <MiFooter />
  </>
)

export default MiLayout
