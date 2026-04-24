import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
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
}

/** Figma — MI Records (헤더 py30, 표 1380 기준 열 너비) */
const EventDetailMiRecordsTable = ({ rows }: EventDetailMiRecordsTableProps) => {
  const [pagination, setPagination] = useState({ size: 10, page: 1 })

  const totalPages = useMemo(() => Math.max(1, Math.ceil(rows.length / pagination.size)), [rows.length, pagination.size])
  const safePage = Math.min(pagination.page, totalPages)

  useEffect(() => {
    if (pagination.page !== safePage) setPagination((p) => ({ ...p, page: safePage }))
  }, [pagination.page, safePage])

  const paginatedRows = useMemo(() => {
    const page = Math.min(pagination.page, totalPages)
    const start = (page - 1) * pagination.size
    return rows.slice(start, start + pagination.size)
  }, [rows, pagination.page, pagination.size, totalPages])

  const paginationData: IPaginationResponse<EventDetailMiRecordRow> | undefined = useMemo(() => {
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
  }, [paginatedRows, pagination.size, rows.length, safePage, totalPages])

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
        icon={<DescriptionOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="MI Records"
        tooltipTitle="이벤트와 연관된 MI 기록입니다."
      />
      <Stack gap={1} sx={{ width: '100%', maxWidth: 1380 }}>
        <Box height={480} sx={{ '& .MuiDataGrid-root': { height: '100%' } }}>
          <MITable<EventDetailMiRecordRow> rowId="id" columns={columns} rows={paginatedRows} disableHover />
        </Box>
        {paginationData && (
          <MIPagination<EventDetailMiRecordRow>
            data={paginationData}
            size={pagination.size}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            onSizeChange={(size) => setPagination({ size, page: 1 })}
          />
        )}
      </Stack>
    </Stack>
  )
}

export default EventDetailMiRecordsTable
