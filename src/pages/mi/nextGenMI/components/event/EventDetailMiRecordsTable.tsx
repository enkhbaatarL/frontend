import SourceIcon from '@mui/icons-material/Source'
import { Box, Stack } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { EventRelatedRecord } from '@/service/mi/nextGenMI/event'
import type { IPaginationResponse } from '@/types/api'

import ShakeableLockIcon from '@/components/common/icons/ShakeableLockIcon'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MIDataTableCellText from '@/components/common/table/MIDataTableCellText'
import NextGenMIEventDetailBlockSkeleton from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailBlockSkeleton'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import { NEXT_GEN_MI_TABLE_CONTAINER_PADDING } from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import EventDetailSummaryCell from '@/pages/mi/nextGenMI/components/event/EventDetailSummaryCell'
import EventDetailSummaryDialog from '@/pages/mi/nextGenMI/components/event/EventDetailSummaryDialog'

const PAGE_SIZE_LIST = [5, 10, 15, 20, 50, 100] as const

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  25%, 75% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
`

const getEventRelatedRecordRowKey = (row: EventRelatedRecord, index: number) => `${row.publishedAt ?? ''}-${row.title ?? ''}-${index}`

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
  compact?: boolean
  stickyTopPx?: number
  tableStickyTopPx?: number
}

const EventDetailMiRecordsTable = ({
  rows,
  serverPagination,
  onServerPageChange,
  onServerSizeChange,
  loading = false,
  compact = false,
  stickyTopPx,
  tableStickyTopPx,
}: EventDetailMiRecordsTableProps) => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState({ size: 10, page: 1 })
  const [shakingRowKeys, setShakingRowKeys] = useState<Set<string>>(new Set())
  const [selectedRecord, setSelectedRecord] = useState<EventRelatedRecord | null>(null)

  const isServerMode = serverPagination !== undefined

  const handleTitleClick = useCallback(
    (row: EventRelatedRecord) => {
      if (row.isPermitted === false) return
      const path = getEventRelatedRecordPath(row)
      if (path) navigate(path)
    },
    [navigate],
  )

  const handleLockedTitleClick = useCallback((itemKey: string) => {
    setShakingRowKeys((prev) => new Set(prev).add(itemKey))
    setTimeout(() => {
      setShakingRowKeys((prev) => {
        const next = new Set(prev)
        next.delete(itemKey)
        return next
      })
    }, 400)
  }, [])

  const handleSummaryDialogClose = useCallback(() => {
    setSelectedRecord(null)
  }, [])

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
        headerName: '일자',
        width: '180px',
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
        headerName: '제목',
        width: '400px',
        renderCell: ({ row, rowIndex }) => {
          const title = row.title ?? ''
          if (!title) return title

          if (row.isPermitted === false) {
            const itemKey = getEventRelatedRecordRowKey(row, rowIndex)

            return (
              <Stack
                component="button"
                type="button"
                direction="row"
                alignItems="center"
                minWidth={0}
                maxWidth="100%"
                color="contentText.Black"
                aria-label={`${title} 권한 없음`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLockedTitleClick(itemKey)
                }}
                sx={{
                  p: 0,
                  border: 0,
                  backgroundColor: 'transparent',
                  font: 'inherit',
                  cursor: 'default',
                  textAlign: 'left',
                  width: 'fit-content',
                  animation: shakingRowKeys.has(itemKey) ? `${shakeAnimation} 0.4s ease-in-out` : 'none',
                }}
              >
                <ShakeableLockIcon
                  width={16}
                  height={16}
                  sx={{ animation: 'none', marginLeft: 0, marginRight: '4px', display: 'inline-flex', verticalAlign: 'middle' }}
                />
                <MIDataTableCellText
                  value={title}
                  variant="body2M14"
                  color="inherit"
                  tooltipWhenTruncated
                  component="span"
                  sx={{ display: 'block', minWidth: 0, flex: '0 1 auto', width: 'auto' }}
                />
              </Stack>
            )
          }

          if (!getEventRelatedRecordPath(row)) return title

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
        width: compact || paginatedRows.length === 0 ? 'auto' : '652px',
        minWidth: compact || paginatedRows.length === 0 ? '0px' : '652px',
        maxWidth: compact || paginatedRows.length === 0 ? 'none' : '652px',
        renderCell: ({ row }) => <EventDetailSummaryCell value={row.summary} sx={{ whiteSpace: 'pre-line' }} />,
        cellSx: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          verticalAlign: 'top',
        },
      },
    ],
    [compact, handleLockedTitleClick, handleTitleClick, paginatedRows.length, shakingRowKeys],
  )

  const hasRows = paginatedRows.length > 0
  const sectionHeaderStickyTopPx = hasRows ? stickyTopPx : undefined
  const shouldGroupPageStickyHeader = hasRows && !loading && !compact && stickyTopPx !== undefined && tableStickyTopPx !== undefined
  const renderSectionHeader = (headerStickyTopPx?: number) => (
    <EventDetailSectionHeader
      icon={<SourceIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
      title="MI Records"
      tooltipTitle=""
      stickyTopPx={headerStickyTopPx}
    />
  )
  const paginationNode =
    paginationData && paginationData.totalElements >= (PAGE_SIZE_LIST.at(0) ?? 0) ? (
      <MIPaginationSecondary<EventRelatedRecord>
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
            fixedLeftColumnIndexes={[2]}
            leftAlignedHeaderSticky
            getRowKey={getEventRelatedRecordRowKey}
            noRowMessage="표시할 데이터가 없습니다."
            rowHeight={paginatedRows.length === 0 ? '400px' : 'auto'}
            containerPadding={`${NEXT_GEN_MI_TABLE_CONTAINER_PADDING}px`}
            disableHorizontalScroll={compact}
            pageStickyHeaderTop={stickyTopPx}
            pageStickyHeaderBefore={renderSectionHeader()}
            pageStickyHeaderGap="12px"
            pageStickyHeaderReleaseOnLastRow
            onRowClick={(row) => setSelectedRecord(row)}
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
            fixedLeftColumnIndexes={[2]}
            leftAlignedHeaderSticky
            getRowKey={getEventRelatedRecordRowKey}
            noRowMessage="표시할 데이터가 없습니다."
            rowHeight={paginatedRows.length === 0 ? '400px' : 'auto'}
            containerShell={false}
            disableHorizontalScroll={compact}
            pageStickyHeaderTop={hasRows ? tableStickyTopPx : undefined}
            onRowClick={(row) => setSelectedRecord(row)}
          />
          {paginationNode}
        </Box>
      )}
      <EventDetailSummaryDialog
        open={selectedRecord !== null}
        title="MI Records"
        items={[
          { label: '일자', value: selectedRecord?.publishedAt },
          { label: '종류', value: selectedRecord?.recordType },
          { label: '제목', value: selectedRecord?.title, fullWidth: true },
          { label: '요약', value: selectedRecord?.summary, fullWidth: true, scrollable: true },
          { label: '핵심근거', value: selectedRecord?.mappingReason, fullWidth: true },
        ]}
        onClose={handleSummaryDialogClose}
      />
    </Stack>
  )
}

export default EventDetailMiRecordsTable
