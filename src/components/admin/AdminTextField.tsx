import { TextField, TextFieldProps } from '@mui/material'
import { t } from 'i18next'

const AdminTextField = ({ placeholder, ...props }: TextFieldProps) => {
  if (placeholder === undefined) {
    placeholder = t('입력하세요.')
  }

  return <TextField placeholder={placeholder} {...props} />
}

export default AdminTextField
