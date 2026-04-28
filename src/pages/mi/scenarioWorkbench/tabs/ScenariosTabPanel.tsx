import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import PersonIcon from '@mui/icons-material/Person'
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt'
import SignalCellularAlt1BarIcon from '@mui/icons-material/SignalCellularAlt1Bar'
import SignalCellularAlt2BarIcon from '@mui/icons-material/SignalCellularAlt2Bar'
import { Box, Stack, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PriceDirection, PriceImpactLevel, ScenarioMethod } from '../components/scenario/types'
import ScenarioWorkbenchNotice from '../components/ScenarioWorkbenchNotice'

import MIChip from '@/components/common/chip/MIChip'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import MITable from '@/components/common/table/MITable'
import { IPaginationResponse } from '@/types/api'

// ── 로컬 셀 컴포넌트 ──────────────────────────────────────────────────────────

interface MethodBadgeProps {
  method: ScenarioMethod
}

const MethodBadge = ({ method }: MethodBadgeProps) => {
  const isAI = method === 'AI'
  return (
    <MIChip
      size="h24"
      color={isAI ? 'purple' : 'gray'}
      type="filled"
      disableHover
      icon={
        isAI ? (
          <AutoAwesomeIcon sx={{ fontSize: '16px !important', color: 'mari.Primary !important' }} />
        ) : (
          <PersonIcon sx={{ fontSize: '16px !important', color: 'contentText.Normal !important' }} />
        )
      }
      label={isAI ? 'AI' : 'User'}
      sx={{
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'contentBorder.Normal',
        backgroundColor: isAI ? 'contentBG.PrimaryFade' : 'gray.10',
        color: isAI ? 'mari.Primary' : 'contentText.Normal',
        fontWeight: 600,
        gap: '2px',
        '& .MuiChip-icon': { margin: 0 },
      }}
    />
  )
}

interface PriceRangeBadgeProps {
  direction: PriceDirection
  range: string
}

const PRICE_DIRECTION_CONFIG: Record<PriceDirection, { bg: string; color: string; symbol: string }> = {
  Up: { bg: '#EAF7EE', color: '#498B47', symbol: '▲' },
  Down: { bg: '#FFEBEB', color: '#E03131', symbol: '▼' },
  Neutral: { bg: '#ECEDF4', color: '#ADB5BD', symbol: '―' },
}

const PriceRangeBadge = ({ direction, range }: PriceRangeBadgeProps) => {
  const config = PRICE_DIRECTION_CONFIG[direction]
  return (
    <MIChip
      size="h24"
      color={direction === 'Up' ? 'green' : direction === 'Down' ? 'red' : 'gray'}
      type="filled"
      disableHover
      label={`${config.symbol} ${range}`}
      sx={{
        borderRadius: '8px',
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 600,
        gap: '2px',
      }}
    />
  )
}

interface PriceImpactCellProps {
  level: PriceImpactLevel
}

const PRICE_IMPACT_CONFIG: Record<Exclude<PriceImpactLevel, '없음'>, { Icon: typeof SignalCellularAltIcon; color: string }> = {
  높음: { Icon: SignalCellularAltIcon, color: '#364FC7' },
  중간: { Icon: SignalCellularAlt2BarIcon, color: '#7384D9' },
  낮음: { Icon: SignalCellularAlt1BarIcon, color: '#A7B2E5' },
}

const PriceImpactCell = ({ level }: PriceImpactCellProps) => {
  if (level === '없음') {
    return <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'gray.50' }}>없음</Typography>
  }
  const { Icon, color } = PRICE_IMPACT_CONFIG[level]
  return (
    <Stack direction="row" alignItems="center" gap="4px">
      <Icon sx={{ fontSize: 20, color }} />
      <Typography sx={{ fontSize: 16, fontWeight: 600, color }}>{level}</Typography>
    </Stack>
  )
}

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface ScenarioRow {
  id: number
  method: ScenarioMethod
  createdAt: string
  name: string
  priceRange: { direction: PriceDirection; range: string } | null
  priceImpact: PriceImpactLevel
  probability: number | null
}

// ── 더미 데이터 ───────────────────────────────────────────────────────────────

