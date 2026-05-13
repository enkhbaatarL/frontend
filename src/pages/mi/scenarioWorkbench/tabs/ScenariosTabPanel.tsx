import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import ClassificationTag from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
// import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ProbabilityGaugeCell from '@/pages/mi/scenarioWorkbench/components/common/ProbabilityGaugeCell'
import {
  // findIndexImpact,
  formatWorkbenchDateTime,
  WORKBENCH_LIST_SORT_OPTIONS,
  WORKBENCH_STATUS_FILTER_OPTIONS,
} from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import { classificationPropsFromScenarioListRow } from '@/pages/mi/scenarioWorkbench/components/common/scenarioWorkbenchClassificationChip'
import {
  buildWorkbenchDatePresets,
  defaultWorkbenchDateRange,
} from '@/pages/mi/scenarioWorkbench/components/common/scenarioWorkbenchDateRange'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { WorkbenchStickySlot } from '@/pages/mi/scenarioWorkbench/scenarioWorkbenchStickyLayout'
import { ListSort, ScenarioWorkbenchStatus } from '@/service/mi/scenarioWorkbench/common'
import scenarioWorkbenchScenarioService, { type IGetScenariosParams, type IScenarioListItem } from '@/service/mi/scenarioWorkbench/scenario'

const formatScenarioTime = (item: IScenarioListItem) => {
  const dateIso = item.status === ScenarioWorkbenchStatus.UPDATED ? item.updatedAt : item.createdAt
  return formatWorkbenchDateTime(dateIso)
}

const ScenariosTabPanel = () => {
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState<ScenarioWorkbenchStatus>(ScenarioWorkbenchStatus.ALL)
  const [sort, setSort] = useState<ListSort>(ListSort.LATEST)
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultWorkbenchDateRange())
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
    const resolvedRange = appliedDateRange.startDate && appliedDateRange.endDate ? appliedDateRange : defaultWorkbenchDateRange()

    const trimmedKeyword = committedKeyword.trim()

    return {
      page: pagination.page,
      size: pagination.size,
      sort,
      startDate: resolvedRange.startDate!.startOf('day').format('YYYY-MM-DD'),
      endDate: resolvedRange.endDate!.endOf('day').format('YYYY-MM-DD'),
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

  const tableRows = data?.scenarios?.detail ?? []

  useEffect(() => {
    if (!data?.scenarios) return
    const tp = data.scenarios.totalPages
    if (tp > 0 && pagination.page > tp) {
      setPagination((p) => ({ ...p, page: tp }))
    }
  }, [data?.scenarios, pagination.page])

  const handleTypeFilterChange = useCallback((v: string) => {
    setTypeFilter(v as ScenarioWorkbenchStatus)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSort(value as ListSort)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleRowClick = useCallback(
    (params: { row: IScenarioListItem }) => navigate(`/mi/scenario-workbench/scenarios/${params.row.scenarioId}`),
    [navigate],
  )

  const handlePageSizeChange = useCallback((s: number) => {
    setPagination({ size: s, page: 1 })
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }))
  }, [])

  const columns: GridColDef<IScenarioListItem>[] = useMemo(
    () => [
      {
        field: 'status',
        headerName: '생성타입',
        width: 88,
        align: 'center',
        renderCell: (params) => <ClassificationTag {...classificationPropsFromScenarioListRow(params.row)} />,
      },
      {
        field: 'createdAt',
        headerName: '생성/갱신일시',
        width: 130,
        align: 'center',
        renderCell: (params) => formatScenarioTime(params.row),
      },
      {
        field: 'scenarioName',
        headerName: '시나리오명',
        flex: 1,
        minWidth: 360,
        align: 'left',
      },
      /* /// 임시: JKM / TTF / HH 컬럼 숨김
      {
        field: 'jkm',
        headerName: 'JKM',
        width: 100,
        align: 'center',
        renderCell: (params) => <ImpactDotsCell level={findIndexImpact(params.row.indexImpacts, 'JKM')?.marketImpactLevel} />,
      },
      {
        field: 'ttf',
        headerName: 'TTF',
        width: 100,
        align: 'center',
        renderCell: (params) => <ImpactDotsCell level={findIndexImpact(params.row.indexImpacts, 'TTF')?.marketImpactLevel} />,
      },
      {
        field: 'hh',
        headerName: 'HH',
        width: 100,
        align: 'center',
        renderCell: (params) => <ImpactDotsCell level={findIndexImpact(params.row.indexImpacts, 'HH')?.marketImpactLevel} />,
      },
      */
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
              options={WORKBENCH_STATUS_FILTER_OPTIONS}
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
              items={WORKBENCH_LIST_SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
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

        <ScenarioWorkbenchTableHeader<IScenarioListItem> columns={columns} sx={{ mt: 2 }} />
      </WorkbenchStickySlot>

      <ScenarioWorkbenchDataList<IScenarioListItem>
        rowId="scenarioId"
        columns={columns}
        rows={tableRows}
        loading={isLoading}
        skeletonRowCount={pagination.size}
        rowHeight={42}
        noRowMessage="시나리오를 생성해 주세요."
        onRowClick={handleRowClick}
      />

      {data?.scenarios && (
        <MIPaginationSecondary
          data={data.scenarios}
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
