import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Box, Stack, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ScenarioWorkbenchTypeBadge from '../components/CreateTypeBadge'
import { buildWorkbenchEventDatePresets } from '../components/event/scenarioWorkbenchEventsDateRange'
import ImpactDotsCell from '../components/ImpactDotsCell'
import ProbabilityGaugeCell from '../components/ProbabilityGaugeCell'

import type { CreateType } from '@/service/mi/scenarioWorkbench'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import { IPaginationResponse } from '@/types/api'
export interface ScenarioRow {
  id: number
  type: CreateType
  /** 'MM-DD HH:mm' 형식 (placeholder '00-00 00:00' 허용) */
  createdAt: string
  name: string
  jkmImpact: number
  ttfImpact: number
  hhImpact: number
  probability: number
  /** 활성 시나리오만 보기 토글용 */
  isActive: boolean
}

// ── 더미 데이터 ───────────────────────────────────────────────────────────────

const DUMMY_SCENARIOS: ScenarioRow[] = [
  {
    id: 1,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 3,
    hhImpact: 2,
    probability: 5,
    isActive: true,
  },
  {
    id: 2,
    type: 'new',
    createdAt: '03-01 05:32',
    name: '걸프 LNG 인프라 타격, 미복구',
    jkmImpact: 3,
    ttfImpact: 2,
    hhImpact: 1,
    probability: 4,
    isActive: true,
  },
  {
    id: 3,
    type: 'new',
    createdAt: '02-28 12:54',
    name: '호르무즈 봉쇄 3개월+ 유지',
    jkmImpact: 3,
    ttfImpact: 3,
    hhImpact: 2,
    probability: 3,
    isActive: true,
  },
  {
    id: 4,
    type: 'updated',
    createdAt: '00-00 00:00',
    name: '시나리오명 4',
    jkmImpact: 1,
    ttfImpact: 1,
    hhImpact: 0,
    probability: 2,
    isActive: true,
  },
  {
    id: 5,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명 5',
    jkmImpact: 2,
    ttfImpact: 1,
    hhImpact: 1,
    probability: 1,
    isActive: false,
  },
  {
    id: 6,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 2,
    hhImpact: 2,
    probability: 4,
    isActive: true,
  },
  {
    id: 7,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 3,
    hhImpact: 3,
    probability: 5,
    isActive: true,
  },
  {
    id: 8,
    type: 'new',
    createdAt: '02-25 09:10',
    name: '사우디 감산 발표',
    jkmImpact: 2,
    ttfImpact: 3,
    hhImpact: 2,
    probability: 4,
    isActive: true,
  },
  {
    id: 9,
    type: 'updated',
    createdAt: '01-15 09:22',
    name: '유럽 가스 수요 급감',
    jkmImpact: 2,
    ttfImpact: 3,
    hhImpact: 1,
    probability: 3,
    isActive: true,
  },
  {
    id: 10,
    type: 'new',
    createdAt: '01-20 14:00',
    name: '중동 지정학적 안정화',
    jkmImpact: 1,
    ttfImpact: 1,
    hhImpact: 0,
    probability: 2,
    isActive: true,
  },
  {
    id: 11,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 3,
    hhImpact: 3,
    probability: 5,
    isActive: true,
  },
  {
    id: 12,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 0,
    ttfImpact: 0,
    hhImpact: 0,
    probability: 1,
    isActive: false,
  },
  {
    id: 13,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 2,
    ttfImpact: 2,
    hhImpact: 2,
    probability: 3,
    isActive: true,
  },
  {
    id: 14,
    type: 'updated',
    createdAt: '02-10 11:30',
    name: '러시아 가스 공급 재개',
    jkmImpact: 2,
    ttfImpact: 3,
    hhImpact: 1,
    probability: 3,
    isActive: true,
  },
  {
    id: 15,
    type: 'new',
    createdAt: '02-14 08:00',
    name: '카타르 LNG 증산 계획',
    jkmImpact: 2,
    ttfImpact: 2,
    hhImpact: 1,
    probability: 4,
    isActive: true,
  },
  {
    id: 16,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 2,
    hhImpact: 2,
    probability: 5,
    isActive: true,
  },
  {
    id: 17,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 1,
    ttfImpact: 1,
    hhImpact: 1,
    probability: 2,
    isActive: true,
  },
  {
    id: 18,
    type: 'updated',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 0,
    ttfImpact: 0,
    hhImpact: 0,
    probability: 1,
    isActive: false,
  },
  {
    id: 19,
    type: 'new',
    createdAt: '03-05 16:45',
    name: '아시아 LNG 수요 급등',
    jkmImpact: 3,
    ttfImpact: 2,
    hhImpact: 2,
    probability: 4,
    isActive: true,
  },
  {
    id: 20,
    type: 'new',
    createdAt: '03-10 07:15',
    name: 'JKM 단기 급락 시나리오',
    jkmImpact: 2,
    ttfImpact: 1,
    hhImpact: 1,
    probability: 2,
    isActive: true,
  },
]

