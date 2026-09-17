import { Box, Stack, Typography } from '@mui/material'
import { type GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import useNavigationToast from '@/hooks/useNavigationToast'
import { defaultNextGenMIDateRange } from '@/pages/mi/nextGenMI/components/common/nextGenMIDateRange'
import ScenarioGroupAccordionList from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupAccordionList'
import ScenarioGroupToolbar, { type ScenarioGroupMode } from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupToolbar'
import ScenarioIndividualTable from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioIndividualTable'
import { useNextGenMIListState } from '@/pages/mi/nextGenMI/NextGenMIListStateContext'
import { NextGenMIStickySlot } from '@/pages/mi/nextGenMI/nextGenMIStickyLayout'
import { ListSort } from '@/service/mi/nextGenMI/common'
import nextGenMIScenarioGroupService, {
  type IGetScenarioGroupListParams,
  type IScenarioGroupListItem,
  type IScenarioIndividualItem,
} from '@/service/mi/nextGenMI/scenarioGroup'
import { type IPaginationResponse } from '@/types/api'

const GROUP_HEADER_COLUMNS: GridColDef[] = [
  { field: 'chevron', headerName: '', width: 32 },
  { field: 'createdAt', headerName: '생성일시', width: 110, align: 'left' },
  { field: 'indicator', headerName: '', width: 10 },
  { field: 'groupName', headerName: '시나리오 그룹', flex: 408, align: 'left' },
  { field: 'summary', headerName: '시나리오 그룹 요약', flex: 700, align: 'left' },
  { field: 'scenarioCount', headerName: '시나리오 수', width: 120, align: 'right' },
  { field: 'eventCount', headerName: '이벤트 수', width: 120, align: 'right' },
]

const COUNT_HEADER_FIELDS = new Set(['scenarioCount', 'eventCount'])

const ScenarioGroupsTabPanel = () => {
  useNavigationToast()

  const [mode, setMode] = useNextGenMIListState<ScenarioGroupMode>('scenarios.mode', 'group')
  const [sort, setSort] = useNextGenMIListState<ListSort>('scenarios.sort', ListSort.LATEST)
  const [appliedDateRange, setAppliedDateRange] = useNextGenMIListState<DateRange>('scenarios.appliedDateRange', defaultNextGenMIDateRange)
  const [keyword, setKeyword] = useNextGenMIListState('scenarios.keyword', '')
  const [committedKeyword, setCommittedKeyword] = useNextGenMIListState('scenarios.committedKeyword', '')
  const [mineOnly, setMineOnly] = useNextGenMIListState('scenarios.mineOnly', false)
  const [pagination, setPagination] = useNextGenMIListState('scenarios.pagination', { size: 20, page: 1 })
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(() => new Set())
  const [expandAll, setExpandAll] = useState(false)

  const isGroupMode = mode === 'group'

  const resetListState = useCallback(() => {
    setPagination((p) => ({ ...p, page: 1 }))
    setExpandedGroupIds(new Set())
    setExpandAll(false)
  }, [setPagination])

  const listRequest = useMemo((): IGetScenarioGroupListParams => {
    const resolvedRange = appliedDateRange.startDate && appliedDateRange.endDate ? appliedDateRange : defaultNextGenMIDateRange()
    const trimmedKeyword = committedKeyword.trim()

    return {
      page: pagination.page,
      size: pagination.size,
      sort,
      startDate: resolvedRange.startDate!.startOf('day').format('YYYY-MM-DD'),
      endDate: resolvedRange.endDate!.endOf('day').format('YYYY-MM-DD'),
      keyword: trimmedKeyword || undefined,
      mineOnly: mineOnly || undefined,
    }
  }, [appliedDateRange, committedKeyword, mineOnly, pagination.page, pagination.size, sort])

  const groupQuery = useQuery({
    queryKey: ['nextGenMIScenarioGroups', listRequest],
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroups(listRequest),
    enabled: isGroupMode,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const individualQuery = useQuery({
    queryKey: ['nextGenMIScenarioGroupScenarios', listRequest],
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupScenarios(listRequest),
    enabled: !isGroupMode,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const groups = useMemo(() => groupQuery.data?.scenarioGroups.detail ?? [], [groupQuery.data?.scenarioGroups.detail])
  const individualScenarios = individualQuery.data?.scenarios.detail ?? []

  // Event List와 동일: 데이터 없는 fetch 구간은 스켈레톤 유지 (로딩↔빈목록 전환으로 pulse가 끊기지 않게)
  const isGroupListLoading = groupQuery.isLoading || (groupQuery.isFetching && groups.length === 0)

  const activePagination: IPaginationResponse<IScenarioGroupListItem | IScenarioIndividualItem> | undefined = isGroupMode
    ? groupQuery.data?.scenarioGroups
    : individualQuery.data?.scenarios

  useEffect(() => {
    if (!activePagination) return
    const tp = activePagination.totalPages
    if (tp > 0 && pagination.page > tp) {
      setPagination((p) => ({ ...p, page: tp }))
    }
  }, [activePagination, pagination.page, setPagination])

  const handleModeChange = useCallback(
    (nextMode: ScenarioGroupMode) => {
      if (mode === nextMode) return
      setMode(nextMode)
      resetListState()
    },
    [mode, resetListState, setMode],
  )

  const handleDateRangeApply = useCallback(
    (dates: DateRange) => {
      setAppliedDateRange({ startDate: dates.startDate, endDate: dates.endDate })
      resetListState()
    },
    [resetListState, setAppliedDateRange],
  )

  const handleSortChange = useCallback(
    (value: ListSort) => {
      setSort(value)
      resetListState()
    },
    [resetListState, setSort],
  )

  const handleMineOnlyChange = useCallback(
    (next: boolean) => {
      setMineOnly(next)
      resetListState()
    },
    [resetListState, setMineOnly],
  )

  const handleKeywordChange = useCallback(
    (value: string) => {
      setKeyword(value)
    },
    [setKeyword],
  )

  const handleSearch = useCallback(
    (searchTerm: string) => {
      setCommittedKeyword(searchTerm)
      resetListState()
    },
    [resetListState, setCommittedKeyword],
  )

  const handleSearchClear = useCallback(() => {
    setKeyword('')
    setCommittedKeyword('')
    resetListState()
  }, [resetListState, setCommittedKeyword, setKeyword])

  const handleExpandAllChange = useCallback(
    (next: boolean) => {
      setExpandAll(next)
      setExpandedGroupIds(next ? new Set(groups.map((group) => group.scenarioGroupId)) : new Set())
    },
    [groups],
  )

  const handleToggleGroup = useCallback((scenarioGroupId: number) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(scenarioGroupId)) {
        next.delete(scenarioGroupId)
      } else {
        next.add(scenarioGroupId)
      }
      return next
    })
    setExpandAll(false)
  }, [])

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPagination({ size, page: 1 })
      setExpandedGroupIds(new Set())
      setExpandAll(false)
    },
    [setPagination],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      setPagination((p) => ({ ...p, page }))
      setExpandedGroupIds(new Set())
      setExpandAll(false)
    },
    [setPagination],
  )

  const showGroupListCellSkeleton = useCallback((col: GridColDef) => String(col.headerName ?? '').trim() !== '', [])

  const getGroupListCellSx = useCallback(({ field }: { field: string }) => {
    if (COUNT_HEADER_FIELDS.has(field)) return { px: '24px' }
    return {}
  }, [])

  const groupListEmptyOverlay = useMemo(
    () => (
      <Stack alignItems="center" justifyContent="center" minHeight="240px" width="100%">
        <Typography variant="body2M14" color="contentText.Normal">
          조건에 맞는 시나리오 그룹이 없습니다.
        </Typography>
      </Stack>
    ),
    [],
  )

  return (
    <Box width="100%">
      <NextGenMIStickySlot tabKey="scenarios">
        <Typography fontSize={26} fontWeight={700} lineHeight={1.4} py="18px" color="contentText.Black">
          Scenario Group List
        </Typography>

        <ScenarioGroupToolbar
          mode={mode}
          onModeChange={handleModeChange}
          appliedDateRange={appliedDateRange}
          onDateRangeApply={handleDateRangeApply}
          sort={sort}
          onSortChange={handleSortChange}
          mineOnly={mineOnly}
          onMineOnlyChange={handleMineOnlyChange}
          expandAll={expandAll}
          onExpandAllChange={handleExpandAllChange}
          keyword={keyword}
          onKeywordChange={handleKeywordChange}
          onSearch={handleSearch}
          onSearchClear={handleSearchClear}
        />

        {isGroupMode && (
          <Box mt={2}>
            <MIDataTableHeader
              columns={GROUP_HEADER_COLUMNS}
              headerCellPx={6}
              getHeaderCellSx={(col) => (COUNT_HEADER_FIELDS.has(col.field) ? { px: '24px' } : undefined)}
            />
          </Box>
        )}
      </NextGenMIStickySlot>

      {isGroupMode ? (
        <>
          {/* Event List와 같이 MIDataTableBody는 유지 마운트. 데이터 행만 아코디언으로 교체 */}
          <Box
            aria-hidden={!isGroupListLoading && groups.length > 0}
            sx={{ display: isGroupListLoading || groups.length === 0 ? 'block' : 'none' }}
          >
            <MIDataTableBody
              columns={GROUP_HEADER_COLUMNS}
              rows={[]}
              loading={isGroupListLoading}
              skeletonRowCount={pagination.size}
              showCellSkeleton={showGroupListCellSkeleton}
              disableHoverState
              rowHeight={48}
              cellPx={6}
              topPaddingPx={0}
              noRowsOverlay={groupListEmptyOverlay}
              getCellSx={getGroupListCellSx}
              sx={{
                '& > .MuiBox-root': {
                  minHeight: '400px',
                  borderRadius: 0,
                  borderBottom: '1px solid',
                  borderColor: 'gray.30',
                },
              }}
            />
          </Box>
          {!isGroupListLoading && groups.length > 0 && (
            <ScenarioGroupAccordionList
              groups={groups}
              expandedGroupIds={expandedGroupIds}
              onToggle={handleToggleGroup}
              emptyMessage="조건에 맞는 시나리오 그룹이 없습니다."
              chartBackgroundColor="transparent"
            />
          )}
        </>
      ) : (
        <Box mt={2}>
          <ScenarioIndividualTable scenarios={individualScenarios} loading={individualQuery.isLoading} skeletonRowCount={pagination.size} />
        </Box>
      )}

      {activePagination && (
        <MIPaginationSecondary
          data={activePagination}
          size={pagination.size}
          sizeList={[20, 50, 100]}
          onSizeChange={handlePageSizeChange}
          onPageChange={handlePageChange}
        />
      )}
    </Box>
  )
}

export default ScenarioGroupsTabPanel
