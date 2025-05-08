import { Chip, ChipProps, SxProps, Theme, Typography, TypographyProps } from '@mui/material'
import { useCallback, useMemo } from 'react'

type MIChipSize = 'h20' | 'h24'
type MIChipColor = 'blue' | 'purple' | 'orange' | 'green' | 'green-climb' | 'red' | 'red-decline' | 'gray' | 'white'

export interface MIChipProps extends Omit<ChipProps, 'size' | 'color'> {
  size?: MIChipSize
  color?: MIChipColor
  type?: 'filled' | 'outlined'
  fontType?: TypographyProps['variant']
}

export default function MIChip(props: Readonly<MIChipProps>) {
  const { size = 'h20', color = 'blue', label, type = 'filled', sx, fontType, ...originStyle } = props

  const getSizeStyle = (size: MIChipSize) => {
    if (size === 'h20')
      return {
        padding: '0px 8px',
        height: '20px',
      }

    if (size === 'h24')
      return {
        padding: '4px 8px',
        height: '24px',
      }

    return {}
  }

  const getColorStyle = useCallback(
    (color: MIChipColor) => {
      if (color === 'blue')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#D6E4F7',
          color: '#1967D2',
          borderColor: '#D6E4F7',
          '&:hover': {
            backgroundColor: '#D6E4F7',
          },
        }
      if (color === 'purple')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#EDE7FE',
          color: '#7048E8',
          borderColor: type === 'outlined' ? 'rgba(112, 72, 232, 0.10)' : '#EDE7FE',
          '&:hover': {
            backgroundColor: '#EDE7FE',
          },
        }
      if (color === 'orange')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#FFEADA',
          color: '#F76707',
          borderColor: type === 'outlined' ? 'rgba(247, 103, 7, 0.10)' : '#FFEADA',
          '&:hover': {
            backgroundColor: '#FFEADA',
          },
        }
      if (color === 'green')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#CAEDD1',
          color: '#2A8D3E',
          borderColor: type === 'outlined' ? 'rgba(42, 141, 62, 0.10)' : '#CAEDD1',
          '&:hover': {
            backgroundColor: '#CAEDD1',
          },
        }
      if (color === 'green-climb')
        return {
          backgroundColor: 'rgba(73, 139, 71, 0.10)',
          color: '#498B47',
          borderColor: 'tranparent',
        }
      if (color === 'red')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#FFE6E6',
          color: '#F03E3E',
          borderColor: type === 'outlined' ? 'rgba(240, 62, 62, 0.10)' : '#FFE6E6',
          '&:hover': {
            backgroundColor: '#FFE6E6',
          },
        }
      if (color === 'red-decline')
        return {
          backgroundColor: 'rgba(204, 77, 80, 0.10)',
          color: '#CC4D50',
          borderColor: 'tranparent',
        }
      if (color === 'gray')
        return {
          color: '#495057',
          backgroundColor: '#E9ECEF',
          // borderColor: '#495057',
        }
      if (color === 'white')
        return {
          color: '#495057',
          backgroundColor: '#FFFFFF',
          borderColor: '#495057',
        }

      return {}
    },
    [type],
  )

  const textStyle = useMemo((): TypographyProps => {
    if (size === 'h20')
      return {
        variant: fontType ?? 'chip2',
      }

    if (size === 'h24')
      return {
        variant: fontType ?? 'chip1',
      }

    return {}
  }, [size, fontType])

  // Size style follow the design
  const chipStyle = useMemo(
    (): SxProps<Theme> => ({
      '& .MuiChip-label': {
        padding: 0,
      },
      borderRadius: '100px',
      height: 'auto',
      border: '1px solid transparent',
      boxSizing: 'border-box',
      ...getSizeStyle(size),
      ...getColorStyle(color),
      ...sx,
    }),
    [size, color, sx, type],
  )

  return (
    <Chip
      clickable={false}
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
