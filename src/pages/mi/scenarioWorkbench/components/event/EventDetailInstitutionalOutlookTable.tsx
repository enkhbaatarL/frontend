import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import { Box, Stack } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'

import EventDetailSectionHeader from './EventDetailSectionHeader'

import type { EventDetailOutlookRow } from './types'

import MIPagination from '@/components/common/pagination/MIPagination'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import { IPaginationResponse } from '@/types/api'

interface EventDetailInstitutionalOutlookTableProps {
  rows: EventDetailOutlookRow[]
}

/** Figma — 기관 전망 */
const EventDetailInstitutionalOutlookTable = ({ rows }: EventDetailInstitutionalOutlookTableProps) => {
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

  const paginationData: IPaginationResponse<EventDetailOutlookRow> | undefined = useMemo(() => {
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

  const columns: GridColDef<EventDetailOutlookRow>[] = useMemo(
    () => [
      {
        field: 'dateLabel',
        headerName: '일자',
        width: 160,
        align: 'center',
        renderCell: (p) => <MITableCell value={p.value} color="contentText.Normal" />,
      },
      {
        field: 'institution',
        headerName: '기관',
        width: 200,
        align: 'left',
        renderCell: (p) => <MITableCell value={p.value} />,
      },
      {
        field: 'summary',
        headerName: '전망 요약',
        flex: 1,
        minWidth: 280,
        align: 'left',
        renderCell: (p) => <MITableCell value={p.value} tooltipContent={p.value} />,
      },
    ],
    [],
  )

  return (
    <Stack width="100%" py={7.5} gap={3} id="event-detail-section-outlook">
      <EventDetailSectionHeader
        icon={<AccountBalanceOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="기관 전망"
        tooltipTitle="기관별 시장 전망 요약입니다."
      />
      <Stack gap={1} sx={{ width: '100%', maxWidth: 1380 }}>
        <Box height={480} sx={{ '& .MuiDataGrid-root': { height: '100%' } }}>
          <MITable<EventDetailOutlookRow> rowId="id" columns={columns} rows={paginatedRows} disableHover />
        </Box>
        {paginationData && (
          <MIPagination<EventDetailOutlookRow>
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

export default EventDetailInstitutionalOutlookTable