const DUMMY_SCENARIOS: ScenarioRow[] = [
  {
    id: 1,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '높음',
    probability: 100,
  },
  {
    id: 2,
    method: 'AI',
    createdAt: '03-01 05:32',
    name: '걸프 LNG 인프라 타격, 미복구',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '높음',
    probability: 32.5,
  },
  {
    id: 3,
    method: 'AI',
    createdAt: '02-28 12:54',
    name: '호르무즈 봉쇄 3개월+ 유지',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '중간',
    probability: null,
  },
  {
    id: 4,
    method: 'User',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Neutral', range: '$3~5' },
    priceImpact: '낮음',
    probability: 11.0,
  },
  {
    id: 5,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '없음',
    probability: 5.4,
  },
  {
    id: 6,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '높음',
    probability: 8.0,
  },
  {
    id: 7,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '높음',
    probability: 45.0,
  },
  {
    id: 8,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '사우디 감산 발표',
    priceRange: { direction: 'Up', range: '$15~25' },
    priceImpact: '높음',
    probability: 78.0,
  },
  {
    id: 9,
    method: 'AI',
    createdAt: '01-15 09:22',
    name: '유럽 가스 수요 급감',
    priceRange: { direction: 'Down', range: '$10~18' },
    priceImpact: '중간',
    probability: 23.0,
  },
  {
    id: 10,
    method: 'User',
    createdAt: '01-20 14:00',
    name: '중동 지정학적 안정화',
    priceRange: { direction: 'Neutral', range: '$8~12' },
    priceImpact: '낮음',
    probability: 15.0,
  },
  {
    id: 11,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '높음',
    probability: 100,
  },
  {
    id: 12,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '높음',
    probability: 100,
  },
  {
    id: 13,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '높음',
    probability: 100,
  },
  {
    id: 14,
    method: 'User',
    createdAt: '02-10 11:30',
    name: '러시아 가스 공급 재개',
    priceRange: { direction: 'Down', range: '$5~15' },
    priceImpact: '중간',
    probability: 42.0,
  },
  {
    id: 15,
    method: 'AI',
    createdAt: '02-14 08:00',
    name: '카타르 LNG 증산 계획',
    priceRange: { direction: 'Down', range: '$12~20' },
    priceImpact: '낮음',
    probability: 55.0,
  },
  {
    id: 16,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '높음',
    probability: 100,
  },
  {
    id: 17,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Up', range: '$20~35' },
    priceImpact: '높음',
    probability: 100,
  },
  {
    id: 18,
    method: 'AI',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    priceRange: { direction: 'Neutral', range: '$8~12' },
    priceImpact: '없음',
    probability: null,
  },
  {
    id: 19,
    method: 'User',
    createdAt: '03-05 16:45',
    name: '아시아 LNG 수요 급등',
    priceRange: { direction: 'Up', range: '$25~40' },
    priceImpact: '높음',
    probability: 67.0,
  },
  {
    id: 20,
    method: 'AI',
    createdAt: '03-10 07:15',
    name: 'JKM 단기 급락 시나리오',
    priceRange: { direction: 'Down', range: '$8~15' },
    priceImpact: '중간',
    probability: 18.0,
  },
]

// ── 툴바 옵션 상수 ────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: 'AI', label: 'AI' },
  { value: '사용자', label: '사용자' },
] as const

const SORT_OPTIONS = ['최신순', '오래된순'] as const

const PERIOD_OPTIONS = ['1개월', '3개월', '6개월', '1년'] as const

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

