import { TextField, TextFieldProps, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import { t } from 'i18next'

const AdminTextField = ({ placeholder = t('입력하세요.'), fullWidth, label, ...props }: TextFieldProps) => (
  <FormControl fullWidth={fullWidth}>
    {label && (
      <Typography marginBottom={1} variant="body3" color="gray.70">
        {label}
      </Typography>
    )}
    <TextField variant="outlined" hiddenLabel placeholder={placeholder} {...props} />
  </FormControl>
)

export default AdminTextField
