import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined'
import { Stack } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import type { INextGenMIEventInstitutionOutlook } from '@/service/mi/nextGenMI/event'
import type { IPaginationResponse } from '@/types/api'

import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'

const PAGE_SIZE_LIST = [10, 15, 20, 50, 100] as const

interface EventDetailInstitutionalOutlookTableProps {
  rows: INextGenMIEventInstitutionOutlook[]
  serverPagination?: IPaginationResponse<INextGenMIEventInstitutionOutlook>
  onServerPageChange?: (page: number) => void
  onServerSizeChange?: (size: number) => void
  loading?: boolean
}

const EventDetailInstitutionalOutlookTable = ({
  rows,
  serverPagination,
  onServerPageChange,
  onServerSizeChange,
  loading = false,
}: EventDetailInstitutionalOutlookTableProps) => {
  const [pagination, setPagination] = useState({ size: 10, page: 1 })

  const isServerMode = serverPagination !== undefined

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

  const paginationData: IPaginationResponse<INextGenMIEventInstitutionOutlook> | undefined = useMemo(() => {
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

  const columns = useMemo<NextGenMIStickyTableColumn<INextGenMIEventInstitutionOutlook>[]>(
    () => [
      {
        field: 'publishedAt',
        headerName: '일자',
        width: '160px',
        renderCell: ({ row }) => row.publishedAt,
      },
      { field: 'institutionName', headerName: '기관', width: '200px', renderCell: ({ row }) => row.institutionName },
      {
        field: 'outlookSummary',
        headerName: '전망 요약',
        width: 'max-content',
        minWidth: '640px',
        maxWidth: 'none',
        renderCell: ({ row }) => row.outlookSummary,
        cellSx: {
          overflow: 'visible',
          textOverflow: 'clip',
        },
      },
    ],
    [],
  )

  return (
    <Stack width="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<DomainOutlinedIcon sx={{ fontSize: '26px', color: 'contentText.Normal' }} />}
        title="기관 전망"
        tooltipTitle=""
      />
      <Stack gap="0px">
        <NextGenMIStickyTable
          columns={columns}
          rows={paginatedRows}
          getRowKey={(row, index) => `${row.publishedAt}-${row.institutionName}-${index}`}
          loading={loading}
          noRowMessage="기관 전망 데이터가 없습니다."
          bodyFontSize="14px"
          skeletonRowCount={pagination.size}
        />
        {paginationData && paginationData.totalElements >= (PAGE_SIZE_LIST.at(0) ?? 0) && (
          <MIPaginationSecondary<INextGenMIEventInstitutionOutlook>
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

export default EventDetailInstitutionalOutlookTable
