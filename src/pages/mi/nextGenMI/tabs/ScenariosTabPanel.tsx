import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
// import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
// import ClassificationTag from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
// import ImpactDotsCell from '@/pages/mi/nextGenMI/components/common/ImpactDotsCell'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { buildNextGenMIDatePresets, defaultNextGenMIDateRange } from '@/pages/mi/nextGenMI/components/common/nextGenMIDateRange'
import ProbabilityGaugeCell from '@/pages/mi/nextGenMI/components/common/ProbabilityGaugeCell'
import {
  // findIndexImpact,
  formatNextGenMIDateTime,
  NEXT_GEN_MI_LIST_SORT_OPTIONS,
  // NEXT_GEN_MI_STATUS_FILTER_OPTIONS,
} from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
// import { classificationPropsFromScenarioListRow } from '@/pages/mi/nextGenMI/components/common/nextGenMIClassificationChip'
import { NextGenMIStickySlot } from '@/pages/mi/nextGenMI/nextGenMIStickyLayout'
import { ListSort, NextGenMIStatus } from '@/service/mi/nextGenMI/common'
import nextGenMIScenarioService, { type IGetScenariosParams, type IScenarioListItem } from '@/service/mi/nextGenMI/scenario'

const formatScenarioTime = (item: IScenarioListItem) => {
  const dateIso = item.status === NextGenMIStatus.UPDATED ? item.updatedAt : item.createdAt
  return formatNextGenMIDateTime(dateIso)
}

const ScenariosTabPanel = () => {
  const navigate = useNavigate()

  const [typeFilter] = useState<NextGenMIStatus>(NextGenMIStatus.ALL)
  const [sort, setSort] = useState<ListSort>(ListSort.LATEST)
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultNextGenMIDateRange())
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
    const resolvedRange = appliedDateRange.startDate && appliedDateRange.endDate ? appliedDateRange : defaultNextGenMIDateRange()

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
    queryKey: ['nextGenMIScenarios', listRequest],
    queryFn: () => nextGenMIScenarioService.getScenarios(listRequest),
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

  // const handleTypeFilterChange = useCallback((v: string) => {
  //   setTypeFilter(v as NextGenMIStatus)
  //   setPagination((p) => ({ ...p, page: 1 }))
  // }, [])

  const handleSortChange = useCallback((value: string) => {
    setSort(value as ListSort)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleRowClick = useCallback(
    (params: { row: IScenarioListItem }) => navigate(`/mi/next-gen-mi/scenarios/${params.row.scenarioId}`),
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
      /* /// 임시: 생성타입 컬럼 숨김
      {
        field: 'status',
        headerName: '생성타입',
        width: 88,
        align: 'center',
        renderCell: (params) => <ClassificationTag {...classificationPropsFromScenarioListRow(params.row)} />,
      },
      */
      {
        field: 'createdAt',
        headerName: '생성일시', // 생성/갱신일시
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

  const nextGenMIDatePresets = useMemo(() => buildNextGenMIDatePresets(), [])

  return (
    <Box width="100%">
      <NextGenMIStickySlot tabKey="scenarios">
        <Typography fontSize={26} fontWeight={700} lineHeight={1.4} padding="18px 24px" color="contentText.Black">
          Scenario Group List
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} paddingX="24px">
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap="12px" minWidth={0} flex={1}>
            {/* 임시: 상태 필터 세그먼트 숨김
            <MISlidingSegmented
              options={NEXT_GEN_MI_STATUS_FILTER_OPTIONS}
              value={typeFilter}
              onChange={handleTypeFilterChange}
              sx={{ '& .MuiTypography-root': { whiteSpace: 'nowrap' } }}
            />
            */}

            <MIDateRangePickerMenu
              dateRange={appliedDateRange}
              onApply={handleDateRangeApply}
              showPreset
              datePresets={nextGenMIDatePresets}
              closeOnScroll
              sx={{
                height: '36px',
                minHeight: '36px',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
            />

            <MISelectMenu
              variant="outlined"
              buttonHoverBgColor="gray.20"
              selected={sort}
              onSelected={(value: string) => handleSortChange(value)}
              items={NEXT_GEN_MI_LIST_SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
              closeOnScroll
              sx={{
                height: '36px',
                minHeight: '36px',
                borderRadius: '10px',
              }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" gap={3} flexShrink={0}>
            <MISearchInput
              storageKey="next-gen-mi-scenarios"
              value={keyword}
              onChange={handleSearchChange}
              placeholder="시나리오명으로 검색"
              onSearch={handleSearch}
              onClear={handleSearchClear}
              width="246px"
              height="36px"
            />
          </Stack>
        </Stack>

        <Box mt={2}>
          <MIDataTableHeader<IScenarioListItem> columns={columns} />
        </Box>
      </NextGenMIStickySlot>

      <MIDataTableBody<IScenarioListItem>
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
