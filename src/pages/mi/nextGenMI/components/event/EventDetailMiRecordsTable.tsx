import TungstenRoundedIcon from '@mui/icons-material/TungstenRounded'
import { Stack } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { EventRelatedRecord } from '@/service/mi/nextGenMI/event'
import type { IPaginationResponse } from '@/types/api'

import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'

const PAGE_SIZE_LIST = [10, 15, 20, 50, 100] as const

const getEventRelatedRecordPath = (row: EventRelatedRecord) => {
  if (row.recordType === 'NEWS' && row.sourceObjId !== undefined && row.sourceObjId !== null) {
    return `/mi/market-news/${encodeURIComponent(String(row.sourceObjId))}`
  }

  if (
    row.recordType === 'REPORT' &&
    row.goodsNo !== undefined &&
    row.goodsNo !== null &&
    row.goodsDataNo !== undefined &&
    row.goodsDataNo !== null
  ) {
    return `/mi/data-detail/${encodeURIComponent(String(row.goodsNo))}/${encodeURIComponent(String(row.goodsDataNo))}`
  }

  return undefined
}

/** MI Records 섹션 테이블 props */
interface EventDetailMiRecordsTableProps {
  rows: EventRelatedRecord[]
  serverPagination?: IPaginationResponse<EventRelatedRecord>
  onServerPageChange?: (page: number) => void
  onServerSizeChange?: (size: number) => void
  loading?: boolean
}

const EventDetailMiRecordsTable = ({
  rows,
  serverPagination,
  onServerPageChange,
  onServerSizeChange,
  loading = false,
}: EventDetailMiRecordsTableProps) => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState({ size: 10, page: 1 })

  const isServerMode = serverPagination !== undefined

  const handleTitleClick = useCallback(
    (row: EventRelatedRecord) => {
      const path = getEventRelatedRecordPath(row)
      if (path) navigate(path)
    },
    [navigate],
  )

  const totalPages = useMemo(() => {
    if (isServerMode) return Math.max(1, serverPagination.totalPages)
    return Math.max(1, Math.ceil(rows.length / pagination.size))
  }, [isServerMode, pagination.size, rows.length, serverPagination])

  const safePage = useMemo(() => {
    if (isServerMode) return Math.min(serverPagination.currentPage, totalPages)
    return Math.min(pagination.page, totalPages)
  }, [isServerMode, pagination.page, serverPagination, totalPages])

  useEffect(() => {
    if (isServerMode) return
    if (pagination.page !== safePage) setPagination((p) => ({ ...p, page: safePage }))
  }, [isServerMode, pagination.page, safePage])

  const paginatedRows = useMemo(() => {
    if (isServerMode) return rows
    const page = Math.min(pagination.page, totalPages)
    const start = (page - 1) * pagination.size
    return rows.slice(start, start + pagination.size)
  }, [isServerMode, pagination.page, pagination.size, rows, totalPages])

  const paginationData: IPaginationResponse<EventRelatedRecord> | undefined = useMemo(() => {
    if (isServerMode) {
      if (serverPagination.totalElements === 0) return undefined
      return serverPagination
    }
    if (rows.length === 0) return undefined
    const page = safePage
    return {
      detail: paginatedRows,
      currentPage: page,
      totalPages,
      totalElements: rows.length,
      numberOfElements: paginatedRows.length,
      size: pagination.size,
      isFirst: page === 1,
      isLast: page === totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    }
  }, [isServerMode, paginatedRows, pagination.size, rows.length, safePage, serverPagination, totalPages])

  const columns = useMemo<NextGenMIStickyTableColumn<EventRelatedRecord>[]>(
    () => [
      {
        field: 'publishedAt',
        headerName: '일시',
        width: '160px',
        renderCell: ({ row }) => row.publishedAt ?? '',
      },
      {
        field: 'recordType',
        headerName: '종류',
        width: '100px',
        renderCell: ({ row }) => row.recordType ?? '',
      },
      {
        field: 'title',
        headerName: '타이틀',
        width: '420px',
        renderCell: ({ row }) => {
          const title = row.title ?? ''
          if (!title || !getEventRelatedRecordPath(row)) return title

          return (
            <NextGenMIHoverLinkCell
              value={title}
              variant="body2M14"
              ariaLabel={`${title} 상세 보기`}
              onClick={() => handleTitleClick(row)}
            />
          )
        },
      },
      {
        field: 'summary',
        headerName: '요약',
        width: 'max-content',
        minWidth: '560px',
        maxWidth: 'none',
        renderCell: ({ row }) => row.summary ?? '',
        cellSx: {
          overflow: 'visible',
          textOverflow: 'clip',
        },
      },
    ],
    [handleTitleClick],
  )

  return (
    <Stack width="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<TungstenRoundedIcon sx={{ fontSize: '26px', color: 'contentText.Normal' }} />}
        title="MI Records"
        tooltipTitle=""
      />
      <Stack gap="0px">
        <NextGenMIStickyTable
          columns={columns}
          rows={paginatedRows}
          fixedColumnIndexes={[1, 2]}
          leftAlignedHeaderSticky
          getRowKey={(row, index) => `${row.publishedAt ?? ''}-${row.title ?? ''}-${index}`}
          loading={loading}
          noRowMessage="표시할 데이터가 없습니다."
          rowHeight={!loading && paginatedRows.length === 0 ? '400px' : undefined}
          bodyFontSize="14px"
          skeletonRowCount={pagination.size}
        />
        {paginationData && paginationData.totalElements >= (PAGE_SIZE_LIST.at(0) ?? 0) && (
          <MIPaginationSecondary<EventRelatedRecord>
            data={paginationData}
            size={isServerMode ? serverPagination.size : pagination.size}
            sizeList={[...PAGE_SIZE_LIST]}
            onPageChange={(page) => {
              if (isServerMode) onServerPageChange?.(page)
              else setPagination((p) => ({ ...p, page }))
            }}
            onSizeChange={(size) => {
              if (isServerMode) onServerSizeChange?.(size)
              else setPagination({ size, page: 1 })
            }}
          />
        )}
      </Stack>
    </Stack>
  )
}

export default EventDetailMiRecordsTable
