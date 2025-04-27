import { Chip, ChipProps, SxProps, Theme, Typography, TypographyProps } from '@mui/material'
import { useMemo } from 'react'

type MIChipSize = 'h20' | 'h24'
type MIChipColor = 'blue' | 'purple' | 'orange' | 'green' | 'red' | 'gray' | 'white'

export interface MIChipProps extends Omit<ChipProps, 'size' | 'color'> {
  size?: MIChipSize
  color?: MIChipColor
}

export default function MIChip(props: Readonly<MIChipProps>) {
  const { size = 'h20', color = 'blue', label, sx, ...originStyle } = props

  const getSizeStyle = (chipSize: MIChipSize) => {
    if (chipSize === 'h20')
      return {
        padding: '0px 8px',
        height: '20px',
      }

    if (chipSize === 'h24')
      return {
        padding: '4px 8px',
        height: '24px',
      }

    return {}
  }

  const getColorStyle = (chipColor: MIChipColor) => {
    if (chipColor === 'blue')
      return {
        backgroundColor: '#D6E4F7',
        color: '#1967D2',
      }
    if (chipColor === 'purple')
      return {
        backgroundColor: '#EDE7FE',
        color: '#7048E8',
      }
    if (chipColor === 'orange')
      return {
        backgroundColor: '#FFEADA',
        color: '#F76707',
      }
    if (chipColor === 'green')
      return {
        backgroundColor: '#CAEDD1',
        color: '#2A8D3E',
      }
    if (chipColor === 'red')
      return {
        backgroundColor: '#FFE6E6',
        color: '#F03E3E',
      }
    if (chipColor === 'gray')
      return {
        color: '#495057',
        backgroundColor: '#E9ECEF',
      }
    if (chipColor === 'white')
      return {
        color: '#495057',
        backgroundColor: '#FFFFFF',
      }

    return {}
  }

  const textStyle = useMemo((): TypographyProps => {
    if (size === 'h20')
      return {
        variant: 'chip2',
      }

    if (size === 'h24')
      return {
        variant: 'chip1',
      }

    return {}
  }, [size])

  // Size style follow the design
  const chipStyle = useMemo(
    (): SxProps<Theme> => ({
      '& .MuiChip-label': {
        padding: 0,
      },
      height: 'auto',
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
