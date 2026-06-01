import { Box, Stack, Typography, useTheme } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { IFundamentalModelPriceChart } from '@/service/mi/fundamentalModel/case'
import type { IScenarioPriceForecast } from '@/service/mi/scenarioWorkbench/scenario'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import ScenarioSummaryChart from '@/pages/mi/scenarioWorkbench/components/common/ScenarioSummaryChart'
import { downloadChart } from '@/utils/chartDownload'

interface FundamentalModelPriceChartSectionProps {
  priceChart: IFundamentalModelPriceChart | null
  priceRegions: string[]
}

const toDateLabel = (point: { year: number; month: number }): string => `${point.year}-${String(point.month).padStart(2, '0')}`

const buildPriceForecast = (priceChart: IFundamentalModelPriceChart | null, selectedPriceRegion: string): IScenarioPriceForecast => {
  const seriesSets = priceChart?.seriesSets ?? []
  const selectedSeriesSet = seriesSets.find((item) => item.priceRegion === selectedPriceRegion) ?? seriesSets[0]
  const selectedSeries = selectedSeriesSet?.series ?? []
  const basePoints = selectedSeries.find((item) => item.points?.length > 0)?.points ?? []

  return {
    currency: 'USD',
    unit: 'mmbtu',
    dates: basePoints.map(toDateLabel),
    series: selectedSeries.map((item) => ({
      indexName: item.label,
      values: item.points?.map((point) => point.value) ?? [],
    })),
  }
}

const toDownloadFilename = (priceRegion: string): string =>
  priceRegion
    ? `monthly-futures-simulation-chart-${priceRegion.toLowerCase().replaceAll(/\s+/g, '-')}.png`
    : 'monthly-futures-simulation-chart.png'

const FundamentalModelPriceChartSection = ({ priceChart, priceRegions }: FundamentalModelPriceChartSectionProps) => {
  const theme = useTheme()
  const chartDownloadTargetRef = useRef<HTMLDivElement>(null)
  const [isDownloadingChart, setIsDownloadingChart] = useState(false)
  const [selectedPriceRegion, setSelectedPriceRegion] = useState(priceRegions[0] ?? '')
  const effectiveSelectedPriceRegion = priceRegions.includes(selectedPriceRegion) ? selectedPriceRegion : (priceRegions[0] ?? '')
  const priceRegionOptions = useMemo(() => priceRegions.map((region) => ({ value: region, label: region })), [priceRegions])
  const priceForecast = useMemo(
    () => buildPriceForecast(priceChart, effectiveSelectedPriceRegion),
    [effectiveSelectedPriceRegion, priceChart],
  )
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
          <ScenarioSummaryChart
            priceForecast={priceForecast}
            emptyMessage="표시할 가격 데이터가 없습니다."
            disableIntroAnimation
            headerEnd={
              priceRegionOptions.length > 0 ? (
                <MISlidingSegmented options={priceRegionOptions} value={effectiveSelectedPriceRegion} onChange={setSelectedPriceRegion} />
              ) : undefined
            }
          />
        </Box>
      </Box>
    </Stack>
  )
}

export default FundamentalModelPriceChartSection
