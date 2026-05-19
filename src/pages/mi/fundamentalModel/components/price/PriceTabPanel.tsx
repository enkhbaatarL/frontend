import { Box, Stack, Typography } from '@mui/material'

import type { FundamentalModelAnnualPriceRow, FundamentalModelMonthlyPriceRow } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type { ReactNode } from 'react'

import FundamentalModelPriceChartSection from '@/pages/mi/fundamentalModel/components/price/FundamentalModelPriceChartSection'
import FundamentalModelPriceTable from '@/pages/mi/fundamentalModel/components/price/FundamentalModelPriceTable'
import {
  ANNUAL_PRICE_TABLE_COLUMNS,
  MONTHLY_PRICE_HIGHLIGHTED_FIELDS,
  MONTHLY_PRICE_TABLE_COLUMNS,
} from '@/pages/mi/fundamentalModel/components/price/priceTabPanelColumns'

export interface PriceTabPanelProps {
  annualPriceRows: FundamentalModelAnnualPriceRow[]
  monthlyPriceRows: FundamentalModelMonthlyPriceRow[]
  detailLoading: boolean
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

const PriceTabPanel = ({ annualPriceRows, monthlyPriceRows, detailLoading }: PriceTabPanelProps) => (
  <Stack gap="20px" sx={{ userSelect: 'text' }}>
    <FundamentalModelPriceChartSection />

    <Stack direction={{ xs: 'column', md: 'row' }} alignItems="flex-start" gap="20px" sx={{ minWidth: 0 }}>
      <Box sx={{ flex: { md: '0 0 462px' }, width: { xs: '100%', md: '462px' }, maxWidth: '100%' }}>
        <PriceTableSection title="Annual price output (USD/mmbtu, Real 2023)">
          <FundamentalModelPriceTable columns={ANNUAL_PRICE_TABLE_COLUMNS} rows={annualPriceRows} loading={detailLoading} />
        </PriceTableSection>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <PriceTableSection title="Monthly price output (USD/mmbtu, Real 2023)">
          <FundamentalModelPriceTable
            columns={MONTHLY_PRICE_TABLE_COLUMNS}
            rows={monthlyPriceRows}
            loading={detailLoading}
            getCellSx={({ field }) => (MONTHLY_PRICE_HIGHLIGHTED_FIELDS.has(field) ? { bgcolor: 'commonColor.Primarylight1' } : undefined)}
          />
        </PriceTableSection>
      </Box>
    </Stack>
  </Stack>
)

export default PriceTabPanel
