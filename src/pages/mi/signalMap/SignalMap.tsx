import { Box, Typography } from '@mui/material'

import MIButtonSelect from '@/components/common/chart/MIChartButtonSelect'
import MIColorRange from '@/components/common/colorrange/MIColorRange'

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
          <img width={2} height={2} style={{ marginLeft: '6px', marginRight: '6px' }} src="/src/assets/eclipse.svg" alt="" />
          <Typography color="gray.70" variant={boldTitle ? 'subtext3' : 'subtext4'}>
            {subCategories} Sub-categories
          </Typography>
        </>
      )}
    </Box>
  </Box>
)

const SignalMap = () => (
  <>
    <Box paddingX={7.5} paddingTop="50px" paddingBottom="40px" textAlign="center">
      <Typography color="gray.90" variant="heading0">
          Henry Hub Market Landscape Map
      </Typography>
      <br />
      <Typography color="#495057" variant="subtext0">
          Visual Correlation of Market Signals by Sector
      </Typography>
    </Box>
    <Box paddingX={7.5} maxWidth="1380px" margin="auto">
      <Box
        paddingTop="24px"
        paddingBottom="20px"
        borderTop="1px solid"
        borderColor="gray.30"
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            md: 'row',
          },
          justifyContent: {
            xs: 'center',
            md: 'space-between',
          },
          alignItems: {
            xs: 'center',
            md: 'start',
          },
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
          display: { xs: 'block', md: 'grid' },
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
            <Box height="460px" bgcolor="#D9D9D9" marginTop="6px"></Box>
          </Box>
          <Box mb={6}>
            <SectionHeader title="External Factors" itemCount="43" subCategories="3" />
            <Box height="460px" bgcolor="#D9D9D9" marginTop="6px"></Box>
          </Box>
        </Box>
        <Box>
          <Box mb={5}>
            <SectionHeader title="Market Fundamentals" itemCount="50" boldTitle />
          </Box>
          <Box mb={6}>
            <SectionHeader title="Supply-side Factors" itemCount="29" subCategories="2" />
            <Box height="460px" bgcolor="#D9D9D9" marginTop="6px"></Box>
          </Box>
          <Box mb={6}>
            <SectionHeader title="Demand-side Factors" itemCount="30" subCategories="2" />
            <Box height="460px" bgcolor="#D9D9D9" marginTop="6px"></Box>
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
  </>
)

export default SignalMap
