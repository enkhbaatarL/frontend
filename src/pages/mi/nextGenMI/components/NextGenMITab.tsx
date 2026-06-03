import { Box, Tab, TabProps, Tabs, TabsProps } from '@mui/material'
import { ReactNode, SyntheticEvent, useState, useCallback } from 'react'

interface TabItem {
  label: string
  content: ReactNode
}

interface NextGenMITabProps extends Omit<TabsProps, 'onChange' | 'value'> {
  tabItems: TabItem[]
  tabProps?: TabProps
  tabBarOnly?: boolean
  endAdornment?: ReactNode
  value?: number
  onChange?: (index: number) => void
}

const FADE_IN_KEYFRAMES = {
  '@keyframes fadeInUp': {
    '0%': { opacity: 0, transform: 'translateY(4px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
}

const a11yProps = (index: number) => ({
  id: `next-gen-mi-tab-${index}`,
  'aria-controls': `next-gen-mi-tabpanel-${index}`,
})

const NextGenMITab = ({
  tabItems,
  tabProps,
  tabBarOnly,
  endAdornment,
  value: controlledValue,
  onChange: onChangeProp,
  ...props
}: NextGenMITabProps) => {
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
        <Box position="relative" zIndex={1} display="flex" alignItems="stretch" justifyContent="space-between">
          <Tabs
            value={selectedTab}
            onChange={handleChange}
            sx={{
              position: 'relative',
              flex: '1 1 auto',
              minWidth: 0,
              '.MuiTabs-indicator': {
                backgroundColor: 'mari.Primary',
              },

              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: 1.4,
                color: 'content.textNormal',
                minHeight: '62px',
                padding: '0 20px',
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
          {endAdornment && (
            <Box display="flex" alignItems="center" justifyContent="flex-end" flexShrink={0} minHeight="62px">
              {endAdornment}
            </Box>
          )}
        </Box>
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
                id={`next-gen-mi-tabpanel-${index}`}
                aria-labelledby={`next-gen-mi-tab-${index}`}
                sx={{
                  display: 'block',
                  position: isSelected ? 'static' : 'absolute',
                  visibility: isSelected ? 'visible' : 'hidden',
                  opacity: isSelected ? 1 : 0,
                  pointerEvents: isSelected ? 'auto' : 'none',
                  animation: isSelected ? 'fadeInUp 0.2s ease-out' : 'none',
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

export default NextGenMITab
