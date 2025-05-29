import { Box, Typography } from '@mui/material'
import { useState } from 'react'

import smImg from '@/assets/product_symbol_hover.png'
import MIButtonSelect from '@/components/common/chart/MIChartButtonSelect'
import MIColorRange from '@/components/common/colorrange/MIColorRange'
import MISignalMap from '@/components/common/signal-map/MISignalMap'
import MISkeleton from '@/components/mi/MISkeleton.tsx'

interface SectionHeaderProps {
  title: string
  itemCount: string
  subCategories?: string
  boldTitle?: boolean
}

const SectionHeader = ({ title, itemCount, subCategories, boldTitle = false }: SectionHeaderProps) => (
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="end"
    paddingBottom="6px"
    borderBottom="1px solid"
    borderColor={boldTitle ? 'coolGray.70' : 'gray.30'}
  >
    <Typography color="gray.90" variant={boldTitle ? 'heading3' : 'heading4'}>
      {title}
    </Typography>
    <Box display="flex" alignItems="center">
      <Typography color="gray.70" variant={boldTitle ? 'subtext3' : 'subtext4'}>
        {itemCount} Items
      </Typography>
      {subCategories && (
        <>
          <img width={2} height={2} style={{ marginLeft: '6px', marginRight: '6px' }} src={smImg} alt="" />
          <Typography color="gray.70" variant={boldTitle ? 'subtext3' : 'subtext4'}>
            {subCategories} Sub-categories
          </Typography>
        </>
      )}
    </Box>
  </Box>
)

const SignalMapPage = () => {
  const [fakeLoading, setFakeLoading] = useState<boolean>(true)

  setTimeout(() => setFakeLoading(false), 1000)

  return (
    <MISkeleton variant={'signalMap'} loading={fakeLoading}>
      <Box paddingX={7.5} paddingTop="50px" paddingBottom="40px" textAlign="center">
        <Typography color="gray.90" variant="heading0">
          Henry Hub Market Landscape Map
        </Typography>
        <br />
        <Typography color="#495057" variant="subtext0">
          Visual Correlation of Market Signals by Sector
        </Typography>
      </Box>
      <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin="auto">
        <Box
          paddingTop="24px"
          paddingBottom="20px"
          borderTop="1px solid"
          borderColor="gray.30"
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'start',
            gap: '14px',
          }}
        >
          <Box display={'flex'} gap="14px">
            <MIButtonSelect
              minWidthMenu="160px"
              styleInput
              options={[
                { label: '6개월', value: '6개월' },
                { label: '1년', value: '1년' },
                { label: 'Option 3', value: 'Option 3' },
              ]}
            ></MIButtonSelect>

            <MIButtonSelect
              minWidthMenu="160px"
              styleInput
              options={[
                { label: 'Server', value: 'Server' },
                { label: 'PC', value: 'PC' },
                { label: 'Mobile', value: 'Mobile' },
                { label: 'Auto', value: 'Auto' },
              ]}
            ></MIButtonSelect>
          </Box>
          <MIColorRange />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}
        >
          <Box>
            <Box mb={5}>
              <SectionHeader title="Market Drivers" itemCount="71" boldTitle />
            </Box>
            <Box mb={6}>
              <SectionHeader title="Financial Markets" itemCount="29" />
              <Box height="460px" marginTop="6px">
                <MISignalMap
                  data={Array.from({ length: Math.floor(Math.random() * 50) + 1 }, () => ({
                    sector: `${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    change: Number((Math.random() * 2 - 1).toFixed(2)),
                  }))}
                  useAnimation
                />
              </Box>
            </Box>
            <Box mb={6}>
              <SectionHeader title="External Factors" itemCount="43" subCategories="3" />
              <Box height="460px" marginTop="6px">
                <MISignalMap
                  data={Array.from({ length: 41 }, (_, i) => ({
                    sector: `SECTOR_${i + 1}`,
                    change: Number((1 - i * 0.05).toFixed(2)),
                  }))}
                  useAnimation
                />
              </Box>
            </Box>
          </Box>
          <Box>
            <Box mb={5}>
              <SectionHeader title="Market Fundamentals" itemCount="50" boldTitle />
            </Box>
            <Box mb={6}>
              <SectionHeader title="Supply-side Factors" itemCount="29" subCategories="2" />
              <Box height="460px" marginTop="6px">
                <MISignalMap
                  data={Array.from({ length: Math.floor(Math.random() * 10) + 30 }, () => ({
                    sector: `${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    change: Number((Math.random() * 2 - 1).toFixed(2)),
                  }))}
                  thresholdLevels={14}
                  useAnimation
                />
              </Box>
            </Box>
            <Box mb={6}>
              <SectionHeader title="Demand-side Factors" itemCount="30" subCategories="2" />
              <Box height="460px" marginTop="6px">
                <MISignalMap
                  data={[
                    {
                      sector: 'US, Natural Gas, Consumption, Electric Power',
                      change: -0.55,
                    },
                    {
                      sector: 'US, Natural Gas, Consumption, Pipeline and Distribution Use',
                      change: 0.55,
                    },
                    {
                      sector: 'US, Renewable Energy Consumption, Consumption, Totla',
                      change: 0.63,
                    },
                    {
                      sector: 'US, Natural Gas, Consumption, Electric Power 2',
                      change: 0.55,
                    },
                  ]}
                  useAnimation
                />
              </Box>
            </Box>
          </Box>
        </Box>
        <Box marginTop="40px">
          <Typography color="gray.70" variant="subtext5">
            The Application Demand Heatmap provides a comprehensive visualization of market demand trends across various macroeconomic
            indicators and industrial sectors. It serves as a powerful decision-support tool for strategists, analysts, and executives
            aiming to identify high-potential markets, monitor sectoral performance, and anticipate shifts in application demand based on
            real-time data. This heatmap is generated through correlation analysis between macroeconomic variables and application-level
            performance indicators (e.g., EBIT, CapEx, sales), segmented by industry and device category. The correlations are color-coded
            to allow intuitive interpretation—green indicates a strong positive correlation, while red signifies a strong negative
            correlation.
          </Typography>
        </Box>
      </Box>
    </MISkeleton>
  )
}

export default SignalMapPage