// ── 툴바 옵션 상수 ────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'new', label: '신규' },
  { value: 'updated', label: '갱신' },
] as const

const SORT_OPTIONS = ['최신순', '가격 영향도 높은 순', '발생 가능성 높은 순'] as const

/** 기본 조회 구간: 6개월 (디자인 캡처와 정렬) */
const defaultScenariosDateRange = (): DateRange => {
  const t = dayjs().startOf('day')
  return { startDate: t.subtract(6, 'month'), endDate: t }
}

const ScenariosTabPanel = () => {
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState('최신순')
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultScenariosDateRange())
  const [showActiveOnly, setShowActiveOnly] = useState(true)
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

  const handleToggleActiveOnly = useCallback(() => {
    setShowActiveOnly((prev) => !prev)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const filteredRows = useMemo(() => {
    let rows = DUMMY_SCENARIOS

    if (typeFilter === 'new') {
      rows = rows.filter((r) => r.type === 'new')
    } else if (typeFilter === 'updated') {
      rows = rows.filter((r) => r.type === 'updated')
    }

    if (showActiveOnly) {
      rows = rows.filter((r) => r.isActive)
    }

    const trimmed = committedKeyword.trim().toLowerCase()
    if (trimmed) {
      rows = rows.filter((r) => r.name.toLowerCase().includes(trimmed))
    }

    return rows
  }, [typeFilter, committedKeyword, showActiveOnly])

  const pagedRows = useMemo(
    () => filteredRows.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size),
    [filteredRows, pagination.page, pagination.size],
  )

  const totalElements = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pagination.size))

  const paginationData: IPaginationResponse<ScenarioRow> = {
    totalPages,
    totalElements,
    currentPage: pagination.page,
    numberOfElements: pagedRows.length,
    size: pagination.size,
    isFirst: pagination.page === 1,
    isLast: pagination.page === totalPages,
    hasPrevious: pagination.page > 1,
    hasNext: pagination.page < totalPages,
    detail: pagedRows,
  }

  const handleTypeFilterChange = useCallback((v: string) => {
    setTypeFilter(v)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleSortChange = useCallback((v: string) => {
    setSort(v)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleRowClick = useCallback(
    (params: { row: ScenarioRow }) => navigate(`/mi/scenario-workbench/scenarios/${params.row.id}`),
    [navigate],
  )

  const columns: GridColDef<ScenarioRow>[] = useMemo(
    () => [
      {
        field: 'type',
        headerName: '생성타입',
        width: 88,
        align: 'center',
        renderCell: (params) => (
          <MITableCell>
            <ScenarioWorkbenchTypeBadge type={params.row.type} />
          </MITableCell>
        ),
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
        renderCell: (params) => (
          <MITableCell>
            <ImpactDotsCell level={params.row.jkmImpact} />
          </MITableCell>
        ),
      },
      {
        field: 'ttfImpact',
        headerName: 'TTF',
        width: 100,
        align: 'center',
        renderCell: (params) => (
          <MITableCell>
            <ImpactDotsCell level={params.row.ttfImpact} />
          </MITableCell>
        ),
      },
      {
        field: 'hhImpact',
        headerName: 'HH',
        width: 100,
        align: 'center',
        renderCell: (params) => (
          <MITableCell>
            <ImpactDotsCell level={params.row.hhImpact} />
          </MITableCell>
        ),
      },
      {
        field: 'probability',
        headerName: '가능성',
        width: 120,
        align: 'center',
        renderCell: (params) => (
          <MITableCell>
            <ProbabilityGaugeCell level={params.row.probability} />
          </MITableCell>
        ),
      },
    ],
    [],
  )

  const workbenchEventDatePresets = useMemo(() => buildWorkbenchEventDatePresets(), [])

  const dateRangeMenuLayoutProps = useMemo(
    () => ({
      placement: 'bottom-start' as const,
      paperProps: {
        elevation: 0,
        sx: {
          borderRadius: '10px',
          boxShadow: '0px 0px 2px rgba(0,0,0,0.1)',
          border: '1px solid',
          borderColor: 'contentBorder.Normal',
          overflow: 'hidden',
          mt: 0.5,
        },
      },
      sx: {
        py: 1,
        px: 1.5,
        borderRadius: '10px',
        minHeight: 40,
        '& .MuiButton-root': { minHeight: 40, borderRadius: '10px' },
      },
    }),
    [],
  )

  return (
    <>
      <Stack gap={2} sx={{ px: 3, py: 2 }}>
        <Typography fontSize={26} fontWeight={700} lineHeight={1.4} color="contentText.Black">
          Scenarios
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
            <MISlidingSegmented
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={handleTypeFilterChange}
              sx={{ '& .MuiTypography-root': { whiteSpace: 'nowrap' } }}
            />

            <MIDropdownMenu
              variant="outlined"
              buttonHoverBgColor="gray.20"
              label={
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography variant="body2M14" color="contentText.Black">
                    {sort}
                  </Typography>
                  <KeyboardArrowDownIcon sx={{ fontSize: 20, color: 'contentText.Black' }} />
                </Stack>
              }
              items={SORT_OPTIONS.map((label) => ({ label, action: () => handleSortChange(label) }))}
            />
            <MIDateRangePickerMenu
              dateRange={appliedDateRange}
              onApply={handleDateRangeApply}
              showPreset
              datePresets={workbenchEventDatePresets}
              {...dateRangeMenuLayoutProps}
            />
          </Stack>

          <Stack direction="row" alignItems="center" gap={3} sx={{ flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" paddingY={1} gap={0.5}>
              <Switch size="small" checked={showActiveOnly} onChange={handleToggleActiveOnly} />
              <Typography variant="body2M14" color="contentText.Black">
                활성 시나리오만 보기
              </Typography>
            </Stack>

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

        <Box
          mt={2}
          sx={(theme) => ({
            '& .MuiDataGrid-columnHeaders': {
              marginBottom: theme.spacing(1),
            },
            '& .MuiDataGrid-columnHeader': {
              border: 'none !important',
              borderBottom: `0.5px solid ${theme.palette.gray[60]} !important`,
              backgroundColor: `${theme.palette.commonColor.White} !important`,

              '& .MuiTypography-root': {
                ...theme.typography.body2SB14,
                color: theme.palette.gray[70],
              },
            },
            '& .MuiTypography-tableBody2': {
              ...theme.typography.body1M16,
            },
            '& .MuiDataGrid-row': {
              borderRadius: '10px',
              position: 'relative',
              '&:hover': {
                backgroundColor: theme.palette.gray[10],
              },
              '&.Mui-selected, &.Mui-selected:hover': {
                backgroundColor: `${theme.palette.contentBG.PrimaryFade} !important`,
              },
              '&.Mui-selected::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: '10px',
                border: `1px solid ${theme.palette.contentBorder.Active}`,
                pointerEvents: 'none',
              },
            },
          })}
        >
          <MITable<ScenarioRow>
            rowId="id"
            columns={columns}
            rows={paginationData.detail}
            rowHeight={42}
            noRowMessage="시나리오를 생성해 주세요."
            hideFooter
            onRowClick={handleRowClick}
          />
        </Box>

        <MIPagination<ScenarioRow>
          data={paginationData}
          size={pagination.size}
          sizeList={[10, 20, 50]}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onSizeChange={(size) => setPagination({ size, page: 1 })}
        />
      </Stack>
    </>
  )
}

export default ScenariosTabPanel
