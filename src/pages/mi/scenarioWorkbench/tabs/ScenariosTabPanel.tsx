import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import { ScenarioWorkbenchTypeBadge } from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ProbabilityGaugeCell from '@/pages/mi/scenarioWorkbench/components/common/ProbabilityGaugeCell'
import {
  buildWorkbenchDatePresets,
  mapWorkbenchDateRangeToApiParams,
} from '@/pages/mi/scenarioWorkbench/components/common/scenarioWorkbenchDateRange'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { WorkbenchStickySlot } from '@/pages/mi/scenarioWorkbench/scenarioWorkbenchStickyLayout'
import { MarketImpactLevel, ListPeriod, ListSort, ScenarioWorkbenchStatus } from '@/service/mi/scenarioWorkbench/common'
import scenarioWorkbenchScenarioService, {
  type IGetScenariosParams,
  type IScenarioImpact,
  type IScenarioListItem,
} from '@/service/mi/scenarioWorkbench/scenario'
import { IPaginationResponse } from '@/types/api'

const TYPE_FILTER_OPTIONS = [
  { value: ScenarioWorkbenchStatus.ALL, label: '전체' },
  { value: ScenarioWorkbenchStatus.NEW, label: '신규' },
  { value: ScenarioWorkbenchStatus.UPDATED, label: '갱신' },
] as const

const SORT_OPTIONS = [
  { value: ListSort.LATEST, label: '최신순' },
  { value: ListSort.OLDEST, label: '오래된순' },
] as const

export interface ScenarioRow {
  id: number
  type: ScenarioWorkbenchStatus.NEW | ScenarioWorkbenchStatus.UPDATED
  createdAt: string
  name: string
  jkmImpact: MarketImpactLevel
  ttfImpact: MarketImpactLevel
  hhImpact: MarketImpactLevel
  probability: number
}

const findImpactLevel = (impacts: IScenarioImpact[], indexName: string): MarketImpactLevel =>
  impacts.find((i) => (i.indexName ?? '').toUpperCase() === indexName)?.marketImpactLevel ?? MarketImpactLevel.LOW

const mapScenarioListItemToRow = (item: IScenarioListItem): ScenarioRow => {
  const isUpdated = item.status === ScenarioWorkbenchStatus.UPDATED
  const dateIso = isUpdated ? item.updatedAt : item.createdAt
  const dateLabel = dateIso && dayjs(dateIso).isValid() ? dayjs(dateIso).format('MM-DD HH:mm') : '-'
  const impacts = item.indexImpacts ?? []

  return {
    id: item.scenarioId,
    type: isUpdated ? ScenarioWorkbenchStatus.UPDATED : ScenarioWorkbenchStatus.NEW,
    createdAt: dateLabel,
    name: item.scenarioName,
    jkmImpact: findImpactLevel(impacts, 'JKM'),
    ttfImpact: findImpactLevel(impacts, 'TTF'),
    hhImpact: findImpactLevel(impacts, 'HH'),
    probability: item.probability,
  }
}

const defaultScenariosDateRange = (): DateRange => {
  const t = dayjs().startOf('day')
  return { startDate: t.subtract(6, 'month'), endDate: t }
}

