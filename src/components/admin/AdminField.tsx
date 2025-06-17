import { FormControlLabel, Radio, RadioGroup, type TextFieldProps, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import Switch from '@mui/material/Switch'
import { Dayjs } from 'dayjs'

import AdminUpload, { type FileInfo } from '@/components/admin/AdminUpload'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import MIInput from '@/components/common/input/MIInput'
import MISelect from '@/components/common/select/MISelect'

export type AdminDateRangeType = { startDate?: Dayjs; endDate?: Dayjs }

type AdminTextFieldProps = TextFieldProps & {
  labelSub?: string
  labelVariant?: 'body1' | 'body2' | 'body3' | 'h6' | 'subtitle' | 'sectionTitle'
  labelColor?: string
  fieldType?: 'text' | 'select' | 'radio' | 'checkbox' | 'switch' | 'upload' | 'date-range'
  options?: { value: string; label: string; disabled?: boolean }[]
  value?: string | string[] | boolean | (File | FileInfo)[]
  maxLength?: number
  onChange?: (value: string | string[] | boolean | (File | FileInfo)[] | AdminDateRangeType) => void
  maxSize?: number
  minWidth?: number
  acceptedType?: string[]
  multiple?: boolean
  multiline?: boolean
  defaultFiles?: FileInfo[]
  width?: number | string[]
  labelSw?: string
  showSelectedValue?: boolean
  useAllOption?: boolean
}

const AdminField = ({
  placeholder,
  fullWidth,
  label,
  labelSub,
  labelVariant = 'sectionTitle',
  labelColor = 'gray.90',
  required,
  fieldType = 'text',
  options,
  value = '',
  maxLength,
  onChange,
  maxSize = 20,
  minWidth = 700,
  acceptedType = ['image/jpg', 'image/jpeg', 'image/png'],
  multiple = false,
  multiline = false,
  defaultFiles = [],
  width,
  labelSw,
  disabled,
  showSelectedValue = true,
  useAllOption,
}: AdminTextFieldProps) => (
  <FormControl fullWidth={fullWidth}>
    {label && (
      <Typography marginBottom={labelVariant === 'subtitle' && !labelSub ? 3 : 1} variant={labelVariant} color={labelColor}>
        {label}
        {required && !disabled && (
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

    {fieldType === 'text' && (
      <MIInput
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => {
          const newValue = e.target.value
          if (!maxLength || newValue.length <= maxLength) {
            onChange?.(newValue)
          }
        }}
        multiline={multiline}
      />
    )}

    {fieldType === 'select' && (
      <MISelect
        multiple={multiple}
        disabled={disabled}
        value={value as string}
        fullWidth
        sx={{ width }}
        showValue={showSelectedValue}
        onChange={(e) => onChange?.(e.target.value as string)}
        useAllOption={useAllOption}
        options={options ?? []}
      />
    )}

    {fieldType === 'switch' && (
      <FormControlLabel
        disabled={disabled}
        sx={{ marginRight: 0 }}
        control={
          <Switch
            checked={Boolean(value)}
            onChange={(e) => onChange?.(e.target.checked as boolean)}
            onContextMenu={(e) => {
              e.preventDefault()
              onChange?.(!value)
            }}
          />
        }
        label={labelSw}
      />
    )}

    {fieldType === 'radio' && (
      <RadioGroup row value={value} onChange={(e) => onChange?.(e.target.value)}>
        {options?.map((option) => (
          <FormControlLabel
            disabled={disabled ?? option.disabled}
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
          />
        ))}
      </RadioGroup>
    )}
    {fieldType === 'upload' && !disabled && (
      <AdminUpload
        disabled={disabled}
        required={required}
        maxSize={maxSize}
        minWidth={minWidth}
        acceptedTypes={acceptedType}
        multiple={multiple}
        defaultFiles={defaultFiles}
        onUploadAction={(file: File) => onChange?.([file])}
        draggable
      />
    )}
    {fieldType === 'date-range' && (
      <MIDateRangePicker
        disabled={disabled}
        startDate={Array.isArray(value) ? (value[0] as string) : undefined}
        endDate={Array.isArray(value) ? (value[1] as string) : undefined}
        onChange={onChange}
      />
    )}
  </FormControl>
)

export default AdminField
