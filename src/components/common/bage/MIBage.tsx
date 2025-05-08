import { Chip, ChipProps, SxProps, Theme, Typography, TypographyProps } from '@mui/material'
import { useMemo } from 'react'

type MIChipSize = 'h20' | 'h24'
type MIChipColor = 'Insight' | 'Deal Insight' | 'Commodity Market Report' | 'Company Report' | 'Inform' | 'Trending' | 'Asset Report'

export interface MIChipProps extends Omit<ChipProps, 'size' | 'color'> {
  size?: MIChipSize
  color?: MIChipColor
}

export default function MIBage(props: Readonly<MIChipProps>) {
  const { size = 'h24', color = 'Insight', label, sx, ...originStyle } = props

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
    if (color === 'Insight')
      return {
        backgroundColor: '#E0F1FC',
        color: '#236482',
      }
    if (color === 'Deal Insight')
      return {
        backgroundColor: '#E0FCEF',
        color: '#23825A',
      }
    if (color === 'Commodity Market Report')
      return {
        backgroundColor: '#FCF4E0',
        color: '#825423',
      }
    if (color === 'Company Report')
      return {
        backgroundColor: '#E5E0FC',
        color: '#672382',
      }
    if (color === 'Inform')
      return {
        backgroundColor: '#DEDEDE',
        color: '#505050',
      }
    if (color === 'Trending')
      return {
        color: '#E6513A',
        backgroundColor: '#fff',
      }
    if (color === 'Asset Report')
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
