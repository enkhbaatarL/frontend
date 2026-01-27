import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'

const ForecastChartTooltipReportContentTab = () => {
  const [selectedTab, setSelectedTab] = useState(0)

  const tabs = [
    'EIA',
    'ENERGY1',
    'ENERGY2',
    'ENERGY3',
    'MACRO_RISK',
    'FINANCE',
    'FACTOR',
    'OIL_PRICE',
    'SUPPLY_CHAIN',
    'DEMAND_TRENDS',
    'CLIMATE_POLICY',
    'GEOPOLITICS',
    'CURRENCY',
    'MARKET_SENTIMENT',
    'TECHNOLOGY',
    'REGULATORY',
    'INVENTORY',
    'TRADE_FLOW',
    'EXPORTS',
    'IMPORTS',
  ]

  return (
    <Box position="relative" sx={{ userSelect: 'none' }}>
      {/* 탭 컨테이너 */}
      <Stack
        direction="row"
        px="38px"
        sx={{
          position: 'relative',
          zIndex: 1,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: '#E0E0E0',
            zIndex: 0,
          },
        }}
      >
        {tabs.map((tab, index) => {
          const isSelected = selectedTab === index

          return (
            <Box
              key={tab}
              onClick={() => setSelectedTab(index)}
              padding="10px 24px"
              sx={{
                fontWeight: 700,
                fontSize: '14px',
                color: isSelected ? '#1A1A1A' : '#666666',
                cursor: 'pointer',
                position: 'relative',
                backgroundColor: 'transparent',
                flexShrink: 0,
                zIndex: isSelected ? 2 : 1,
                '&:not(:first-of-type)': {
                  marginLeft: 0,
                },
                ...(isSelected
                  ? {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      border: '1px solid #D0D0D0',
                      borderBottom: 'none',
                      borderRadius: '6px 6px 0 0',
                      backgroundColor: '#FFFFFF',
                      zIndex: -1,
                    },
                  }
                  : {}),
              }}
            >
              <Typography
                color={isSelected ? 'contentText.Black' : 'contentText.Normal'}
                fontSize="18px"
                fontWeight={isSelected ? 600 : 500}
              >
                {tab}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}

export default ForecastChartTooltipReportContentTab
