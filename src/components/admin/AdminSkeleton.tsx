import { Box } from '@mui/material'
import Skeleton from '@mui/material/Skeleton'
import { ReactNode } from 'react'

import AdminLoading from '@/components/admin/AdminLoading'

interface Props {
  loading?: boolean
  children?: ReactNode
  subHeader?: boolean
  filter?: boolean
  table?: boolean
  someItem?: boolean
  textarea?: boolean
  custom?: ReactNode
}

export const SubHeaderSkeleton = () => (
  <Box
    sx={{
      width: '100%',
      padding: '32px 24px',
      backgroundColor: '#F8F9FA',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '8px',
    }}
  >
    <Box sx={{ display: 'flex', gap: '19px', flexWrap: 'wrap' }}>
      <Skeleton variant="rectangular" width={66} height={20} />
      <Skeleton variant="rectangular" width={258} height={20} />
    </Box>
    <Skeleton variant="rectangular" width={454} height={12} />
  </Box>
)

export const FilterSkeleton = () => (
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
)

export const TableSkeleton = () => (
  <Box sx={{ width: '100%', display: 'flex', gap: '30px', flexDirection: 'column', alignItems: 'flex-start' }}>
    <Skeleton variant="rectangular" width="100%" height={86.13} />
    <Skeleton variant="rectangular" width="100%" height={597} />
  </Box>
)

export const SomeItemSkeleton = () => (
  <Box sx={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
    <Skeleton variant="rectangular" width={66} height={20} />
    <Skeleton variant="rectangular" width={120} height={34} />
  </Box>
)

export const TextareaSkeleton = () => (
  <Box sx={{ width: '100%', display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
    <Skeleton variant="rectangular" width="100%" height={300} />
  </Box>
)

export const AdminAccessControlFormSkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
    {/* 관리자 정보 필드 */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton variant="rectangular" width={120} height={24} sx={{ borderRadius: '2px' }} />
      <Skeleton variant="rectangular" width={400} height={16} sx={{ borderRadius: '2px' }} />
      <Box sx={{ mt: 1 }}>
        <Skeleton variant="rectangular" width={498} height={48} sx={{ borderRadius: '4px' }} />
      </Box>
    </Box>

    {/* 구분 필드 */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '2px' }} />
      <Skeleton variant="rectangular" width={498} height={16} sx={{ borderRadius: '2px' }} />
      <Box sx={{ display: 'flex', gap: '16px', mt: 1 }}>
        <Skeleton variant="rectangular" width={90} height={30} sx={{ borderRadius: '16px' }} />
      </Box>
    </Box>

    {/* 타사 서비스 접근 여부 필드 */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton variant="rectangular" width={180} height={24} sx={{ borderRadius: '2px' }} />
      <Skeleton variant="rectangular" width={498} height={16} sx={{ borderRadius: '2px' }} />
      <Box sx={{ mt: 1 }}>
        <Skeleton variant="rectangular" width={90} height={30} sx={{ borderRadius: '16px' }} />
      </Box>
    </Box>

    {/* 관리자 IP 필드 */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: '2px' }} />
      <Skeleton variant="rectangular" width={450} height={16} sx={{ borderRadius: '2px' }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mt: 2 }}>
        <Skeleton variant="rectangular" width={498} height={32.13} sx={{ borderRadius: '4px' }} />
        <Skeleton variant="rectangular" width={498} height={32.13} sx={{ borderRadius: '4px' }} />
        <Skeleton variant="rectangular" width={498} height={32.13} sx={{ borderRadius: '4px' }} />
        <Skeleton variant="rectangular" width={498} height={32.13} sx={{ borderRadius: '4px' }} />
        <Skeleton variant="rectangular" width={498} height={32.13} sx={{ borderRadius: '4px' }} />
      </Box>
    </Box>
  </Box>
)

const AdminSkeleton = ({ loading, children, subHeader, filter, table, someItem, textarea, custom }: Props) => {
  if (!loading) {
    return children
  }

  return [subHeader, filter, table, someItem, textarea, custom].some(Boolean) ? (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '18px' }}>
      {custom ?? (
        <>
          {subHeader && <SubHeaderSkeleton />}
          {filter && <FilterSkeleton />}
          {someItem && <SomeItemSkeleton />}
          {table && <TableSkeleton />}
          {textarea && <TextareaSkeleton />}
        </>
      )}
    </Box>
  ) : (
    <AdminLoading />
  )
}

export default AdminSkeleton
