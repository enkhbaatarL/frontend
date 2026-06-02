import { Box, Tab, TabProps, Tabs, TabsProps } from '@mui/material'
import { ReactNode, SyntheticEvent, useCallback, useState } from 'react'

/** 탭 한 칸(label + 패널 콘텐츠) */
interface TabItem {
  label: string
  content: ReactNode
}

export interface FundamentalModelTabProps extends Omit<TabsProps, 'onChange' | 'value'> {
  tabItems: TabItem[]
  tabProps?: TabProps
  tabBarOnly?: boolean
  value?: number
  onChange?: (index: number) => void
}

const FADE_IN_KEYFRAMES = {
  '@keyframes fundamentalModelFadeInUp': {
    '0%': { opacity: 0, transform: 'translateY(4px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
}

/** a11y id: 시나리오 워크벤치와 중복되지 않도록 전용 prefix */
const a11yProps = (index: number) => ({
  id: `fundamental-model-tab-${index}`,
  'aria-controls': `fundamental-model-tabpanel-${index}`,
})

/** MI Fundamental Model 상단 탭 바(워크벤치 NextGenMITab과 동일 역할) */
const FundamentalModelTab = ({
  tabItems,
  tabProps,
  tabBarOnly,
  value: controlledValue,
  onChange: onChangeProp,
  ...props
}: FundamentalModelTabProps) => {
  const [internalTab, setInternalTab] = useState(0)
  const isControlled = controlledValue !== undefined
  const selectedTab = isControlled ? controlledValue : internalTab

  const handleChange = useCallback(
    (_: SyntheticEvent, newValue: number) => {
      if (!isControlled) setInternalTab(newValue)
      onChangeProp?.(newValue)
    },
    [isControlled, onChangeProp],
  )

  return (
    <Box>
      <Box
        position="relative"
        sx={{
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: 'gray.30',
            zIndex: 0,
          },
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          sx={{
            position: 'relative',
            zIndex: 1,
            '.MuiTabs-indicator': {
              backgroundColor: 'mari.Primary',
            },
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '18px',
              color: 'content.textNormal',
              padding: '12px 20px 22px 20px',
              textTransform: 'none',
              '&.Mui-selected': {
                color: 'mari.Primary',
              },
            },
          }}
          {...props}
        >
          {tabItems.map((tab, index) => (
            <Tab key={tab.label} label={tab.label} disableRipple {...a11yProps(index)} {...tabProps} />
          ))}
        </Tabs>
      </Box>

      {tabBarOnly ? null : (
        <Box position="relative">
          {tabItems.map((tab, index) => {
            const isSelected = selectedTab === index

            return (
              <Box
                key={tab.label}
                role="tabpanel"
                hidden={!isSelected}
                id={`fundamental-model-tabpanel-${index}`}
                aria-labelledby={`fundamental-model-tab-${index}`}
                sx={{
                  display: 'block',
                  position: isSelected ? 'static' : 'absolute',
                  visibility: isSelected ? 'visible' : 'hidden',
                  opacity: isSelected ? 1 : 0,
                  pointerEvents: isSelected ? 'auto' : 'none',
                  animation: isSelected ? 'fundamentalModelFadeInUp 0.2s ease-out' : 'none',
                  ...(!isSelected
                    ? {
                      left: '-9999px',
                      top: '-9999px',
                      width: '100%',
                    }
                    : {}),
                  ...FADE_IN_KEYFRAMES,
                }}
              >
                {tab.content}
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

export default FundamentalModelTab
