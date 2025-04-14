import Skeleton from '@mui/material/Skeleton'

import Flex from '@/components/common/display/Flex'

const TestSkeletonPage = () => (
  <>
    <Flex style={{ padding: '20px 24px', backgroundColor: '#F8F9FA' }} direction="column" align="start" gap={8}>
      <Flex gap={19} wrap="wrap">
        <Skeleton variant="rectangular" width={66} height={20} />
        <Skeleton variant="rectangular" width={258} height={20} />
      </Flex>
      <Skeleton variant="rectangular" width={454} height={12} />
    </Flex>
    <Flex style={{ padding: '30px 24px 20px 24px' }} direction="column" align="start" gap={30}>
      <Flex gap={10} direction="column" align="start">
        <Skeleton variant="rectangular" width={66} height={20} />
        <Skeleton variant="rectangular" width={120} height={34} />
      </Flex>
      <Flex gap={30} wrap="wrap">
        <Flex gap={10} direction="column" align="start">
          <Skeleton variant="rectangular" width={66} height={20} />
          <Skeleton variant="rectangular" width={210} height={34} />
        </Flex>
        <Flex gap={10} direction="column" align="start">
          <Skeleton variant="rectangular" width={66} height={20} />
          <Skeleton variant="rectangular" width={210} height={34} />
        </Flex>
        <Flex gap={10} direction="column" align="start">
          <Skeleton variant="rectangular" width={66} height={20} />
          <Skeleton variant="rectangular" width={210} height={34} />
        </Flex>
      </Flex>
      <Flex style={{ width: '100%' }} gap={10} direction="column" align="start">
        <Skeleton variant="rectangular" width={66} height={20} />
        <Skeleton variant="rectangular" width={230} height={12} />
        <Skeleton variant="rectangular" width="100%" height={54} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </Flex>
    </Flex>
  </>
)

export default TestSkeletonPage
