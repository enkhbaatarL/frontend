import { MenuItem, Select, SelectProps } from '@mui/material'
import { t } from 'i18next'

interface IAdminSelectOption {
  label: string
  value?: string | number
}

type Props = SelectProps & {
  options?: IAdminSelectOption[]
  useAllOption?: boolean
}

const AdminSelect = ({ children, displayEmpty = true, options, useAllOption = true, ...props }: Props) => (
  <Select {...props} displayEmpty={displayEmpty}>
    {[
      useAllOption && (
        <MenuItem key="all" value={''}>
          {t('전체')}
        </MenuItem>
      ),
      ...(options
        ? options.map(({ label, value }) => (
          <MenuItem key={String(value)} value={value}>
            {label}
          </MenuItem>
        ))
        : [children]),
    ]}
  </Select>
)

export default AdminSelect
