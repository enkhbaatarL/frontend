import { TextField, TextFieldProps } from '@mui/material'
import { t } from 'i18next'

const AdminTextField = ({ placeholder, ...props }: TextFieldProps) => <TextField placeholder={placeholder ?? t('입력하세요.')} {...props} />

export default AdminTextField
