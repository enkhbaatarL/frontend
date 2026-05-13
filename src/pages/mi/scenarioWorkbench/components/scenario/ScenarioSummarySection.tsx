import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useState } from 'react'

import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import { PriceDirectionIconWithTooltip } from '@/pages/mi/scenarioWorkbench/components/common/PriceDirectionIcon'
import ScenarioSummaryChart from '@/pages/mi/scenarioWorkbench/components/common/ScenarioSummaryChart'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { probabilityToLikelihoodLabel } from '@/pages/mi/scenarioWorkbench/utils/probabilityFormatting'
import { IScenarioIndexOutlook, IScenarioSummary } from '@/service/mi/scenarioWorkbench/scenario'

const buildImpactColumns: GridColDef<IScenarioIndexOutlook>[] = [
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
        <PriceDirectionIconWithTooltip direction={params.row.direction} />
      </Stack>
    ),
  },
]

const ImpactTable = ({
  rows,
  onRowHoverIndexName,
}: {
  rows: IScenarioIndexOutlook[]
  onRowHoverIndexName?: (indexName: string | null) => void
}) => (
  <Box bgcolor="gray.5" borderRadius="10px" p="12px">
    <ScenarioWorkbenchTableHeader<IScenarioIndexOutlook> columns={buildImpactColumns} />
    <ScenarioWorkbenchDataList<IScenarioIndexOutlook>
      rowId="indexName"
      columns={buildImpactColumns}
      rows={rows}
      rowHeight={48}
      hideLastRowBorder
      onRowMouseEnter={onRowHoverIndexName ? ({ row }) => onRowHoverIndexName(row.indexName) : undefined}
      onRowMouseLeave={onRowHoverIndexName ? () => onRowHoverIndexName(null) : undefined}
    />
  </Box>
)

const ForecastCardItem = ({ outlook }: { outlook: IScenarioIndexOutlook }) => (
  <Box bgcolor="gray.5" borderRadius="10px" p="20px" sx={{ '&:hover': { bgcolor: 'contentBG.Hover' } }}>
    <Stack gap="6px">
      <Typography variant="body1M16" color="contentText.Black">
        {outlook.trendText}
      </Typography>
    </Stack>
  </Box>
)

interface ScenarioSummarySectionProps {
  summary?: IScenarioSummary
  probability?: number
  loading?: boolean
}

const hasForecastCardContent = (outlook: IScenarioIndexOutlook) => Boolean(outlook.trendText?.trim())

const LikelihoodKpiCard = ({ probability }: { probability?: number }) => {
  const hasValue = probability !== undefined && probability !== null && typeof probability === 'number' && Number.isFinite(probability)
  const mainLabel = hasValue ? probabilityToLikelihoodLabel(probability!) : '—'

  return (
    <Box
      bgcolor="gray.5"
      borderRadius="10px"
      p="20px"
      width="200px"
      flexShrink={0}
      alignSelf="stretch"
      boxSizing="border-box"
      sx={{ '&:hover': { bgcolor: 'contentBG.Hover' } }}
    >
      <Stack gap="6px" alignItems="flex-start">
        <Typography variant="body2SB14" color="contentText.Normal">
          발생 가능성
        </Typography>
        <Stack gap="2px" alignItems="flex-start">
          <Typography fontSize="20px" fontWeight={700} lineHeight={1.4} color="contentText.Black">
            {mainLabel}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

const ScenarioSummarySection = ({ summary, probability, loading = false }: ScenarioSummarySectionProps) => {
  const indexOutlooks = summary?.indexOutlooks ?? []
  const outlooksWithForecastCopy = indexOutlooks.filter(hasForecastCardContent)
  const priceForecast = summary?.priceForecast ?? { currency: '', unit: '', dates: [], series: [] }
  const [tableHoverIndexName, setTableHoverIndexName] = useState<string | null>(null)

  if (loading) {
    return (
      <Stack
        direction="row"
        gap="38px"
        px="12px"
        py="12px"
        alignItems="flex-start"
        borderBottom="1px solid"
        borderColor="contentBorder.Normal"
      >
        <Stack flex="1" minWidth={0} gap="12px">
          <Stack direction="row" gap="12px" alignItems="stretch">
            <Skeleton variant="rounded" width={200} height={240} sx={{ borderRadius: '10px', flexShrink: 0 }} />
            <Skeleton variant="rounded" height={240} sx={{ borderRadius: '10px', flex: 1, minWidth: 0 }} />
          </Stack>
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
      borderBottom="1px solid"
      borderColor="contentBorder.Normal"
    >
      <Stack flex="1" minWidth={0} gap="12px">
        <Stack direction="row" gap="12px" alignItems="stretch">
          <LikelihoodKpiCard probability={probability} />
          <Box flex={1} minWidth={0}>
            <ImpactTable rows={indexOutlooks} onRowHoverIndexName={setTableHoverIndexName} />
          </Box>
        </Stack>
        {outlooksWithForecastCopy.map((outlook) => (
          <ForecastCardItem key={outlook.indexName} outlook={outlook} />
        ))}
      </Stack>

      <Box flex="1" minWidth={0}>
        <ScenarioSummaryChart priceForecast={priceForecast} linkedHighlightIndexName={tableHoverIndexName} />
      </Box>
    </Stack>
  )
}

export default ScenarioSummarySection
