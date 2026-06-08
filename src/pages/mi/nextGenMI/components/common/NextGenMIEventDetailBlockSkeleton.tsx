import { Skeleton, type SxProps, type Theme } from '@mui/material'

interface NextGenMIEventDetailBlockSkeletonProps {
  height?: string | number
  sx?: SxProps<Theme>
}

const NextGenMIEventDetailBlockSkeleton = ({ height = '400px', sx }: NextGenMIEventDetailBlockSkeletonProps) => (
  <Skeleton variant="rounded" width="100%" height={height} sx={{ borderRadius: '10px', ...sx }} />
)

export default NextGenMIEventDetailBlockSkeleton
