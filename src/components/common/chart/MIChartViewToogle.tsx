import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import VisibilityIcon from '../icons/VisibilityIcon'
import VisibilityOffIcon from '../icons/VisibilityOffIcon'

import theme from '@/theming'

export default function MIChartViewToggle(
  props: Readonly<{
    label: string
    onChange?: (state: { label: string; isShow: boolean }) => void
    maxWidth?: number
  }>,
) {
  const [isShow, setIsShow] = useState(true)
  const toggle = () => {
    setIsShow((value) => !value)
  }

  useEffect(() => {
    props.onChange?.({
      label: props.label,
      isShow,
    })
  }, [isShow])

  return (
    <Box
      display={'flex'}
      alignItems={'center'}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': {
          '& svg': {
            color: `${theme.palette.gray[70]}`,
          },
        },
      }}
      onClick={toggle}
    >
      <Box
        mr="4px"
        p="4px"
        sx={{
          '& svg': { display: 'block' },
        }}
      >
        {isShow ? (
          <VisibilityIcon width={20} height={20} color={theme.palette.gray[60]} />
        ) : (
          <VisibilityOffIcon width={20} height={20} color={theme.palette.gray[60]} />
        )}
      </Box>
      <Typography
        variant="body3M12"
        color={isShow ? 'gray.70' : 'gray.50'}
        sx={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: props.maxWidth ? `${props.maxWidth}px` : '152px',
        }}
      >
        {props.label}
      </Typography>
    </Box>
  )
}
