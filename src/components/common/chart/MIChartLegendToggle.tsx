import { Box } from '@mui/material'
import { useMemo, useState } from 'react'

import MIChartViewToggle from './MIChartViewToogle'
import KeyboardArrowUpIcon from '../icons/KeyboardArrowUpIcon'

import theme from '@/theming'

export default function MIChartLegendToggle(
  props: Readonly<{ labels: string[]; colors?: string[]; onChange?: (index: number, isShow: boolean) => void }>,
) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleExpand = () => {
    setIsOpen((value) => !value)
  }

  const showedItems = useMemo(() => {
    if (props.labels.length <= 3) return props.labels

    return isOpen ? props.labels : props.labels.slice(0, 1)
  }, [isOpen, props.labels])

  return (
    <Box display={'flex'} alignItems={'flex-start'} gap={'8px'}>
      <Box display={'flex'} flexDirection={'column'} rowGap={'4px'}>
        {showedItems.map((item, index) => (
          <Box
            key={index}
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
              label={item}
              color={props.colors?.[index]}
              onChange={({ isShow }) => {
                props.onChange?.(index, isShow)
              }}
            />
          </Box>
        ))}
      </Box>
      {props.labels.length > 3 && (
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
