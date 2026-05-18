import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import FirstPageRoundedIcon from '@mui/icons-material/FirstPageRounded'
import LastPageRoundedIcon from '@mui/icons-material/LastPageRounded'
import { Box, Typography } from '@mui/material'
import { useMemo } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MISelectMenu, { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import { IPaginationResponse } from '@/types/api'

export interface MIPaginationSecondaryProps<T> {
  data?: IPaginationResponse<T>
  size?: number
  sizeList?: number[]
  onSizeChange?: (value: number) => void
  onPageChange?: (value: number) => void
  disabled?: boolean
  paddingTop?: string | number
  hideSizeSelector?: boolean
}

type PaginationNavIcon = typeof FirstPageRoundedIcon

interface PaginationNavItem {
  key: string
  title: string
  Icon: PaginationNavIcon
  can: boolean
  onClick: () => void
}

const MIPaginationSecondary = <T,>({
  data,
  size,
  sizeList,
  onSizeChange,
  onPageChange,
  disabled,
  paddingTop = '20px',
  hideSizeSelector,
}: MIPaginationSecondaryProps<T>) => {
  const page = data?.currentPage ?? 1
  const count = data?.totalPages ?? 0

  const sizeItems = useMemo<SelectMenuItem<number>[]>(() => {
    const list = sizeList ?? [10, 15, 20, 50, 100]
    return list.map((pageSize) => ({ label: pageSize.toString(), value: pageSize }))
  }, [sizeList])

  const paginationRange = useMemo(() => {
    const pageSize = size ?? 20
    const totalElements = data?.totalElements ?? 0
    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, totalElements)
    return `${start.toLocaleString()}-${end.toLocaleString()} of ${totalElements.toLocaleString()}`
  }, [data?.totalElements, page, size])

  const paginationNavItems = useMemo((): PaginationNavItem[] => {
    const canNavigate = {
      first: page > 1,
      prev: page > 1,
      next: page < count,
      last: page < count,
    }

    return [
      {
        key: 'first',
        title: '첫 번째 페이지',
        Icon: FirstPageRoundedIcon,
        can: canNavigate.first,
        onClick: () => onPageChange?.(1),
      },
      {
        key: 'prev',
        title: '이전 페이지',
        Icon: ChevronLeftRoundedIcon,
        can: canNavigate.prev,
        onClick: () => onPageChange?.(Math.max(1, page - 1)),
      },
      {
        key: 'next',
        title: '다음 페이지',
        Icon: ChevronRightRoundedIcon,
        can: canNavigate.next,
        onClick: () => onPageChange?.(Math.min(count, page + 1)),
      },
      {
        key: 'last',
        title: '마지막 페이지',
        Icon: LastPageRoundedIcon,
        can: canNavigate.last,
        onClick: () => onPageChange?.(count),
      },
    ]
  }, [page, count, onPageChange])

  return data ? (
    <Box display="flex" alignItems="center" justifyContent="flex-end" gap="20px" pt={paddingTop} width="100%">
      {!hideSizeSelector && (
        <Box display="flex" alignItems="center" gap="10px">
          <Typography variant="body2M14" color="contentText.Normal" whiteSpace="nowrap">
            페이지당 행 수
          </Typography>
          {size ? (
            <MISelectMenu<number>
              variant="outlined"
              selected={size}
              onSelected={(next: number) => onSizeChange?.(next)}
              items={sizeItems}
              placement="bottom-start"
              disablePortal={false}
              sx={{ height: 36 }}
            />
          ) : null}
        </Box>
      )}

      <Typography variant="body2M14" color="contentText.Black" whiteSpace="nowrap" sx={{ letterSpacing: '0.7px' }}>
        {paginationRange}
      </Typography>

      <Box display="flex" alignItems="center" gap="10px">
        {paginationNavItems.map(({ key, title, Icon, can, onClick }) => (
          <MIBaseButton
            key={key}
            variant="outlined"
            onClick={onClick}
            disabled={disabled || !can}
            title={title}
            sx={{
              height: 36,
              padding: '8px',
            }}
          >
            <Icon fontSize="small" />
          </MIBaseButton>
        ))}
      </Box>
    </Box>
  ) : null
}

export default MIPaginationSecondary
