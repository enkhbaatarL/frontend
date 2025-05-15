import { Chip, ChipProps, SxProps, Theme, Typography, TypographyProps } from '@mui/material'
import { useMemo } from 'react'

type MIChipSize = 'h20' | 'h24'
type MIChipColor = 'A_INSIGHT' | 'A_CMMDT_MRKT_RPT' | 'A_CMPY_RPT' | 'A_ASST_RPT' | 'A_DEAL_INSIGHT' | 'A_INFORM'
export interface MIChipProps extends Omit<ChipProps, 'size' | 'color'> {
  size?: MIChipSize
  color?: MIChipColor
}

export default function MIBage(props: Readonly<MIChipProps>) {
  const { size = 'h24', color = 'A_INSIGHT', label, sx, ...originStyle } = props

  const getSizeStyle = (size: MIChipSize) => {
    if (size === 'h20')
      return {
        padding: '4px 6px',
        lineHeight: '1',
      }

    if (size === 'h24')
      return {
        padding: '2px 6px',
      }

    return {}
  }

  const getColorStyle = (color: MIChipColor) => {
    if (color === 'A_INSIGHT')
      return {
        backgroundColor: '#E0F1FC',
        color: '#236482',
      }
    if (color === 'A_DEAL_INSIGHT')
      return {
        backgroundColor: '#E0FCEF',
        color: '#23825A',
      }
    if (color === 'A_CMMDT_MRKT_RPT')
      return {
        backgroundColor: '#FCF4E0',
        color: '#825423',
      }
    if (color === 'A_CMPY_RPT')
      return {
        backgroundColor: '#E5E0FC',
        color: '#672382',
      }
    // if (color === 'Inform')
    //   return {
    //     backgroundColor: '#DEDEDE',
    //     color: '#505050',
    //   }
    // if (color === 'Trending')
    //   return {
    //     color: '#E6513A',
    //     backgroundColor: '#fff',
    //   }
    if (color === 'A_ASST_RPT')
      return {
        color: '#823923',
        backgroundColor: '#FCE0E0',
      }

    return {}
  }

  const textStyle = useMemo((): TypographyProps => {
    if (size === 'h20')
      return {
        variant: 'bage1',
      }

    if (size === 'h24')
      return {
        variant: 'bage2',
      }

    return {}
  }, [size])

  // Size style follow the design
  const chipStyle = useMemo(
    (): SxProps<Theme> => ({
      '& .MuiChip-label': {
        padding: 0,
        overflow: 'unset',
      },
      height: 'auto',
      borderRadius: '2px',
      ...getSizeStyle(size),
      ...getColorStyle(color),
      ...sx,
    }),
    [size, color, sx],
  )

  return (
    <Chip
      label={
        <Typography component="span" {...textStyle}>
          {label}
        </Typography>
      }
      sx={chipStyle}
      {...originStyle}
    />
  )
}
