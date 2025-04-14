import { MenuItem, Select, SelectProps, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import { t } from 'i18next'
import { ReactNode } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'

interface IAdminSelectOption {
  label: string
  value?: string | number
}

type Props = SelectProps & {
  options?: IAdminSelectOption[]
  useAllOption?: boolean
  placeholder?: string
  showSelectedValue?: boolean
}

const AdminSelect = ({
  children,
  displayEmpty = true,
  options,
  useAllOption = true,
  label,
  placeholder,
  showSelectedValue = true,
  ...props
}: Props) => (
  <FormControl>
    {label && (
      <Typography marginBottom={1} variant="body3" color="gray.70">
        {label}
      </Typography>
    )}
    <Select
      {...props}
      displayEmpty={displayEmpty}
      renderValue={(selected) => {
        if (!showSelectedValue) {
          return (
            <Typography variant="body2" color="gray.40">
              {placeholder ?? t('선택하세요.')}
            </Typography>
          )
        }

        if (selected === '') {
          if (useAllOption) return t('전체')

          return (
            <Typography
              variant="tableBody2"
              sx={{
                color: 'rgba(0, 0, 0, 0.38)',
                fontSize: '14px',
                fontStyle: 'normal',
                fontWeight: 400,
              }}
            >
              {placeholder ?? t('선택하세요.')}
            </Typography>
          )
        }

        return options?.find(({ value }) => value === selected)?.label ?? (selected as ReactNode)
      }}
      MenuProps={{
        MenuListProps: {
          disablePadding: true,
        },
      }}
    >
      <ScrollWrapper offsetTop={8} maxHeight={268}>
        {[
          useAllOption && (
            <MenuItem key="all" value={''}>
              {t('전체')}
            </MenuItem>
          ),
          ...(options
            ? options.map(({ label: optionLabel, value }) => (
              <MenuItem key={String(value)} value={value}>
                {optionLabel}
              </MenuItem>
            ))
            : [children]),
        ]}
      </ScrollWrapper>
    </Select>
  </FormControl>
)

export default AdminSelect
