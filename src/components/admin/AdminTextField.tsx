import { TextField, TextFieldProps, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import { t } from 'i18next'

type AdminTextFieldProps = TextFieldProps & {
  labelSub?: string
  labelVariant?: 'body1' | 'body2' | 'body3' | 'h6' | 'subtitle' | 'labelText'
  labelColor?: string
}

const AdminTextField = ({
  placeholder,
  fullWidth,
  label,
  labelSub,
  labelVariant = 'labelText',
  labelColor = 'gray.70',
  required,
  ...props
}: AdminTextFieldProps) => (
  <FormControl fullWidth={fullWidth}>
    {label && (
      <Typography
        marginBottom={labelVariant === 'subtitle' && !labelSub ? 3 : 1}
        variant={labelVariant}
        color={labelColor}
        sx={{ marginBottom: '6px' }}
      >
        {label}
        {required && (
          <Typography marginLeft="4px" sx={{ verticalAlign: 4, fontSize: 12, fontWeight: 900 }} component="span" color="error">
            *
          </Typography>
        )}
      </Typography>
    )}
    {labelSub && (
      <Typography variant="subtext2" color="gray.60" marginBottom={3}>
        {labelSub}
      </Typography>
    )}
    <TextField
      variant="outlined"
      hiddenLabel
      placeholder={placeholder ?? t('입력하세요')}
      {...props}
      value={'value' in props ? (props.value ?? '') : undefined}
    />
  </FormControl>
)

export default AdminTextField
