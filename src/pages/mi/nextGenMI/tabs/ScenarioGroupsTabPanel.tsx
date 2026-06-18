import { Box, Typography } from '@mui/material'
import { type GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import useNavigationToast from '@/hooks/useNavigationToast'
import { defaultNextGenMIDateRange } from '@/pages/mi/nextGenMI/components/common/nextGenMIDateRange'
import ScenarioGroupAccordionList from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupAccordionList'
import ScenarioGroupToolbar, { type ScenarioGroupMode } from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupToolbar'
import ScenarioIndividualTable from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioIndividualTable'
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
]

const ScenarioGroupsTabPanel = () => {
  useNavigationToast()

  const [mode, setMode] = useState<ScenarioGroupMode>('group')
  const [sort, setSort] = useState<ListSort>(ListSort.LATEST)
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultNextGenMIDateRange())
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')
  const [pagination, setPagination] = useState({ size: 20, page: 1 })
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(() => new Set())
  const [expandAll, setExpandAll] = useState(false)

  const isGroupMode = mode === 'group'

  const resetListState = useCallback(() => {
    setPagination((p) => ({ ...p, page: 1 }))
    setExpandedGroupIds(new Set())
    setExpandAll(false)
  }, [])

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
    }
  }, [appliedDateRange, committedKeyword, pagination.page, pagination.size, sort])

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

  const activePagination: IPaginationResponse<IScenarioGroupListItem | IScenarioIndividualItem> | undefined = isGroupMode
    ? groupQuery.data?.scenarioGroups
    : individualQuery.data?.scenarios

  useEffect(() => {
    if (!activePagination) return
    const tp = activePagination.totalPages
    if (tp > 0 && pagination.page > tp) {
      setPagination((p) => ({ ...p, page: tp }))
    }
  }, [activePagination, pagination.page])

  const handleModeChange = useCallback(
    (nextMode: ScenarioGroupMode) => {
      setMode((prev) => {
        if (prev === nextMode) return prev
        resetListState()
        return nextMode
      })
    },
    [resetListState],
  )

  const handleDateRangeApply = useCallback(
    (dates: DateRange) => {
      setAppliedDateRange({ startDate: dates.startDate, endDate: dates.endDate })
      resetListState()
    },
    [resetListState],
  )

  const handleSortChange = useCallback(
    (value: ListSort) => {
      setSort(value)
      resetListState()
    },
    [resetListState],
  )

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value)
  }, [])

  const handleSearch = useCallback(
    (searchTerm: string) => {
      setCommittedKeyword(searchTerm)
      resetListState()
    },
    [resetListState],
  )

  const handleSearchClear = useCallback(() => {
    setKeyword('')
    setCommittedKeyword('')
    resetListState()
  }, [resetListState])

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

  const handlePageSizeChange = useCallback((size: number) => {
    setPagination({ size, page: 1 })
    setExpandedGroupIds(new Set())
    setExpandAll(false)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }))
    setExpandedGroupIds(new Set())
    setExpandAll(false)
  }, [])

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
              getHeaderCellSx={(col) => (col.field === 'scenarioCount' ? { px: '24px' } : undefined)}
            />
          </Box>
        )}
      </NextGenMIStickySlot>

      {isGroupMode ? (
        <ScenarioGroupAccordionList
          groups={groups}
          expandedGroupIds={expandedGroupIds}
          onToggle={handleToggleGroup}
          loading={groupQuery.isLoading}
          skeletonRowCount={pagination.size}
          emptyMessage="조건에 맞는 시나리오 그룹이 없습니다."
          chartBackgroundColor="transparent"
        />
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
