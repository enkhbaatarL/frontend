import { MenuItem, Select, SelectProps, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import { t } from 'i18next'

interface IAdminSelectOption {
  label: string
  value?: string | number
}

type Props = SelectProps & {
  options?: IAdminSelectOption[]
  useAllOption?: boolean
}

const AdminSelect = ({ children, displayEmpty = true, options, useAllOption = true, label, ...props }: Props) => (
  <FormControl>
    {label && (
      <Typography marginBottom={1} variant="body3" color="gray.70">
        {label}
      </Typography>
    )}
    <Select {...props} displayEmpty={displayEmpty}>
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