const ScenariosTabPanel = () => {
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState('전체')
  const [sort, setSort] = useState('최신순')
  const [period, setPeriod] = useState('1개월')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  const filteredRows = useMemo(() => {
    let rows = DUMMY_SCENARIOS

    if (typeFilter === 'AI') rows = rows.filter((r) => r.method === 'AI')
    else if (typeFilter === '사용자') rows = rows.filter((r) => r.method === 'User')

    if (searchQuery) {
      rows = rows.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return rows
  }, [typeFilter, searchQuery])

  const pagedRows = useMemo(() => filteredRows.slice((page - 1) * pageSize, page * pageSize), [filteredRows, page, pageSize])

  const totalElements = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))

  const paginationData: IPaginationResponse<ScenarioRow> = {
    totalPages,
    totalElements,
    currentPage: page,
    numberOfElements: pagedRows.length,
    size: pageSize,
    isFirst: page === 1,
    isLast: page === totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
    detail: pagedRows,
  }

  // ── 이벤트 핸들러 ───────────────────────────────────────────────────────────

  const handleTypeFilterChange = (v: string) => {
    setTypeFilter(v)
    setPage(1)
  }
  const handleSortChange = (label: string) => {
    setSort(label)
    setPage(1)
  }
  const handlePeriodChange = (label: string) => {
    setPeriod(label)
    setPage(1)
  }
  const handleToggleActiveOnly = () => setShowActiveOnly((prev) => !prev)
  const handleSearch = (v: string) => {
    setSearchQuery(v)
    setPage(1)
  }
  const handleSearchClear = () => {
    setSearchInput('')
    setSearchQuery('')
    setPage(1)
  }
  const handlePageSizeChange = (s: number) => {
    setPageSize(s)
    setPage(1)
  }
  const handleRowClick = (_params: { row: ScenarioRow }) => navigate(`/mi/scenario-workbench/scenarios/${_params.row.id}`)

  const columns: GridColDef<ScenarioRow>[] = [
    {
      field: 'method',
      headerName: '생성타입',
      minWidth: 56,
      align: 'center',
      renderCell: (params) => <MethodBadge method={params.value as ScenarioMethod} />,
    },
    {
      field: 'createdAt',
      headerName: '생성/갱신일시',
      minWidth: 136,
      align: 'center',
    },
    {
      field: 'name',
      headerName: '시나리오명',
      flex: 1,
      minWidth: 666,
    },
    {
      field: 'priceRange',
      headerName: 'JKM 가격 전망',
      minWidth: 136,
      align: 'center',
      renderCell: (params) => {
        const value = params.value as ScenarioRow['priceRange']
        if (!value) return null
        return <PriceRangeBadge direction={value.direction} range={value.range} />
      },
    },
    {
      field: 'priceImpact',
      headerName: '가격 영향도',
      minWidth: 136,
      align: 'center',
      renderCell: (params) => <PriceImpactCell level={params.value as PriceImpactLevel} />,
    },
    {
      field: 'probability',
      headerName: '발생 가능성',
      minWidth: 136,
      align: 'center',
      renderCell: (params) => {
        const value = params.value as number | null
        if (value === null || value === undefined) {
          return <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'gray.50' }}>없음</Typography>
        }
        return <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'contentText.Normal' }}>{`${value.toFixed(1)}%`}</Typography>
      },
    },
  ]

  return (
    <>
      <ScenarioWorkbenchNotice noticeKey="scenarios">
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'contentText.Black', lineHeight: 1.4 }}>
          • 직전 상태(어제) 대비 업데이트 내역을 여기에 안내합니다.
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'contentText.Black', lineHeight: 1.4 }}>
          • 신규 시나리오 2건이 생성되었고 5건이 업데이트 되었습니다.
        </Typography>
      </ScenarioWorkbenchNotice>

      <Box pt="20px" width="100%">
        <Typography sx={{ paddingY: '6px', fontSize: 26, fontWeight: 700, color: 'contentText.Black' }}>Scenarios</Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" mt="12px">
          <Stack direction="row" gap="12px" alignItems="center">
            <MISlidingSegmented
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={handleTypeFilterChange}
              sx={{ '& .MuiTypography-root': { whiteSpace: 'nowrap' } }}
            />

            <MIDropdownMenu
              variant="outlined"
              label={
                <Stack direction="row" alignItems="center" gap="4px">
                  <Typography variant="body2M14" color="contentText.Black">
                    {sort}
                  </Typography>
                  <KeyboardArrowDownIcon sx={{ fontSize: 20, color: 'contentText.Black' }} />
                </Stack>
              }
              items={SORT_OPTIONS.map((label) => ({ label, action: () => handleSortChange(label) }))}
            />

            <MIDropdownMenu
              variant="outlined"
              label={
                <Stack direction="row" alignItems="center" gap="4px">
                  <Typography variant="body2M14" color="contentText.Black">
                    {period}
                  </Typography>
                  <KeyboardArrowDownIcon sx={{ fontSize: 20, color: 'contentText.Black' }} />
                </Stack>
              }
              items={PERIOD_OPTIONS.map((label) => ({ label, action: () => handlePeriodChange(label) }))}
            />
          </Stack>

          <Stack direction="row" alignItems="center" gap="12px">
            <Stack direction="row" alignItems="center" gap="8px" sx={{ cursor: 'pointer' }} onClick={handleToggleActiveOnly}>
              <Switch size="small" checked={showActiveOnly} onChange={handleToggleActiveOnly} />
              <Typography variant="body2M14" color="contentText.Black">
                활성 시나리오만 보기
              </Typography>
            </Stack>

            <MISearchInput
              storageKey="scenario-workbench-search"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="시나리오명으로 검색"
              onSearch={handleSearch}
              onClear={handleSearchClear}
              width={246}
            />
          </Stack>
        </Stack>

        <Box
          mt="8px"
          sx={{
            '& .MuiDataGrid-columnHeader': {
              border: 'none !important',
              borderBottom: '0.5px solid #868E96 !important',
              backgroundColor: 'white !important',
              padding: '8px 16px !important',

              '& .MuiTypography-root': {
                fontSize: 14,
                fontWeight: 600,
                color: '#495057',
              },
            },
            '& .MuiDataGrid-cell': {
              padding: '10px 12px !important',
            },
          }}
        >
          <MITable columns={columns} rows={paginationData.detail} rowId="id" rowHeight={42} hideFooter onRowClick={handleRowClick} />
        </Box>

        <MIPagination
          data={paginationData}
          size={pageSize}
          sizeList={[10, 20, 50]}
          onSizeChange={handlePageSizeChange}
          onPageChange={setPage}
        />
      </Box>
    </>
  )
}

export default ScenariosTabPanel
