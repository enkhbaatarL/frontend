import EastIcon from '@mui/icons-material/East'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useMemo } from 'react'

import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import PriceDirectionIcon from '@/pages/mi/scenarioWorkbench/components/common/PriceDirectionIcon'
import ScenarioSummaryChart from '@/pages/mi/scenarioWorkbench/components/common/ScenarioSummaryChart'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { IScenarioIndexOutlook, IScenarioPriceFlowStep, IScenarioSummary } from '@/service/mi/scenarioWorkbench/scenario'

const formatPriceFlowStep = (step: IScenarioPriceFlowStep, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency ? `${currency} ` : ''
  if (step.from === step.to) return `${symbol}${step.from}`
  return `${symbol}${step.from}~${step.to}`
}

const PriceFlowChain = ({ steps, currency }: { steps: IScenarioPriceFlowStep[]; currency: string }) => (
  <Stack direction="row" alignItems="center" gap="4px" justifyContent="center">
    {steps.map((step, i) => (
      <Stack key={i} direction="row" alignItems="center" gap="4px">
        <Box sx={{ bgcolor: 'commonColor.White', borderRadius: '8px', px: '8px', py: '4px' }}>
          <Typography variant="tableHeaderSemibold" color="contentText.Black">
            {formatPriceFlowStep(step, currency)}
          </Typography>
        </Box>
        {i < steps.length - 1 && <EastIcon sx={{ fontSize: 14, color: 'contentText.Normal' }} />}
      </Stack>
    ))}
  </Stack>
)

const buildImpactColumns = (currency: string): GridColDef<IScenarioIndexOutlook>[] => [
  {
    field: 'indexName',
    headerName: '대상',
    flex: 1,
    minWidth: 100,
    sortable: false,
    renderCell: (params: GridRenderCellParams<IScenarioIndexOutlook>) => (
      <Typography variant="body1SB16" color="contentText.Black">
        {params.row.indexName}
      </Typography>
    ),
  },
  {
    field: 'impactLevel',
    headerName: '시장영향',
    width: 90,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IScenarioIndexOutlook>) => <ImpactDotsCell level={params.row.marketImpactLevel} />,
  },
  {
    field: 'direction',
    headerName: '가격방향',
    width: 90,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IScenarioIndexOutlook>) => (
      <Stack alignItems="center" justifyContent="center" width="100%" height="100%">
        <PriceDirectionIcon direction={params.row.direction} />
      </Stack>
    ),
  },
  {
    field: 'priceFlow',
    headerName: '가격 흐름',
    width: 232,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IScenarioIndexOutlook>) => (
      <PriceFlowChain steps={params.row.priceFlow} currency={currency} />
    ),
  },
]

const ImpactTable = ({ rows, currency }: { rows: IScenarioIndexOutlook[]; currency: string }) => {
  const columns = useMemo(() => buildImpactColumns(currency), [currency])
  return (
    <Box sx={{ bgcolor: 'gray.5', borderRadius: '10px', p: '12px' }}>
      <ScenarioWorkbenchTableHeader<IScenarioIndexOutlook> columns={columns} />
      <ScenarioWorkbenchDataList<IScenarioIndexOutlook> rowId="indexName" columns={columns} rows={rows} rowHeight={48} hideLastRowBorder />
    </Box>
  )
}

const ForecastCardItem = ({ outlook }: { outlook: IScenarioIndexOutlook }) => (
  <Box sx={{ bgcolor: 'gray.5', borderRadius: '10px', p: '20px' }}>
    <Stack gap="6px">
      <Typography variant="body1M16" sx={{ color: 'contentText.Black' }}>
        {outlook.trendText}
      </Typography>
    </Stack>
  </Box>
)

interface ScenarioSummarySectionProps {
  summary?: IScenarioSummary
  loading?: boolean
}

const ScenarioSummarySection = ({ summary, loading = false }: ScenarioSummarySectionProps) => {
  const indexOutlooks = summary?.indexOutlooks ?? []
  const priceForecast = summary?.priceForecast ?? { currency: '', unit: '', dates: [], series: [] }

  if (loading) {
    return (
      <Stack
        direction="row"
        gap="38px"
        px="12px"
        py="12px"
        alignItems="flex-start"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'contentBorder.Normal',
        }}
      >
        <Stack flex="1" minWidth={0} gap="12px">
          <Skeleton variant="rounded" height={240} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: '10px' }} />
        </Stack>
        <Box flex="1" minWidth={0}>
          <Skeleton variant="rounded" height={590} sx={{ borderRadius: '10px' }} />
        </Box>
      </Stack>
    )
  }

  return (
    <Stack
      direction="row"
      gap="38px"
      px="12px"
      py="12px"
      alignItems="flex-start"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'contentBorder.Normal',
      }}
    >
      <Stack flex="1" minWidth={0} gap="12px">
        <ImpactTable rows={indexOutlooks} currency={priceForecast.currency} />
        {indexOutlooks.map((outlook) => (
          <ForecastCardItem key={outlook.indexName} outlook={outlook} />
        ))}
      </Stack>

      <Box flex="1" minWidth={0}>
        <ScenarioSummaryChart priceForecast={priceForecast} />
      </Box>
    </Stack>
  )
}

export default ScenarioSummarySection
