import { Stack, Typography, useTheme } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { PriceChart, PriceChartPoint, PriceChartSeriesSet } from '@/service/mi/fundamentalModel/case'
import type { ScenarioPriceForecast } from '@/types/dataDetailChart'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import { buildDistinctSeriesColors } from '@/pages/mi/nextGenMI/components/common/nextGenMISeriesColors'
import ScenarioSummaryChart from '@/pages/mi/nextGenMI/components/common/ScenarioSummaryChart'
import { downloadChart } from '@/utils/chartDownload'

interface FundamentalModelPriceChartSectionProps {
  priceChart: PriceChart | null
  priceRegions: string[]
}

type FundamentalModelPriceChartGranularity = 'MONTHLY' | 'YEARLY'

const getPriceChartSeriesSets = (
  priceChart: PriceChart | null,
  granularity: FundamentalModelPriceChartGranularity,
): PriceChartSeriesSet[] => {
  if (granularity === 'YEARLY') return priceChart?.yearlySeriesSets ?? []
  return priceChart?.monthlySeriesSets ?? []
}

const isValidMonth = (month: unknown): month is number => typeof month === 'number' && month >= 1 && month <= 12

const buildDateLabels = (points: PriceChartPoint[], granularity: FundamentalModelPriceChartGranularity): string[] => {
  if (granularity === 'YEARLY') return points.map((point) => String(point.year))

  return points.map((point) => (isValidMonth(point.month) ? `${point.year}-${String(point.month).padStart(2, '0')}` : String(point.year)))
}

const buildPriceForecast = (
  priceChart: PriceChart | null,
  granularity: FundamentalModelPriceChartGranularity,
  selectedPriceRegion: string,
): ScenarioPriceForecast => {
  const seriesSets = getPriceChartSeriesSets(priceChart, granularity)
  const selectedSeriesSet = seriesSets.find((item) => item.priceRegion === selectedPriceRegion) ?? seriesSets[0]
  const selectedSeries = selectedSeriesSet?.series ?? []
  const basePoints = selectedSeries.find((item) => item.points?.length > 0)?.points ?? []

  return {
    currency: 'USD',
    unit: 'mmbtu',
    dates: buildDateLabels(basePoints, granularity),
    series: selectedSeries.map((item) => ({
      indexName: item.label,
      values: item.points.map((point) => point.value),
    })),
  }
}

const toDownloadFilename = (granularity: FundamentalModelPriceChartGranularity, priceRegion: string): string =>
  priceRegion
    ? `${granularity.toLowerCase()}-futures-simulation-chart-${priceRegion.toLowerCase().replaceAll(/\s+/g, '-')}.png`
    : `${granularity.toLowerCase()}-futures-simulation-chart.png`

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

  if (currency && unit) return `Unit: ${currency}/${unit}`
  if (currency) return `Unit: ${currency}`
  if (unit) return `Unit: ${unit}`

  return 'Unit: -'
}

const FundamentalModelPriceChartSection = ({ priceChart, priceRegions }: FundamentalModelPriceChartSectionProps) => {
  const theme = useTheme()
  const chartDownloadTargetRef = useRef<HTMLDivElement>(null)
  const [isDownloadingChart, setIsDownloadingChart] = useState(false)
  const [selectedGranularity, setSelectedGranularity] = useState<FundamentalModelPriceChartGranularity>('MONTHLY')
  const [selectedPriceRegion, setSelectedPriceRegion] = useState(priceRegions[0] ?? '')
  const selectedSeriesSets = useMemo(() => getPriceChartSeriesSets(priceChart, selectedGranularity), [priceChart, selectedGranularity])
  const activePriceRegions = useMemo(() => {
    const chartRegions = Array.from(new Set(selectedSeriesSets.map((seriesSet) => seriesSet.priceRegion).filter(Boolean)))
    return chartRegions.length > 0 ? chartRegions : priceRegions
  }, [priceRegions, selectedSeriesSets])
  const effectiveSelectedPriceRegion = activePriceRegions.includes(selectedPriceRegion)
    ? selectedPriceRegion
    : (activePriceRegions[0] ?? '')
  const priceRegionOptions = useMemo(() => activePriceRegions.map((region) => ({ value: region, label: region })), [activePriceRegions])
  const priceForecast = useMemo(
    () => buildPriceForecast(priceChart, selectedGranularity, effectiveSelectedPriceRegion),
    [effectiveSelectedPriceRegion, priceChart, selectedGranularity],
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
        filename: toDownloadFilename(selectedGranularity, effectiveSelectedPriceRegion),
        target,
        remove: ['#scenario-summary-indicator-container', '#main-indicator-container', '#fundamental-model-price-chart-download-button'],
        padding: 12,
        captureScale: 2,
      })
    } finally {
      setIsDownloadingChart(false)
    }
  }, [effectiveSelectedPriceRegion, hasChartData, isDownloadingChart, selectedGranularity])

  return (
    <Stack gap="12px">
      <Typography fontWeight="600" fontSize="18px" color="gray.90">
        {selectedGranularity === 'YEARLY' ? 'Yearly' : 'Monthly'} Futures Simulation Chart
      </Typography>

      <Stack width="100%" minWidth={0}>
        <Stack ref={chartDownloadTargetRef} width="100%" minWidth={0} bgcolor="commonColor.White">
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
            crosshairDateFormat={selectedGranularity === 'YEARLY' ? 'YYYY' : 'YYYY-MM'}
            xAxisLabelFormat={selectedGranularity === 'YEARLY' ? 'YYYY' : 'YYYY-MM'}
            currentMarkerGranularity={selectedGranularity === 'YEARLY' ? 'YEAR' : 'MONTH'}
            headerEnd={
              <Stack direction="row" alignItems="center" justifyContent="flex-end" gap="8px" flexWrap="wrap" maxWidth="100%">
                {priceRegionOptions.length > 0 && (
                  <MISlidingSegmented
                    options={priceRegionOptions}
                    value={effectiveSelectedPriceRegion}
                    onChange={setSelectedPriceRegion}
                    height="36px"
                  />
                )}
                <MISelectMenu<FundamentalModelPriceChartGranularity>
                  variant="text"
                  selectionIconPosition="left"
                  selected={selectedGranularity}
                  onSelected={setSelectedGranularity}
                  items={[
                    { value: 'MONTHLY', label: 'Monthly' },
                    { value: 'YEARLY', label: 'Yearly' },
                  ]}
                  enableHoverBackground
                  sx={{
                    height: '36px',
                    minWidth: '100px',
                    backgroundColor: 'gray.10',
                    color: 'contentText.Normal',
                  }}
                />
                <MIBaseButton
                  id="fundamental-model-price-chart-download-button"
                  variant="text"
                  aria-label="Download chart"
                  onClick={handleDownloadChart}
                  isLoading={isDownloadingChart}
                  disabled={!hasChartData}
                  enableHoverBackground
                  sx={{
                    height: '36px',
                    width: '36px',
                    minWidth: '36px',
                    padding: '8px',
                    backgroundColor: 'gray.10',
                    flexShrink: 0,
                  }}
                >
                  <ChartDownloadIcon fill={hasChartData ? theme.palette.contentIcon.Enabled : theme.palette.contentIcon.Disabled} />
                </MIBaseButton>
              </Stack>
            }
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default FundamentalModelPriceChartSection
