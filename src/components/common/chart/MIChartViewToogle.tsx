import { Box, Typography } from '@mui/material'
import { useState } from 'react'

import VisibilityIcon from '../icons/VisibilityIcon'
import VisibilityOffIcon from '../icons/VisibilityOffIcon'

import theme from '@/theming'

export default function MIChartViewToggle(
  props: Readonly<{
    label: string
    color?: string
    value?: boolean
    onChange?: (state: { label: string; isShow: boolean }) => void
    maxWidth?: number
    isVisible?: boolean
  }>,
) {
  const [isShow, setIsShow] = useState(props.value ?? true)
  const toggle = () => {
    let newIsShow = !isShow
    if (props.value !== undefined) {
      newIsShow = !props.value
    } else {
      setIsShow(newIsShow)
    }
    props.onChange?.({
      label: props.label,
      isShow: newIsShow,
    })
  }

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
        {(props.value ?? isShow) ? (
          <VisibilityIcon width={20} height={20} color={theme.palette.gray[60]} />
        ) : (
          <VisibilityOffIcon width={20} height={20} color={theme.palette.gray[60]} />
        )}
      </Box>
      {props.color && (
        <Box
          ml="4px"
          mr="8px"
          width={'11px'}
          height={'11px'}
          bgcolor={props.color}
          borderRadius={'3px'}
          sx={{
            opacity: (props.value ?? isShow) ? 1 : 0.3,
          }}
        />
      )}

      <Typography
        variant="body3M12"
        color={(props.value ?? isShow) ? 'gray.70' : 'gray.50'}
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
