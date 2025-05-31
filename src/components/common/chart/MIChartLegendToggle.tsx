import { Box, Tooltip } from '@mui/material'
import { useMemo, useState } from 'react'

import MIChartViewToggle from './MIChartViewToogle'
import KeyboardArrowUpIcon from '../icons/KeyboardArrowUpIcon'

import theme from '@/theming'

const FOLDING_REFERENCE_POINT = 3

interface MIChartLegendToggleProps {
  labels: {
    goodDataName: string
    goodsDataSourceName: string
  }[]
  colors?: string[]
  onChange?: (index: number, isShow: boolean) => void
}

const MIChartLegendToggle = (props: Readonly<MIChartLegendToggleProps>) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleExpand = () => {
    setIsOpen((value) => !value)
  }

  const showedItems = useMemo(() => {
    if (props.labels.length <= FOLDING_REFERENCE_POINT) return props.labels

    return isOpen ? props.labels : props.labels.slice(0, 1)
  }, [isOpen, props.labels])

  return (
    <Box display={'flex'} alignItems={'flex-start'} gap={'8px'}>
      <Box display={'flex'} flexDirection={'column'} rowGap={'4px'}>
        {showedItems.map(({ goodDataName, goodsDataSourceName }, index) => (
          <Tooltip key={index} title={`${goodDataName} • ${goodsDataSourceName}`} placement="top" arrow disableInteractive>
            <Box
              display={'flex'}
              alignItems={'center'}
              sx={{
                boxSizing: 'border-box',
                height: '34px',
                padding: '4px 10px',
                border: `1px solid ${theme.palette.gray[20]}`,
                borderRadius: '4px',
                width: 'fit-content',
                transition: '.3s',
                backgroundColor: theme.palette.common.white,
                '&:hover': {
                  backgroundColor: theme.palette.content.backgroundHover,
                  '& svg': {
                    color: `${theme.palette.gray[70]}`,
                  },
                },
              }}
            >
              <MIChartViewToggle
                label={goodsDataSourceName}
                color={props.colors?.[index]}
                onChange={({ isShow }) => {
                  props.onChange?.(index, isShow)
                }}
              />
            </Box>
          </Tooltip>
        ))}
      </Box>
      {props.labels.length > FOLDING_REFERENCE_POINT && (
        <Box
          onClick={toggleExpand}
          sx={{
            background: theme.palette.common.white,
            boxSizing: 'border-box',
            width: '34px',
            height: '34px',
            cursor: 'pointer',
            padding: '6px',
            border: '1px solid',
            borderColor: theme.palette.gray[8],
            borderRadius: '4px',
            transition: '.3s',
            ...(isOpen
              ? {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.content.backgroundHover,
                '& svg': {
                  color: `${theme.palette.primary.main} !important`,
                },
              }
              : {}),
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.content.backgroundHover,
              '& svg': {
                color: `${theme.palette.primary.main} !important`,
              },
            },
          }}
        >
          <KeyboardArrowUpIcon
            style={{ display: 'block', color: theme.palette.gray[60], transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
          />
        </Box>
      )}
    </Box>
  )
}

export default MIChartLegendToggle
