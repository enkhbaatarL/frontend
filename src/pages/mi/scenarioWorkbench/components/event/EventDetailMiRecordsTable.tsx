import TungstenRoundedIcon from '@mui/icons-material/TungstenRounded'
import { Stack } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'

import type { IScenarioWorkbenchEventRelatedRecord } from '@/service/mi/scenarioWorkbench/event'

import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import { formatWorkbenchDateTime } from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_LABEL_COLOR,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { IPaginationResponse } from '@/types/api'

const PAGE_SIZE_LIST = [10, 15, 20, 50, 100] as const

interface EventDetailMiRecordsTableProps {
  rows: IScenarioWorkbenchEventRelatedRecord[]
  serverPagination?: IPaginationResponse<IScenarioWorkbenchEventRelatedRecord>
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

  const paginationData: IPaginationResponse<IScenarioWorkbenchEventRelatedRecord> | undefined = useMemo(() => {
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

  const columns: GridColDef<IScenarioWorkbenchEventRelatedRecord>[] = useMemo(
    () => [
      {
        field: 'publishedAt',
        headerName: '일시',
        width: 160,
        align: 'left',
        renderCell: (params) => formatWorkbenchDateTime(params.row.publishedAt, 'YYYY-MM-DD HH:mm'),
      },
      { field: 'source', headerName: '종류', width: 100, align: 'left' },
      { field: 'title', headerName: '타이틀', width: 300, align: 'left' },
      { field: 'summary', headerName: '요약', flex: 1, minWidth: 240, align: 'left' },
    ],
    [],
  )

  return (
    <Stack width="100%" gap={6}>
      <EventDetailSectionHeader
        icon={<TungstenRoundedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="MI Records"
        tooltipTitle="이벤트와 연관된 MI 기록입니다."
      />
      <Stack>
        <ScenarioWorkbenchTableHeader<IScenarioWorkbenchEventRelatedRecord>
          columns={columns}
          headerCellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY}
          headerLabelColor={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_LABEL_COLOR}
        />
        <ScenarioWorkbenchDataList<IScenarioWorkbenchEventRelatedRecord>
          getRowKey={(row, index) => `${row.publishedAt}-${row.title}-${index}`}
          columns={columns}
          rows={paginatedRows}
          loading={loading}
          rowHeight={42}
          cellPreset="miCanvasEvent"
          noRowMessage="MI 기록이 없습니다."
        />
        {paginationData && paginationData.totalElements >= PAGE_SIZE_LIST[0] && (
          <MIPaginationSecondary<IScenarioWorkbenchEventRelatedRecord>
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
