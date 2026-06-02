import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined'
import { Stack } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'

import type { IScenarioWorkbenchEventInstitutionOutlook } from '@/service/mi/scenarioWorkbench/event'

import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { formatWorkbenchDateTime } from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_LABEL_COLOR,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailHorizontalScrollTableShell from '@/pages/mi/scenarioWorkbench/components/event/EventDetailHorizontalScrollTableShell'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'
import { IPaginationResponse } from '@/types/api'

const PAGE_SIZE_LIST = [10, 15, 20, 50, 100] as const

interface EventDetailInstitutionalOutlookTableProps {
  rows: IScenarioWorkbenchEventInstitutionOutlook[]
  serverPagination?: IPaginationResponse<IScenarioWorkbenchEventInstitutionOutlook>
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

  const paginationData: IPaginationResponse<IScenarioWorkbenchEventInstitutionOutlook> | undefined = useMemo(() => {
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

  const columns: GridColDef<IScenarioWorkbenchEventInstitutionOutlook>[] = useMemo(
    () => [
      {
        field: 'publishedAt',
        headerName: '일자',
        width: 160,
        align: 'left',
        renderCell: (params) => formatWorkbenchDateTime(params.row.publishedAt, 'YYYY-MM-DD HH:mm'),
      },
      { field: 'institutionName', headerName: '기관', width: 200, align: 'left' },
      { field: 'outlookSummary', headerName: '전망 요약', flex: 1, minWidth: 640, align: 'left' },
    ],
    [],
  )

  return (
    <Stack width="100%" gap={6} py="30px">
      <EventDetailSectionHeader
        icon={<DomainOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="기관 전망"
        tooltipTitle=""
      />
      <Stack gap={0}>
        <EventDetailHorizontalScrollTableShell>
          <MIDataTableBody<IScenarioWorkbenchEventInstitutionOutlook>
            getRowKey={(row, index) => `${row.publishedAt}-${row.institutionName}-${index}`}
            columns={columns}
            rows={paginatedRows}
            loading={loading}
            rowHeight={48}
            primitiveCellTypographyVariant={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT}
            primitiveCellLineHeight={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT}
            cellPx={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX}
            cellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY}
            noRowMessage="기관 전망 데이터가 없습니다."
            scroll={{
              overflowX: 'auto',
              type: 'floating',
              showThumbOnHover: true,
              stickyHeader: (
                <MIDataTableHeader<IScenarioWorkbenchEventInstitutionOutlook>
                  columns={columns}
                  headerCellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY}
                  headerLabelColor={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_LABEL_COLOR}
                  enableHorizontalScroll
                />
              ),
            }}
          />
        </EventDetailHorizontalScrollTableShell>
        {paginationData && paginationData.totalElements >= PAGE_SIZE_LIST[0] && (
          <MIPaginationSecondary<IScenarioWorkbenchEventInstitutionOutlook>
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
