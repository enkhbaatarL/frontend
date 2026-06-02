import TungstenRoundedIcon from '@mui/icons-material/TungstenRounded'
import { Stack } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'

import type { INextGenMIEventRelatedRecord } from '@/service/mi/nextGenMI/event'

import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import {
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_CELL_PX,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_HEADER_CELL_PY,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_HEADER_LABEL_COLOR,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailTableBodyText'
import { formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import EventDetailHorizontalScrollTableShell from '@/pages/mi/nextGenMI/components/event/EventDetailHorizontalScrollTableShell'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import { IPaginationResponse } from '@/types/api'

const PAGE_SIZE_LIST = [10, 15, 20, 50, 100] as const

/** API `recordType` 값을 MI Records 테이블 종류 컬럼 한글 라벨로 변환 */
const formatMiRecordTypeLabel = (recordType?: string): string => {
  if (!recordType?.trim()) return '-'
  if (recordType === 'NEWS') return '뉴스'
  return recordType
}

/** MI Records 섹션 테이블 props */
interface EventDetailMiRecordsTableProps {
  rows: INextGenMIEventRelatedRecord[]
  serverPagination?: IPaginationResponse<INextGenMIEventRelatedRecord>
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

  const paginationData: IPaginationResponse<INextGenMIEventRelatedRecord> | undefined = useMemo(() => {
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

  const columns: GridColDef<INextGenMIEventRelatedRecord>[] = useMemo(
    () => [
      {
        field: 'publishedAt',
        headerName: '일시',
        width: 160,
        align: 'left',
        renderCell: (params) => formatNextGenMIDateTime(params.row.publishedAt, 'YYYY-MM-DD HH:mm'),
      },
      {
        field: 'recordType',
        headerName: '종류',
        width: 100,
        align: 'left',
        renderCell: (params) => formatMiRecordTypeLabel(params.row.recordType),
      },
      { field: 'title', headerName: '타이틀', width: 420, align: 'left' },
      { field: 'summary', headerName: '요약', flex: 1, minWidth: 560, align: 'left' },
    ],
    [],
  )

  return (
    <Stack width="100%" gap={6} py="30px">
      <EventDetailSectionHeader
        icon={<TungstenRoundedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="MI Records"
        tooltipTitle=""
      />
      <Stack gap={0}>
        <EventDetailHorizontalScrollTableShell>
          <MIDataTableBody<INextGenMIEventRelatedRecord>
            getRowKey={(row, index) => `${row.publishedAt}-${row.title}-${index}`}
            columns={columns}
            rows={paginatedRows}
            loading={loading}
            rowHeight={48}
            primitiveCellTypographyVariant={NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT}
            primitiveCellLineHeight={NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT}
            cellPx={NEXT_GEN_MI_EVENT_DETAIL_TABLE_CELL_PX}
            cellPy={NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_CELL_PY}
            noRowMessage="MI 기록이 없습니다."
            scroll={{
              overflowX: 'auto',
              type: 'floating',
              showThumbOnHover: true,
              stickyHeader: (
                <MIDataTableHeader<INextGenMIEventRelatedRecord>
                  columns={columns}
                  headerCellPy={NEXT_GEN_MI_EVENT_DETAIL_TABLE_HEADER_CELL_PY}
                  headerLabelColor={NEXT_GEN_MI_EVENT_DETAIL_TABLE_HEADER_LABEL_COLOR}
                  enableHorizontalScroll
                />
              ),
            }}
          />
        </EventDetailHorizontalScrollTableShell>
        {paginationData && paginationData.totalElements >= PAGE_SIZE_LIST[0] && (
          <MIPaginationSecondary<INextGenMIEventRelatedRecord>
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
