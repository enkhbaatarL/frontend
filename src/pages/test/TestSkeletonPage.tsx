import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

const TestSkeletonPage = () => (
  <>
    <Box
      sx={{
        padding: '20px 24px',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      <Box sx={{ display: 'flex', gap: '19px', flexWrap: 'wrap' }}>
        <Skeleton variant="rectangular" width={66} height={20} />
        <Skeleton variant="rectangular" width={258} height={20} />
      </Box>
      <Skeleton variant="rectangular" width={454} height={12} />
    </Box>
    <Box sx={{ padding: '30px 24px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '30px' }}>
      <Box sx={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Skeleton variant="rectangular" width={66} height={20} />
        <Skeleton variant="rectangular" width={120} height={34} />
      </Box>
      <Box sx={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Skeleton variant="rectangular" width={66} height={20} />
          <Skeleton variant="rectangular" width={210} height={34} />
        </Box>
        <Box sx={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Skeleton variant="rectangular" width={66} height={20} />
          <Skeleton variant="rectangular" width={210} height={34} />
        </Box>
        <Box sx={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Skeleton variant="rectangular" width={66} height={20} />
          <Skeleton variant="rectangular" width={210} height={34} />
        </Box>
      </Box>
      <Box sx={{ width: '100%', display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Skeleton variant="rectangular" width={66} height={20} />
        <Skeleton variant="rectangular" width={230} height={12} />
        <Skeleton variant="rectangular" width="100%" height={54} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </Box>
    </Box>
  </>
)

export default TestSkeletonPage
