import { Chip, ChipProps, SxProps, Theme, Typography, TypographyProps } from '@mui/material'
import { useCallback, useMemo } from 'react'

type MIChipSize = 'h20' | 'h22' | 'h24'
type MIChipColor =
  | 'blue'
  | 'purple'
  | 'orange'
  | 'green'
  | 'green-climb'
  | 'red'
  | 'red-decline'
  | 'pink'
  | 'gray'
  | 'white'
  | 'gray-border'
  | 'primary'

export interface MIChipProps extends Omit<ChipProps, 'size' | 'color'> {
  size?: MIChipSize
  color?: MIChipColor
  type?: 'filled' | 'outlined' | 'mari'
  fontType?: TypographyProps['variant']
  disableHover?: boolean
}

export default function MIChip(props: Readonly<MIChipProps>) {
  const { size = 'h20', color = 'blue', label, type = 'filled', sx, fontType, disableHover = false, ...originStyle } = props

  const getSizeStyle = (size: MIChipSize) => {
    if (size === 'h20')
      return {
        padding: '0px 8px',
        height: '20px',
      }

    if (size === 'h22')
      return {
        padding: '4px 8px',
        height: '22px',
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
          backgroundColor: type === 'outlined' ? '#FFFFFF' : type === 'mari' ? 'transparent' : '#D6E4F7',
          color: '#1967D2',
          borderColor: '#1C7ED61A',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#1C7ED61A',
              },
            }),
        }
      if (color === 'purple')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : type === 'mari' ? 'transparent' : '#EDE7FE',
          color: '#7451DD',
          borderColor: type === 'outlined' ? 'rgba(112, 72, 232, 0.10)' : 'tranparent',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#F3EFF9',
              },
            }),
        }
      if (color === 'orange')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : type === 'mari' ? 'transparent' : '#FFEADA',
          color: '#EB670F',
          borderColor: type === 'outlined' ? 'rgba(247, 103, 7, 0.10)' : 'tranparent',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#F261001A',
              },
            }),
        }
      if (color === 'green')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : type === 'mari' ? 'transparent' : '#CAEDD1',
          color: '#2A8D3E',
          borderColor: type === 'outlined' ? 'rgba(42, 141, 62, 0.10)' : 'tranparent',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#2A8D3E1A',
              },
            }),
        }
      if (color === 'green-climb')
        return {
          backgroundColor: 'rgba(73, 139, 71, 0.10)',
          color: '#498B47',
          borderColor: 'tranparent',
        }
      if (color === 'red')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : type === 'mari' ? 'transparent' : '#FFE6E6',
          color: '#DF4B4A',
          borderColor: type === 'outlined' ? 'rgba(240, 62, 62, 0.10)' : 'tranparent',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#F03E3E1A',
              },
            }),
        }
      if (color === 'red-decline')
        return {
          backgroundColor: 'rgba(204, 77, 80, 0.10)',
          color: '#CC4D50',
          borderColor: 'tranparent',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#CC4D501A',
              },
            }),
        }
      if (color === 'pink')
        return {
          backgroundColor: type === 'outlined' ? '#FFFFFF' : '#D6336C1A',
          color: '#D6336C',
          borderColor: type === 'outlined' ? 'rgba(240, 62, 62, 0.10)' : 'tranparent',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#D6336C1A',
              },
            }),
        }
      if (color === 'gray')
        return {
          color: '#495057',
          backgroundColor: type === 'mari' ? 'transparent' : '#E9ECEF',
          borderColor: type === 'mari' ? '#DEE2E6' : 'transparent',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#E9ECEF',
              },
            }),
        }
      if (color === 'white')
        return {
          color: '#495057',
          backgroundColor: '#FFFFFF',
          borderColor: '#DEE2E6',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#FFFFFF',
              },
            }),
        }
      if (color === 'gray-border')
        return {
          color: '#495057',
          backgroundColor: '#FFFFFF',
          borderColor: '#DEE2E6',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#FFFFFF',
              },
            }),
        }
      if (color === 'primary')
        return {
          color: '#495057',
          backgroundColor: '#FFFFFF',
          borderColor: '#DEE2E6',
          ...(disableHover
            ? {}
            : {
              '&:hover': {
                backgroundColor: '#FFFFFF',
              },
            }),
        }
      return {}
    },
    [type, disableHover],
  )

  const textStyle = useMemo((): TypographyProps => {
    if (size === 'h20')
      return {
        variant: type === 'mari' ? 'mariChip' : (fontType ?? 'chip2'),
      }

    if (size === 'h24')
      return {
        variant: type === 'mari' ? 'mariChip' : (fontType ?? 'chip1'),
      }

    return {}
  }, [size, type, fontType])

  // Size style follow the design
  const chipStyle = useMemo(
    (): SxProps<Theme> => ({
      '& .MuiChip-label': {
        padding: 0,
      },
      borderRadius: type === 'mari' ? '2px' : '100px',
      height: 'auto',
      border: '1px solid transparent',
      boxSizing: 'border-box',
      ...getSizeStyle(size),
      ...getColorStyle(color),
      ...sx,
    }),
    [size, getColorStyle, color, sx],
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
