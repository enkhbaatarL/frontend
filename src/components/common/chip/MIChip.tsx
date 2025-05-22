import { Chip, ChipProps, SxProps, Theme, Typography, TypographyProps } from '@mui/material'
import { useCallback, useMemo } from 'react'

type MIChipSize = 'h20' | 'h24'
type MIChipColor =
  | 'blue'
  | 'purple'
  | 'orange'
  | 'green'
  | 'green-climb'
  | 'red'
  | 'red-decline'
  | 'gray'
  | 'white'
  | 'gray-border'
  | 'primary'

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
        height: '22px',
      }

    return {}
  }

  const getColorStyle = useCallback(
    (color: MIChipColor) => {
      if (color === 'blue')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#1C7ED61A',
          color: '#1967D2',
          borderColor: '#1C7ED61A',
          '&:hover': {
            backgroundColor: '#1C7ED61A',
          },
        }
      if (color === 'purple')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#F3EFF9',
          color: '#7451DD',
          borderColor: type === 'outlined' ? 'rgba(112, 72, 232, 0.10)' : '#F3EFF9',
          '&:hover': {
            backgroundColor: '#F3EFF9',
          },
        }
      if (color === 'orange')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#F261001A',
          color: '#EB670F',
          borderColor: type === 'outlined' ? 'rgba(247, 103, 7, 0.10)' : '#F261001A',
          '&:hover': {
            backgroundColor: '#F261001A',
          },
        }
      if (color === 'green')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#2A8D3E1A',
          color: '#2A8D3E',
          borderColor: type === 'outlined' ? 'rgba(42, 141, 62, 0.10)' : '#2A8D3E1A',
          '&:hover': {
            backgroundColor: '#2A8D3E1A',
          },
        }
      if (color === 'green-climb')
        return {
          backgroundColor: '#498B471A',
          color: '#498B47',
          borderColor: 'tranparent',
        }
      if (color === 'red')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#F03E3E1A',
          color: '#DF4B4A',
          borderColor: type === 'outlined' ? 'rgba(240, 62, 62, 0.10)' : '#F03E3E1A',
          '&:hover': {
            backgroundColor: '#F03E3E1A',
          },
        }
      if (color === 'red-decline')
        return {
          backgroundColor: '#CC4D501A',
          color: '#CC4D50',
          borderColor: 'tranparent',
        }
      if (color === 'gray')
        return {
          color: '#495057',
          backgroundColor: '#E9ECEF',
          borderColor: '#4950571A',
        }
      if (color === 'white')
        return {
          color: '#495057',
          backgroundColor: '#FFFFFF',
          borderColor: '#DEE2E6',
        }
      if (color === 'gray-border')
        return {
          color: '#495057',
          backgroundColor: '#FFFFFF',
          borderColor: '#DEE2E6',
        }
      if (color === 'primary')
        return {
          color: '#495057',
          backgroundColor: '#FFFFFF',
          borderColor: '#DEE2E6',
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
