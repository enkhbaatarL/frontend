import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useState } from 'react'

import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import { PriceDirectionIconWithTooltip } from '@/pages/mi/scenarioWorkbench/components/common/PriceDirectionIcon'
import ScenarioSummaryChart from '@/pages/mi/scenarioWorkbench/components/common/ScenarioSummaryChart'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
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
  <Box sx={{ bgcolor: 'gray.5', borderRadius: '10px', p: '12px' }}>
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
  <Box
    sx={{
      bgcolor: 'gray.5',
      borderRadius: '10px',
      p: '20px',
      '&:hover': { bgcolor: 'contentBG.Hover' },
    }}
  >
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
  const [tableHoverIndexName, setTableHoverIndexName] = useState<string | null>(null)

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
        <ImpactTable rows={indexOutlooks} onRowHoverIndexName={setTableHoverIndexName} />
        {indexOutlooks.map((outlook) => (
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
