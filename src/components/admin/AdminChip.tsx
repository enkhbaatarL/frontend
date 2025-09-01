import { Chip, ChipProps, SxProps, Theme, Typography, TypographyProps } from '@mui/material'
import { useMemo } from 'react'

type AdminChipSize = 'h20' | 'h24'
type AdminChipColor = 'blue' | 'purple' | 'orange' | 'green' | 'red' | 'gray' | 'white' | 'primary'

export interface AdminChipProps extends Omit<ChipProps, 'size' | 'color'> {
  size?: AdminChipSize
  color?: AdminChipColor
}

const AdminChip = (props: Readonly<AdminChipProps>) => {
  const { size = 'h20', color = 'blue', label, ...originStyle } = props

  const getSizeStyle = (adminChipSize: AdminChipSize) => {
    if (adminChipSize === 'h20')
      return {
        padding: '0px 8px',
        height: '20px',
      }

    if (adminChipSize === 'h24')
      return {
        padding: '4px 8px',
        height: '24px',
      }

    return {}
  }

  const getColorStyle = (adminChipColor: AdminChipColor) => {
    if (adminChipColor === 'blue')
      return {
        backgroundColor: '#1C7ED61A',
        color: '#1967D2',
      }
    if (adminChipColor === 'purple')
      return {
        backgroundColor: '#F3EFF9',
        color: '#7451DD',
      }
    if (adminChipColor === 'orange')
      return {
        backgroundColor: '#F261001A',
        color: '#EB670F',
      }
    if (adminChipColor === 'green')
      return {
        backgroundColor: '#2A8D3E1A',
        color: '#2A8D3E',
      }
    if (adminChipColor === 'red')
      return {
        backgroundColor: '#F03E3E1A',
        color: '#DF4B4A',
      }
    if (adminChipColor === 'gray')
      return {
        color: '#495057',
        backgroundColor: '#E9ECEF',
      }
    if (adminChipColor === 'white')
      return {
        color: '#495057',
        backgroundColor: '#DEE2E6',
      }
    if (adminChipColor === 'primary')
      return {
        color: '#FFFFFF',
        backgroundColor: '#2E3F5E',
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
      ...originStyle,
    }),
    [size, color, originStyle],
  )

  return (
    <Chip
      label={
        <Typography component="span" {...textStyle}>
          {label}
        </Typography>
      }
      sx={chipStyle}
    />
  )
}

export default AdminChip
