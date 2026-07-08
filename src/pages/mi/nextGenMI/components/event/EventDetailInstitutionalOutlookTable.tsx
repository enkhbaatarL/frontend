import DescriptionIcon from '@mui/icons-material/Description'
import { Box, Stack } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { EventInstitutionOutlook } from '@/service/mi/nextGenMI/event'
import type { IPaginationResponse } from '@/types/api'

import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import NextGenMIEventDetailBlockSkeleton from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailBlockSkeleton'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import { NEXT_GEN_MI_TABLE_CONTAINER_PADDING } from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import EventDetailSummaryCell from '@/pages/mi/nextGenMI/components/event/EventDetailSummaryCell'
import EventDetailSummaryDialog from '@/pages/mi/nextGenMI/components/event/EventDetailSummaryDialog'

const PAGE_SIZE_LIST = [10, 15, 20, 50, 100] as const

interface EventDetailInstitutionalOutlookTableProps {
  rows: EventInstitutionOutlook[]
  serverPagination?: IPaginationResponse<EventInstitutionOutlook>
  onServerPageChange?: (page: number) => void
  onServerSizeChange?: (size: number) => void
  loading?: boolean
  compact?: boolean
  stickyTopPx?: number
  tableStickyTopPx?: number
}

const EventDetailInstitutionalOutlookTable = ({
  rows,
  serverPagination,
  onServerPageChange,
  onServerSizeChange,
  loading = false,
  compact = false,
  stickyTopPx,
  tableStickyTopPx,
}: EventDetailInstitutionalOutlookTableProps) => {
  const [pagination, setPagination] = useState({ size: 10, page: 1 })
  const [selectedOutlook, setSelectedOutlook] = useState<EventInstitutionOutlook | null>(null)

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

  const paginationData: IPaginationResponse<EventInstitutionOutlook> | undefined = useMemo(() => {
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

  const handleSummaryDialogClose = useCallback(() => {
    setSelectedOutlook(null)
  }, [])

  const columns = useMemo<NextGenMIStickyTableColumn<EventInstitutionOutlook>[]>(
    () => [
      {
        field: 'viewDate',
        headerName: '일자',
        width: '180px',
        renderCell: ({ row }) => row.viewDate ?? '',
      },
      { field: 'institutionName', headerName: '기관', width: '300px', renderCell: ({ row }) => row.institutionName ?? '' },
      {
        field: 'outlookSummary',
        headerName: '전망 요약',
        width: compact || paginatedRows.length === 0 ? 'auto' : '852px',
        minWidth: compact || paginatedRows.length === 0 ? '0px' : '852px',
        maxWidth: compact || paginatedRows.length === 0 ? 'none' : '852px',
        renderCell: ({ row }) => <EventDetailSummaryCell value={row.outlookSummary} />,
        cellSx: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          verticalAlign: 'top',
        },
      },
    ],
    [compact, paginatedRows.length],
  )

  const hasRows = paginatedRows.length > 0
  const sectionHeaderStickyTopPx = hasRows ? stickyTopPx : undefined
  const shouldGroupPageStickyHeader = hasRows && !loading && !compact && stickyTopPx !== undefined && tableStickyTopPx !== undefined
  const renderSectionHeader = (headerStickyTopPx?: number) => (
    <EventDetailSectionHeader
      icon={<DescriptionIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
      title="기관 전망"
      tooltipTitle=""
      stickyTopPx={headerStickyTopPx}
    />
  )
  const paginationNode =
    paginationData && paginationData.totalElements >= (PAGE_SIZE_LIST.at(0) ?? 0) ? (
      <MIPaginationSecondary<EventInstitutionOutlook>
        data={paginationData}
        size={isServerMode ? serverPagination.size : pagination.size}
        sizeList={[...PAGE_SIZE_LIST]}
        paddingTop={`${NEXT_GEN_MI_TABLE_CONTAINER_PADDING}px`}
        onPageChange={(page) => {
          if (isServerMode) onServerPageChange?.(page)
          else setPagination((p) => ({ ...p, page }))
        }}
        onSizeChange={(size) => {
          if (isServerMode) onServerSizeChange?.(size)
          else setPagination({ size, page: 1 })
        }}
      />
    ) : null

  return (
    <Stack width="100%" gap={shouldGroupPageStickyHeader ? '0px' : '12px'} py={compact ? '0px' : '20px'}>
      {!compact && !shouldGroupPageStickyHeader && renderSectionHeader(sectionHeaderStickyTopPx)}
      {loading ? (
        <Box bgcolor="commonColor.White" borderRadius="10px" padding={`${NEXT_GEN_MI_TABLE_CONTAINER_PADDING}px`} boxSizing="border-box">
          <NextGenMIEventDetailBlockSkeleton height="400px" />
        </Box>
      ) : shouldGroupPageStickyHeader ? (
        <>
          <NextGenMIStickyTable
            columns={columns}
            rows={paginatedRows}
            fixedLeftColumnIndexes={[1]}
            leftAlignedHeaderSticky
            getRowKey={(row, index) => `${row.viewDate ?? ''}-${row.institutionName ?? ''}-${index}`}
            noRowMessage="표시할 데이터가 없습니다."
            rowHeight={paginatedRows.length === 0 ? '400px' : 'auto'}
            containerPadding={`${NEXT_GEN_MI_TABLE_CONTAINER_PADDING}px`}
            disableHorizontalScroll={compact}
            pageStickyHeaderTop={stickyTopPx}
            pageStickyHeaderBefore={renderSectionHeader()}
            pageStickyHeaderGap="12px"
            pageStickyHeaderReleaseOnLastRow
            onRowClick={(row) => setSelectedOutlook(row)}
          />
          {paginationNode && (
            <Box
              bgcolor="commonColor.White"
              borderRadius="0 0 10px 10px"
              padding={`0 ${NEXT_GEN_MI_TABLE_CONTAINER_PADDING}px ${NEXT_GEN_MI_TABLE_CONTAINER_PADDING}px`}
              mt={`-${NEXT_GEN_MI_TABLE_CONTAINER_PADDING}px`}
              boxSizing="border-box"
            >
              {paginationNode}
            </Box>
          )}
        </>
      ) : (
        <Box bgcolor="commonColor.White" borderRadius="10px" padding={`${NEXT_GEN_MI_TABLE_CONTAINER_PADDING}px`} boxSizing="border-box">
          <NextGenMIStickyTable
            columns={columns}
            rows={paginatedRows}
            fixedLeftColumnIndexes={[1]}
            leftAlignedHeaderSticky
            getRowKey={(row, index) => `${row.viewDate ?? ''}-${row.institutionName ?? ''}-${index}`}
            noRowMessage="표시할 데이터가 없습니다."
            rowHeight={paginatedRows.length === 0 ? '400px' : 'auto'}
            containerShell={false}
            disableHorizontalScroll={compact}
            pageStickyHeaderTop={hasRows ? tableStickyTopPx : undefined}
            onRowClick={(row) => setSelectedOutlook(row)}
          />
          {paginationNode}
        </Box>
      )}
      <EventDetailSummaryDialog
        open={selectedOutlook !== null}
        title="기관 전망"
        summaryLabel="전망 요약"
        summary={selectedOutlook?.outlookSummary}
        infoItems={[
          { label: '일자', value: selectedOutlook?.viewDate },
          { label: '기관', value: selectedOutlook?.institutionName },
        ]}
        onClose={handleSummaryDialogClose}
      />
    </Stack>
  )
}

export default EventDetailInstitutionalOutlookTable
