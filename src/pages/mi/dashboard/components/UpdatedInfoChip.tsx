import { Chip } from '@mui/material'
import { useMemo } from 'react'

interface UpdatedInfoChipProps {
  label: string
  color: {
    backgroundColor: string
    color: string
  }
}

const UpdatedInfoChip = ({ label, color }: UpdatedInfoChipProps) => {
  const chipStyle = useMemo(
    () => ({
      backgroundColor: color.backgroundColor,
      color: color.color,
      height: '36px',
      borderRadius: '10px',
      fontSize: 14,
      fontWeight: 500,
    }),
    [color],
  )

  return <Chip label={label} sx={chipStyle} />
}

export default UpdatedInfoChip
