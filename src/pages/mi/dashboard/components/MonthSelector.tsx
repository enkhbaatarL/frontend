import { Tabs } from '@mui/material'

import MISegmented from '@/components/common/segmentedbtn/MISegmented'

type MonthItem = {
  label: string
  value: string
  isLatest?: boolean
  disabled?: boolean
}

interface MonthSelectorProps {
  months: MonthItem[]
  selected: string
  onSelect: (value: string) => void
}

const MonthSelector = ({ months, selected, onSelect }: MonthSelectorProps) => {
  const selectedIndex = months.findIndex((month) => month.value === selected)

  return (
    <Tabs
      value={selectedIndex !== -1 ? selectedIndex : 0}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 'unset',
        '.MuiTabs-indicator': {
          display: 'none',
        },
        '.MuiTabs-list': {
          gap: '8px',
        },
        '& .MuiTabs-scrollButtons': {
          color: 'content.iconActive',
          border: '1px solid #CED4DA',
          borderRadius: '50%',
          backgroundColor: '#fff',
          fontSize: 24,
          width: 38,
          height: 38,
          flexShrink: 0,
          position: 'relative',
          zIndex: 0,
          svg: {
            fontSize: 24,
          },
          '&.Mui-disabled': {
            display: 'none',
          },
          '.MuiTouchRipple-root': {
            display: 'none',
          },
          '&:first-of-type': {
            zIndex: 1,
            '&:before': {
              content: '""',
              width: 108,
              height: 42,
              position: 'absolute',
              left: 0,
              top: -1,
              zIndex: -1,
              background: 'linear-gradient(90deg, #FFF 40%, rgba(255, 255, 255, 0.00) 96.67%)',
            },
            '&:after': {
              content: '""',
              width: '37px',
              height: '37px',
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 1,
              border: '1px solid #CED4DA',
              borderRadius: '50%',
              boxSizing: 'border-box',
            },
          },
          '&:last-of-type': {
            marginRight: '-1px',
            '&:before': {
              content: '""',
              width: 108,
              height: 42,
              position: 'absolute',
              right: 0,
              top: -1,
              zIndex: -1,
              background: 'linear-gradient(270deg, #FFF 40%, rgba(255, 255, 255, 0.00) 96.67%)',
            },
            '&:after': {
              content: '""',
              width: '37px',
              height: '37px',
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 1,
              border: '1px solid #CED4DA',
              borderRadius: '50%',
              boxSizing: 'border-box',
            },
          },
        },
      }}
      onChange={(_, newIndex) => onSelect(months[newIndex].value)}
    >
      {months.map((month, index) => (
        <MISegmented active={month.value === selected} onClick={() => onSelect(month.value)} key={index}>
          {month.label}
        </MISegmented>
      ))}
    </Tabs>
  )
}

export default MonthSelector
