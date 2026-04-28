import TungstenRoundedIcon from '@mui/icons-material/TungstenRounded'
import { Box, Stack } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'

import EventDetailSectionHeader from './EventDetailSectionHeader'

import type { EventDetailMiRecordRow } from './types'

import MIPagination from '@/components/common/pagination/MIPagination'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import { IPaginationResponse } from '@/types/api'

interface EventDetailMiRecordsTableProps {
  rows: EventDetailMiRecordRow[]
  /** 서버 페이징 API 연동 시: 응답 페이지 메타 + 콜백 (없으면 기존 클라이언트 slice 모드) */
  serverPagination?: IPaginationResponse<EventDetailMiRecordRow>
  onServerPageChange?: (page: number) => void
  onServerSizeChange?: (size: number) => void
  loading?: boolean
}

/** Figma — MI Records (헤더 py30, 표 1380 기준 열 너비) */
const EventDetailMiRecordsTable = ({
  rows,
  serverPagination,
  onServerPageChange,
  onServerSizeChange,
  loading = false,
}: EventDetailMiRecordsTableProps) => {
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

  const paginationData: IPaginationResponse<EventDetailMiRecordRow> | undefined = useMemo(() => {
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

  const columns: GridColDef<EventDetailMiRecordRow>[] = useMemo(
    () => [
      {
        field: 'atLabel',
        headerName: '일시',
        width: 160,
        align: 'center',
        renderCell: (p) => <MITableCell value={p.value} color="contentText.Normal" />,
      },
      {
        field: 'kind',
        headerName: '종류',
        width: 100,
        align: 'center',
        renderCell: (p) => <MITableCell value={p.value} />,
      },
      {
        field: 'title',
        headerName: '타이틀',
        width: 300,
        align: 'left',
        renderCell: (p) => <MITableCell value={p.value} tooltipContent={p.value} />,
      },
      {
        field: 'summary',
        headerName: '요약',
        flex: 1,
        minWidth: 240,
        align: 'left',
        renderCell: (p) => <MITableCell value={p.value} tooltipContent={p.value} />,
      },
    ],
    [],
  )

  return (
    <Stack width="100%" py={7.5} gap={3} id="event-detail-section-records">
      <EventDetailSectionHeader
        icon={<TungstenRoundedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="MI Records"
        tooltipTitle="이벤트와 연관된 MI 기록입니다."
      />
      <Stack gap={1} sx={{ width: '100%', maxWidth: 1380 }}>
        <Box height={480} sx={{ '& .MuiDataGrid-root': { height: '100%' } }}>
          <MITable<EventDetailMiRecordRow> rowId="id" columns={columns} rows={paginatedRows} loading={loading} disableHover />
        </Box>
        {paginationData && (
          <MIPagination<EventDetailMiRecordRow>
            data={paginationData}
            size={isServerMode ? serverPagination.size : pagination.size}
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
