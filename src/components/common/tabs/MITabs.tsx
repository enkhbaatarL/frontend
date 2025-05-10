import { Tabs, Tab, Box } from '@mui/material'
import { useMemo, useState, ReactNode, SyntheticEvent } from 'react'

import theme from '@/theming'

interface TabItem {
  label: ReactNode
  content: ReactNode
}

interface MITabsProps {
  arrayItem: TabItem[]
  initialValue?: number
  widthItem?: number | string
  onChange?: (value: number) => void
  isNotice?: boolean
  size?: 'h70' | 'h52' | 'h42' | 'h38'
}

function CustomTabPanel(props: Readonly<{ children?: ReactNode; value: number; index: number }>) {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} id={`mitab-panel-${index}`} aria-labelledby={`mitab-tab-${index}`} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

export default function MITabs({
  arrayItem,
  initialValue = 0,
  widthItem = 'auto',
  isNotice = false,
  onChange,
  size = 'h42',
}: Readonly<MITabsProps>) {
  const [value, setValue] = useState(initialValue)

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue)
    onChange?.(newValue)
  }

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
      <Box
        sx={{
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
          value={value}
          onChange={handleChange}
        >
          {arrayItem.map((item, idx) => (
            <Tab
              key={idx}
              label={item.label}
              id={`mitab-tab-${idx}`}
              aria-controls={`mitab-panel-${idx}`}
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
      {arrayItem.map((item, idx) => (
        <CustomTabPanel key={idx} value={value} index={idx}>
          {item.content}
        </CustomTabPanel>
      ))}
    </Box>
  )
}
