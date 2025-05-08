import { Box } from '@mui/material'
import { useState } from 'react'

import ArrowDown from '@/components/common/icons/ArrowDown'
import MIMenuSelector from '@/components/common/input/MIMenuSelector'
import theme from '@/theming'

export interface AdminCompanySelectorIconButtonProps {
  value: { value: string; label: string }
  onChange: (company: { value: string; label: string }) => void
  options?: { value: string; label: string }[]
}

const AdminCompanySelectorIconButton = (props: Readonly<AdminCompanySelectorIconButtonProps>) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <MIMenuSelector
      value={props.value}
      options={props.options}
      onChange={({ value, label }) => props.onChange({ value: value as string, label })}
      onOpen={setIsOpen}
    >
      <Box
        width={'28px'}
        height={'28px'}
        display={'flex'}
        alignItems={'center'}
        justifyContent={'center'}
        borderRadius={'4px'}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: theme.palette.gray[20],
          },
          '& svg': {
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          },
        }}
      >
        <ArrowDown />
      </Box>
    </MIMenuSelector>
  )
}

export default AdminCompanySelectorIconButton
