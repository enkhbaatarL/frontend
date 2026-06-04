import { Box, Stack, Typography } from '@mui/material'
import { memo, type ReactNode, useMemo } from 'react'

import type { FundamentalModelPrice } from '@/service/mi/fundamentalModel/case'

import FundamentalModelPriceChartSection from '@/pages/mi/fundamentalModel/components/price/FundamentalModelPriceChartSection'
import FundamentalModelPriceTable from '@/pages/mi/fundamentalModel/components/price/FundamentalModelPriceTable'
import { buildPricePeriodTableColumns, buildPricePeriodTableRows } from '@/pages/mi/fundamentalModel/components/price/priceTabPanelColumns'

export interface PriceTabPanelProps {
  price: FundamentalModelPrice | null
  loading: boolean
}

interface PriceTableSectionProps {
  title: string
  children: ReactNode
  sx?: object
}

const PriceTableSection = ({ title, children, sx }: PriceTableSectionProps) => (
  <Stack gap="8px" sx={{ minWidth: 0, ...sx }}>
    <Typography variant="body2SB14" color="gray.90" textAlign="center">
      {title}
    </Typography>
    {children}
  </Stack>
)

const PriceTabPanel = memo(({ price, loading }: PriceTabPanelProps) => {
  const annualColumns = useMemo(() => buildPricePeriodTableColumns(price?.annualTable, false), [price?.annualTable])
  const annualRows = useMemo(() => buildPricePeriodTableRows(price?.annualTable, false), [price?.annualTable])
  const monthlyColumns = useMemo(() => buildPricePeriodTableColumns(price?.monthlyTable, true), [price?.monthlyTable])
  const monthlyRows = useMemo(() => buildPricePeriodTableRows(price?.monthlyTable, true), [price?.monthlyTable])
  const priceRegions = useMemo(() => {
    const chartRegions = price?.chart?.seriesSets?.map((seriesSet) => seriesSet.priceRegion).filter(Boolean) ?? []
    if (chartRegions.length > 0) return chartRegions

    return Array.from(new Set(price?.monthlyTable?.rows?.map((row) => row.priceRegion).filter(Boolean) ?? []))
  }, [price?.chart?.seriesSets, price?.monthlyTable?.rows])

  return (
    <Stack gap="20px" sx={{ userSelect: 'text' }}>
      <FundamentalModelPriceChartSection priceChart={price?.chart ?? null} priceRegions={priceRegions} />

      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="flex-start" gap="20px" sx={{ minWidth: 0 }}>
        <Box sx={{ flex: { md: '0 0 462px' }, width: { xs: '100%', md: '462px' }, maxWidth: '100%' }}>
          <PriceTableSection title="Annual price output (USD/mmbtu, Real 2023)">
            <FundamentalModelPriceTable columns={annualColumns} rows={annualRows} loading={loading} />
          </PriceTableSection>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <PriceTableSection title="Monthly price output (USD/mmbtu, Real 2023)">
            <FundamentalModelPriceTable columns={monthlyColumns} rows={monthlyRows} loading={loading} />
          </PriceTableSection>
        </Box>
      </Stack>
    </Stack>
  )
})

PriceTabPanel.displayName = 'PriceTabPanel'

export default PriceTabPanel
