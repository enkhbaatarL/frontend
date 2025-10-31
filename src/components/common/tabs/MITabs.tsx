import { Tabs, Tab, Box } from '@mui/material'
import { useMemo, ReactNode, SyntheticEvent, useState } from 'react'

import theme from '@/theming'

interface TabItem {
  label: ReactNode
  content: ReactNode
}

interface MITabsProps {
  arrayItem: TabItem[]
  value?: number
  widthItem?: number | string
  widthTab?: number | string
  onChange?: (value: number) => void
  isNotice?: boolean
  size?: 'h70' | 'h52' | 'h42' | 'h38'
  hideForecast?: boolean
}

const CustomTabPanel = (props: Readonly<{ children?: ReactNode; value: number; index: number }>) => {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} id={`mi-tab-panel-${index}`} aria-labelledby={`mi-tab-tab-${index}`} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

export default function MITabs({
  arrayItem,
  value,
  widthItem = 'auto',
  widthTab,
  isNotice = false,
  onChange,
  size = 'h42',
  hideForecast = false,
}: Readonly<MITabsProps>) {
  const [innerTabId, setInnerTabId] = useState(value ?? 0)

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    onChange?.(newValue)
    setInnerTabId(newValue)
  }

  const tabId = useMemo(() => value ?? innerTabId, [value, innerTabId])
  const styleBaseSize = useMemo(() => {
    const typography = {
      h70: theme.typography.body1M16,
      h52: theme.typography.body2M14,
      h42: theme.typography.body2M14,
      h38: theme.typography.body3M12,
    }[size]

    const padding = {
      h70: '24px 16px',
      h52: '16px 16px',
      h42: '11px 16px',
      h38: '10px 16px',
    }[size]

    return {
      padding,
      ...typography,
    }
  }, [size])

  return (
    <Box sx={{ width: '100%' }}>
      {!hideForecast && (
        <Box
          sx={{
            width: widthTab,
            margin: 'auto',
            marginBottom: 4,
            borderBottom: isNotice ? 0 : 1,
            borderColor: '#DEE2E6',
            backgroundColor: isNotice ? '#F1F3F5' : 'transparent',
            padding: isNotice ? 1 : 0,
            borderRadius: isNotice ? 1 : 0,
            '.MuiTabs-indicator': {
              display: isNotice || arrayItem.length === 1 ? 'none' : 'block',
            },
          }}
        >
          <Tabs
            sx={{
              minHeight: 'unset',
            }}
            value={tabId}
            onChange={handleChange}
          >
            {arrayItem.map((item, idx) => (
              <Tab
                key={`tab-${idx}`}
                label={item.label}
                id={`mi-tab-tab-${idx}`}
                aria-controls={`mi-tab-panel-${idx}`}
                disableRipple
                sx={{
                  ...(isNotice
                    ? {
                      fontSize: '16px',
                      fontWeight: 600,
                      padding: '6px 12px',
                    }
                    : styleBaseSize),
                  color: isNotice ? '#868E96' : '#495057',
                  textTransform: 'none',
                  minWidth: 'unset',
                  minHeight: 'unset',
                  textAlign: 'center',
                  borderRadius: isNotice ? 1 : 0,
                  width: widthItem,
                  '&:hover': {
                    fontWeight: 600,
                  },
                  '&.Mui-selected': {
                    color: isNotice || arrayItem.length === 1 ? '#212529' : '#2E3F5E',
                    borderBottom: 0,
                    fontWeight: arrayItem.length === 1 ? 700 : 600,
                    backgroundColor: isNotice ? '#fff' : 'transparent',
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>
      )}
      {arrayItem.map((item, idx) => (
        <CustomTabPanel key={`tab-panel-${idx}`} value={tabId} index={idx}>
          {item.content}
        </CustomTabPanel>
      ))}
    </Box>
  )
}
