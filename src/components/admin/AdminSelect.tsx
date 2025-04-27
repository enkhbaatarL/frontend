import { MenuItem, MenuList, Select, SelectProps, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import { MenuListProps } from '@mui/material/MenuList/MenuList'
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

const MenuListComponent = (menuListProps: MenuListProps) => (
  <ScrollWrapper offsetTop={8} maxHeight={268}>
    <MenuList {...menuListProps} />
  </ScrollWrapper>
)

const AdminSelect = ({
  children,
  displayEmpty = true,
  options,
  useAllOption = true,
  fullWidth,
  label,
  placeholder,
  showSelectedValue = true,
  ...props
}: Props) => (
  <FormControl fullWidth={fullWidth}>
    {label && (
      <Typography marginBottom={1} variant="labelText" color="gray.70">
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

        if (selected === '' || (Array.isArray(selected) && selected.length === 0)) {
          if (useAllOption) return t('전체')

          return (
            <Typography
              variant="body2"
              color="gray.40"
              sx={{
                fontStyle: 'normal',
                fontWeight: 400,
              }}
            >
              {placeholder ?? t('선택하세요')}
            </Typography>
          )
        }

        if (Array.isArray(selected)) {
          const selectedLabels = selected.map(
            (item) => options?.find(({ value }) => value === (typeof value === 'number' ? Number(item) : item))?.label ?? item,
          )
          return selectedLabels.join(', ')
        }

        return (
          options?.find(({ value }) => value === (typeof value === 'number' ? Number(selected) : selected))?.label ??
          (selected as ReactNode)
        )
      }}
      MenuProps={{
        MenuListProps: {
          disablePadding: true,
          component: MenuListComponent,
        },
      }}
    >
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
    </Select>
  </FormControl>
)

export default AdminSelect
