import { Box, Stack, Typography, useTheme } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FundamentalModelMonthlyPriceRow } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type { IScenarioPriceForecast } from '@/service/mi/scenarioWorkbench/scenario'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import ScenarioSummaryChart from '@/pages/mi/scenarioWorkbench/components/common/ScenarioSummaryChart'
import { downloadChart } from '@/utils/chartDownload'

interface FundamentalModelPriceChartSectionProps {
  monthlyPriceRows: FundamentalModelMonthlyPriceRow[]
}

const PRICE_SERIES_DEFINITIONS = [
  { key: 'baseCasePrice', label: 'Base case price' },
  { key: 'userAdjustedPrice', label: 'User adjusted price' },
] satisfies { key: 'baseCasePrice' | 'userAdjustedPrice'; label: string }[]

const DEFAULT_PRICE_REGION = 'East Asia Spot'
const PRICE_REGION_ORDER = [DEFAULT_PRICE_REGION, 'TTF', 'HH']

const toMonthKey = (row: FundamentalModelMonthlyPriceRow): string => `${row.year}-${row.month.padStart(2, '0')}`

const parsePriceValue = (value: string): number => {
  const parsed = Number(value.replaceAll(',', '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

const getPriceRegions = (monthlyPriceRows: FundamentalModelMonthlyPriceRow[]): string[] => {
  const existingRegions = new Set(monthlyPriceRows.map((row) => row.priceRegion))
  const orderedRegions = PRICE_REGION_ORDER.filter((region) => existingRegions.has(region))
  const remainingRegions = Array.from(existingRegions)
    .filter((region) => !PRICE_REGION_ORDER.includes(region))
    .sort()
  return [...orderedRegions, ...remainingRegions]
}

const buildChartUnitLabel = (priceForecast: IScenarioPriceForecast): string => {
  if (priceForecast.currency && priceForecast.unit) return `Unit: ${priceForecast.currency}/${priceForecast.unit}`
  if (priceForecast.currency) return `Unit: ${priceForecast.currency}`
  if (priceForecast.unit) return `Unit: ${priceForecast.unit}`
  return 'Unit: -'
}

const buildMonthlyPriceForecast = (
  monthlyPriceRows: FundamentalModelMonthlyPriceRow[],
  selectedPriceRegion: string,
): IScenarioPriceForecast => {
  const selectedRows = monthlyPriceRows.filter((row) => row.priceRegion === selectedPriceRegion)
  const monthKeys = Array.from(new Set(monthlyPriceRows.map(toMonthKey))).sort()
  const rowByMonth = new Map(selectedRows.map((row) => [toMonthKey(row), row]))

  return {
    currency: 'USD',
    unit: 'mmbtu',
    dates: monthKeys,
    series: PRICE_SERIES_DEFINITIONS.map(({ key, label }) => ({
      indexName: label,
      values: monthKeys.map((monthKey) => parsePriceValue(rowByMonth.get(monthKey)?.[key] ?? '0')),
    })),
  }
}

const toDownloadFilename = (priceRegion: string): string =>
  `monthly-futures-simulation-chart-${priceRegion.toLowerCase().replaceAll(/\s+/g, '-')}.png`

const FundamentalModelPriceChartSection = ({ monthlyPriceRows }: FundamentalModelPriceChartSectionProps) => {
  const theme = useTheme()
  const chartDownloadTargetRef = useRef<HTMLDivElement>(null)
  const priceRegions = useMemo(() => getPriceRegions(monthlyPriceRows), [monthlyPriceRows])
  const priceRegionOptions = useMemo(() => priceRegions.map((region) => ({ value: region, label: region })), [priceRegions])
  const [selectedPriceRegion, setSelectedPriceRegion] = useState(DEFAULT_PRICE_REGION)
  const [isDownloadingChart, setIsDownloadingChart] = useState(false)
  const effectiveSelectedPriceRegion = priceRegions.includes(selectedPriceRegion)
    ? selectedPriceRegion
    : (priceRegions[0] ?? DEFAULT_PRICE_REGION)
  const priceForecast = useMemo(
    () => buildMonthlyPriceForecast(monthlyPriceRows, effectiveSelectedPriceRegion),
    [effectiveSelectedPriceRegion, monthlyPriceRows],
  )
  const chartUnit = useMemo(() => buildChartUnitLabel(priceForecast), [priceForecast])
  const hasChartData = priceForecast.series.some((series) => series.values.length > 0)

  useEffect(() => {
    if (selectedPriceRegion === effectiveSelectedPriceRegion) return
    setSelectedPriceRegion(effectiveSelectedPriceRegion)
  }, [effectiveSelectedPriceRegion, selectedPriceRegion])

  const handleDownloadChart = useCallback(async () => {
    const target = chartDownloadTargetRef.current
    if (!target || !hasChartData || isDownloadingChart) return

    setIsDownloadingChart(true)
    try {
      await downloadChart({
        filename: toDownloadFilename(effectiveSelectedPriceRegion),
        target,
        remove: ['#scenario-summary-indicator-container', '#main-indicator-container'],
        padding: 12,
        captureScale: 2,
      })
    } finally {
      setIsDownloadingChart(false)
    }
  }, [effectiveSelectedPriceRegion, hasChartData, isDownloadingChart])

  return (
    <Stack gap="8px">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="body2SB14" color="gray.90">
          Monthly Futures Simulation Chart
        </Typography>
        <MIBaseButton
          variant="outlined"
          aria-label="Download chart"
          onClick={handleDownloadChart}
          isLoading={isDownloadingChart}
          disabled={!hasChartData}
          sx={{
            height: '28px',
            minWidth: '0px',
            p: '4px',
            borderRadius: '4px',
          }}
        >
          <ChartDownloadIcon fill={theme.palette.contentIcon.Enabled} />
        </MIBaseButton>
      </Stack>

      <Box sx={{ width: '100%', minWidth: 0, pt: '12px' }}>
        <Box ref={chartDownloadTargetRef} sx={{ width: '100%', minWidth: 0, bgcolor: 'commonColor.White' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" minWidth={0} gap={1}>
            <Typography variant="body2SB14" color="contentText.Normal" sx={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
              {chartUnit}
            </Typography>
            {priceRegionOptions.length > 0 && (
              <MISlidingSegmented options={priceRegionOptions} value={effectiveSelectedPriceRegion} onChange={setSelectedPriceRegion} />
            )}
          </Stack>

          <Box sx={{ width: '100%', minWidth: 0 }}>
            <ScenarioSummaryChart priceForecast={priceForecast} suppressChartHeader emptyMessage="표시할 가격 데이터가 없습니다." />
          </Box>
        </Box>
      </Box>
    </Stack>
  )
}

export default FundamentalModelPriceChartSection
