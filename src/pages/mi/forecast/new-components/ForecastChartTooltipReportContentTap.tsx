import { Box, Stack, Typography } from '@mui/material'
import { useState, useEffect } from 'react'

interface ForecastChartTooltipReportContentTabProps {
  explanatoryLevelNms?: string[]
  onCategoryChange?: (category: string) => void
}

const ForecastChartTooltipReportContentTab = ({ explanatoryLevelNms = [], onCategoryChange }: ForecastChartTooltipReportContentTabProps) => {
  const [selectedTab, setSelectedTab] = useState(0)

  const tabs = explanatoryLevelNms.length > 0 ? explanatoryLevelNms : []

  // 첫 번째 아이템이 선택된 상태로 시작
  useEffect(() => {
    if (tabs.length > 0 && onCategoryChange && selectedTab === 0) {
      onCategoryChange(tabs[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explanatoryLevelNms?.length])

  const handleTabClick = (index: number) => {
    setSelectedTab(index)
    if (onCategoryChange && tabs[index]) {
      onCategoryChange(tabs[index])
    }
  }

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
              onClick={() => handleTabClick(index)}
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
