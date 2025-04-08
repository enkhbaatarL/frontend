import { CircularProgress } from '@mui/material'

import Flex from '@/components/common/display/Flex'

const AdminLoading = () => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    style={{
      width: '100%',
      height: '90%',
      minHeight: '300px',
    }}
  >
    <Flex
      align="center"
      justify="center"
      style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        opacity: 0.1,
      }}
    >
      <CircularProgress size={50} />
    </Flex>
  </Flex>
)

export default AdminLoading