const ScenariosTabPanel = () => {
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState<ScenarioWorkbenchStatus>(ScenarioWorkbenchStatus.ALL)
  const [sort, setSort] = useState<ListSort>(ListSort.LATEST)
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultScenariosDateRange())
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')
  const [pagination, setPagination] = useState({ size: 20, page: 1 })

  const handleSearchChange = useCallback((value: string) => {
    setKeyword(value)
  }, [])

  const handleSearch = useCallback((searchTerm: string) => {
    setCommittedKeyword(searchTerm)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleSearchClear = useCallback(() => {
    setKeyword('')
    setCommittedKeyword('')
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleDateRangeApply = useCallback((dates: DateRange) => {
    setAppliedDateRange({ startDate: dates.startDate, endDate: dates.endDate })
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const listRequest = useMemo((): IGetScenariosParams => {
    const dateSlice =
      appliedDateRange.startDate && appliedDateRange.endDate
        ? mapWorkbenchDateRangeToApiParams(appliedDateRange.startDate, appliedDateRange.endDate)
        : { period: ListPeriod.SIX_MONTHS }

    const trimmedKeyword = committedKeyword.trim()

    return {
      page: pagination.page,
      size: pagination.size,
      sort,
      period: dateSlice.period,
      ...(dateSlice.period === ListPeriod.CUSTOM ? { startDate: dateSlice.startDate, endDate: dateSlice.endDate } : {}),
      keyword: trimmedKeyword || undefined,
      scenarioStatus: typeFilter,
    }
  }, [appliedDateRange, committedKeyword, pagination.page, pagination.size, sort, typeFilter])

  const { data, isLoading } = useQuery({
    queryKey: ['scenarioWorkbenchScenarios', listRequest],
    queryFn: () => scenarioWorkbenchScenarioService.getScenarios(listRequest),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const tableRows = useMemo(() => (data?.scenarios?.detail ?? []).map(mapScenarioListItemToRow), [data?.scenarios?.detail])

  useEffect(() => {
    if (!data?.scenarios) return
    const tp = data.scenarios.totalPages
    if (tp > 0 && pagination.page > tp) {
      setPagination((p) => ({ ...p, page: tp }))
    }
  }, [data?.scenarios, pagination.page])

  const paginationData: IPaginationResponse<ScenarioRow> | undefined = useMemo(() => {
    if (!data?.scenarios) return undefined
    return {
      ...data.scenarios,
      detail: tableRows,
    }
  }, [data?.scenarios, tableRows])

  const handleTypeFilterChange = useCallback((v: string) => {
    setTypeFilter(v as ScenarioWorkbenchStatus)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSort(value as ListSort)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleRowClick = useCallback(
    (params: { row: ScenarioRow }) => navigate(`/mi/scenario-workbench/scenarios/${params.row.id}`),
    [navigate],
  )

  const handlePageSizeChange = useCallback((s: number) => {
    setPagination({ size: s, page: 1 })
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }))
  }, [])

  const columns: GridColDef<ScenarioRow>[] = useMemo(
    () => [
      {
        field: 'type',
        headerName: '생성타입',
        width: 88,
        align: 'center',
        renderCell: (params) => <ScenarioWorkbenchTypeBadge type={params.row.type} />,
      },
      {
        field: 'createdAt',
        headerName: '생성/갱신일시',
        width: 130,
        align: 'center',
      },
      {
        field: 'name',
        headerName: '시나리오명',
        flex: 1,
        minWidth: 360,
        align: 'left',
      },
      {
        field: 'jkmImpact',
        headerName: 'JKM',
        width: 100,
        align: 'center',
        renderCell: (params) => <ImpactDotsCell level={params.row.jkmImpact} />,
      },
      {
        field: 'ttfImpact',
        headerName: 'TTF',
        width: 100,
        align: 'center',
        renderCell: (params) => <ImpactDotsCell level={params.row.ttfImpact} />,
      },
      {
        field: 'hhImpact',
        headerName: 'HH',
        width: 100,
        align: 'center',
        renderCell: (params) => <ImpactDotsCell level={params.row.hhImpact} />,
      },
      {
        field: 'probability',
        headerName: '가능성',
        width: 120,
        align: 'center',
        renderCell: (params) => <ProbabilityGaugeCell probability={params.row.probability} />,
      },
    ],
    [],
  )

  const workbenchDatePresets = useMemo(() => buildWorkbenchDatePresets(), [])

  return (
    <Box width="100%">
      <WorkbenchStickySlot tabKey="scenarios">
        <Typography fontSize={26} fontWeight={700} lineHeight={1.4} py="18px" px={3} color="contentText.Black">
          Scenarios
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ px: 3 }}>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap="12px" sx={{ minWidth: 0, flex: 1 }}>
            <MISlidingSegmented
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={handleTypeFilterChange}
              sx={{ '& .MuiTypography-root': { whiteSpace: 'nowrap' } }}
            />

            <MIDateRangePickerMenu
              dateRange={appliedDateRange}
              onApply={handleDateRangeApply}
              showPreset
              datePresets={workbenchDatePresets}
            />

            <MISelectMenu
              variant="outlined"
              buttonHoverBgColor="gray.20"
              selected={sort}
              onSelected={(value: string) => handleSortChange(value)}
              items={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
            />
          </Stack>

          <Stack direction="row" alignItems="center" gap={3} sx={{ flexShrink: 0 }}>
            <MISearchInput
              storageKey="scenario-workbench-scenarios"
              value={keyword}
              onChange={handleSearchChange}
              placeholder="시나리오명으로 검색"
              onSearch={handleSearch}
              onClear={handleSearchClear}
              width={246}
            />
          </Stack>
        </Stack>

        <ScenarioWorkbenchTableHeader<ScenarioRow> columns={columns} sx={{ mt: 2 }} />
      </WorkbenchStickySlot>

      <ScenarioWorkbenchDataList<ScenarioRow>
        rowId="id"
        columns={columns}
        rows={paginationData?.detail ?? []}
        loading={isLoading}
        skeletonRowCount={pagination.size}
        rowHeight={42}
        noRowMessage="시나리오를 생성해 주세요."
        onRowClick={handleRowClick}
      />

      {paginationData && (
        <MIPaginationSecondary
          data={paginationData}
          size={pagination.size}
          sizeList={[20, 50, 100]}
          onSizeChange={handlePageSizeChange}
          onPageChange={handlePageChange}
        />
      )}
    </Box>
  )
}

export default ScenariosTabPanel
