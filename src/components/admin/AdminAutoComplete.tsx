import { Autocomplete, AutocompleteProps } from '@mui/material'
import { Children, PropsWithChildren, useMemo } from 'react'

import AdminTextField from '@/components/admin/AdminTextField'
import ScrollWrapper from '@/components/admin/ScrollWrapper'
import ArrowDown from '@/components/common/icons/ArrowDown'
import CancelIcon from '@/components/common/icons/CancelIcon'
import theme from '@/theming'

// MUI의 ownerState 타입을 정의
type OwnerState = {
  disablePortal?: boolean
  expanded?: boolean
  focused?: boolean
  fullWidth?: boolean
  hasClearIcon?: boolean
  hasPopupIcon?: boolean
  inputFocused?: boolean
  popupOpen?: boolean
  size?: 'small' | 'medium'
  [key: string]: unknown // 다른 가능한 ownerState 속성들
}

const ListBoxComponent = (props: PropsWithChildren & { ownerState?: OwnerState }) => {
  // ownerState prop을 명시적으로 제거하고 다른 속성들만 전달
  const { children, ownerState, ...other } = props

  return (
    <ScrollWrapper maxHeight={180}>
      <ul className="MuiAutocomplete-listbox" {...other}>
        {Children.map(children, (child) => child)}
      </ul>
    </ScrollWrapper>
  )
}

export default function AdminAutoComplete<OptionItem>(
  props: Omit<AutocompleteProps<OptionItem, false, true, false>, 'renderInput' | 'size'> & {
    placeholder?: string
    size?: 'h26' | 'h34' | 'h36'
  },
) {
  const { size, ...originProps } = props

  const getSizeStyle = useMemo(() => {
    switch (props.size) {
      case 'h26':
        return {
          padding: '5px 12px !important',
          ...theme.typography.body3R12,
        }
      case 'h36':
        return {
          padding: '8px 12px !important',
          ...theme.typography.body3R14,
        }
      default: // 'h34'
        return {
          padding: '7px 12px !important',
          ...theme.typography.body3R14,
        }
    }
  }, [props.size])

  return (
    <Autocomplete
      {...originProps}
      clearIcon={<CancelIcon />}
      popupIcon={<ArrowDown />}
      renderInput={({ size: _size, ...params }) => <AdminTextField {...params} placeholder={props.placeholder} />}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '6px',
            boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.20)',
            overflow: 'hidden',
            padding: '8px 0',
            position: 'relative',
            '& .MuiAutocomplete-option': {
              ...theme.typography.body2R14,
              padding: '8px 12px',
              color: theme.palette.gray[70],
              cursor: 'pointer',
            },
            '& .MuiAutocomplete-option:hover': {
              ...theme.typography.body2M14,
              color: theme.palette.gray[90],
              background: theme.palette.gray[5],
            },
          },
        },
      }}
      slots={{
        listbox: ListBoxComponent,
      }}
      sx={{
        position: 'relative',
        '&.Mui-expanded .MuiInputBase-root': {
          padding: 0,
          borderColor: theme.palette.primary.main,
        },
        '& .MuiInputBase-root': {
          borderRadius: '6px',
          background: theme.palette.common.white,
          padding: '0px !important',
        },
        '& .MuiInputBase-input': {
          ...getSizeStyle,
        },
      }}
    />
  )
}
