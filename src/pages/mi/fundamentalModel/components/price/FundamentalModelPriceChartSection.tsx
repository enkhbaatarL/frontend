import { Box, Stack, Typography, useTheme } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FundamentalModelPriceChart } from '@/service/mi/fundamentalModel/case'
import type { ScenarioPriceForecast } from '@/types/dataDetailChart'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import { buildDistinctSeriesColors } from '@/pages/mi/nextGenMI/components/common/nextGenMISeriesColors'
import ScenarioSummaryChart from '@/pages/mi/nextGenMI/components/common/ScenarioSummaryChart'
import { downloadChart } from '@/utils/chartDownload'

interface FundamentalModelPriceChartSectionProps {
  priceChart: FundamentalModelPriceChart | null
  priceRegions: string[]
}

const toDateLabel = (point: { year: number; month: number }): string => `${point.year}-${String(point.month).padStart(2, '0')}`

const buildPriceForecast = (priceChart: FundamentalModelPriceChart | null, selectedPriceRegion: string): ScenarioPriceForecast => {
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

const PRICE_CHART_SERIES_COLORS = ['#185FA5', '#A32D2D', '#0F8A72', '#E09A3A', '#C4407A', '#2B8EA6', '#7B52B8', '#B8960C']

const resolvePriceSeriesColor = (label: string, fallback: string): string => {
  const normalized = label.trim().toLowerCase()

  if (normalized.includes('base case')) return '#185FA5'
  if (normalized.includes('user adjusted')) return '#A32D2D'

  return fallback
}

const formatPriceChartUnit = (priceForecast: ScenarioPriceForecast): string => {
  const currency = priceForecast.currency?.trim()
  const rawUnit = priceForecast.unit?.trim()
  const unit = rawUnit && rawUnit.toLowerCase() === 'mmbtu' ? 'MMBtu' : rawUnit

  if (currency && unit) return `Unit : ${currency}/${unit}`
  if (currency) return `Unit : ${currency}`
  if (unit) return `Unit : ${unit}`

  return 'Unit : -'
}

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
  const priceChartColorMap = useMemo(() => {
    const fallbackColors = buildDistinctSeriesColors(PRICE_CHART_SERIES_COLORS, priceForecast.series.length)
    const colorMap = new Map<string, string>()

    priceForecast.series.forEach((series, index) => {
      colorMap.set(series.indexName, resolvePriceSeriesColor(series.indexName, fallbackColors[index] ?? PRICE_CHART_SERIES_COLORS[0]))
    })

    return colorMap
  }, [priceForecast.series])
  const chartUnit = useMemo(() => formatPriceChartUnit(priceForecast), [priceForecast])
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
        remove: ['#scenario-summary-indicator-container', '#main-indicator-container', '#fundamental-model-price-chart-download-button'],
        padding: 12,
        captureScale: 2,
      })
    } finally {
      setIsDownloadingChart(false)
    }
  }, [effectiveSelectedPriceRegion, hasChartData, isDownloadingChart])

  return (
    <Stack gap="12px">
      <Typography fontWeight="600" fontSize="18px" color="gray.90">
        Monthly Futures Simulation Chart
      </Typography>

      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Box ref={chartDownloadTargetRef} sx={{ width: '100%', minWidth: 0, bgcolor: 'commonColor.White' }}>
          <ScenarioSummaryChart
            priceForecast={priceForecast}
            emptyMessage="표시할 가격 데이터가 없습니다."
            disableIntroAnimation
            hideLegend
            chartColorMap={priceChartColorMap}
            showHeaderLegend
            headerLegendLabelColor="gray.70"
            headerStart={
              <Typography variant="body3SB12" color="contentText.Subtext" noWrap sx={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
                {chartUnit}
              </Typography>
            }
            headerEnd={
              <Stack direction="row" alignItems="center" justifyContent="flex-end" gap="8px" flexWrap="wrap" maxWidth="100%">
                {priceRegionOptions.length > 0 && (
                  <MISlidingSegmented
                    options={priceRegionOptions}
                    value={effectiveSelectedPriceRegion}
                    onChange={setSelectedPriceRegion}
                    sx={{
                      height: '36px',
                    }}
                  />
                )}
                <MIBaseButton
                  id="fundamental-model-price-chart-download-button"
                  variant="outlined"
                  aria-label="Download chart"
                  onClick={handleDownloadChart}
                  isLoading={isDownloadingChart}
                  disabled={!hasChartData}
                  sx={{
                    height: '36px',
                    minWidth: '0px',
                    p: '8px',
                    flexShrink: 0,
                  }}
                >
                  <ChartDownloadIcon fill={theme.palette.contentIcon.Enabled} />
                </MIBaseButton>
              </Stack>
            }
          />
        </Box>
      </Box>
    </Stack>
  )
}

export default FundamentalModelPriceChartSection
