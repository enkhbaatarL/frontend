import { Box, Stack, Typography } from '@mui/material'
import { type ChangeEvent } from 'react'

import MIButton from '@/components/common/button/MIButton'
import {
  FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH,
  FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'

interface FundamentalModelCaseEditPopupContentProps {
  titleValue: string
  descriptionValue: string
  showTitleDuplicateError: boolean
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

const characterCountFormatter = new Intl.NumberFormat('en-US')

const formatCharacterCount = (value: string, maxLength: number) =>
  `${characterCountFormatter.format(value.length)} / ${characterCountFormatter.format(maxLength)}`

interface EditFieldLabelProps {
  htmlFor: string
  label: string
  size?: 'lg' | 'sm'
}

const EditFieldLabel = ({ htmlFor, label, size = 'sm' }: EditFieldLabelProps) => (
  <Box component="label" htmlFor={htmlFor} display="inline-flex" alignItems="center" gap="2px" pb={size === 'lg' ? '4px' : '6px'}>
    <Typography
      component="span"
      color="contentText.Normal"
      sx={{
        fontSize: size === 'lg' ? '14px' : '12px',
        fontWeight: size === 'lg' ? 600 : 500,
        lineHeight: size === 'lg' ? 1.4 : 1,
      }}
    >
      {label}
    </Typography>
  </Box>
)

interface EditTitleFieldProps {
  value: string
  hasError: boolean
  onChange: (value: string) => void
}

const EditTitleField = ({ value, hasError, onChange }: EditTitleFieldProps) => (
  <Stack sx={{ width: '100%', minWidth: 0 }}>
    <EditFieldLabel htmlFor="fundamental-edit-title" label="시뮬레이션 케이스 케이스명" size="lg" />
    <Box
      id="fundamental-edit-title"
      component="input"
      value={value}
      maxLength={FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH}
      placeholder="입력하세요"
      aria-invalid={hasError}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      sx={{
        width: '100%',
        height: 36,
        border: '1px solid',
        borderColor: hasError ? 'point.red1' : 'contentBorder.Normal',
        borderRadius: '4px',
        bgcolor: 'commonColor.White',
        boxSizing: 'border-box',
        color: 'contentText.Black',
        display: 'block',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.4,
        outline: 'none',
        px: '12px',
        py: '8px',
        transition: 'border-color 0.15s ease',
        '&::placeholder': {
          color: 'contentText.Placeholder',
          opacity: 1,
        },
        '&:focus': {
          borderColor: hasError ? 'point.red1' : 'contentBorder.Active',
        },
      }}
    />
    <Box display="flex" justifyContent={hasError ? 'flex-start' : 'flex-end'} width="100%" pt="4px" minHeight="21px">
      <Typography variant="subtext2" color={hasError ? 'point.red1' : 'contentText.Subtext'}>
        {hasError ? '동일한 제목으로 수정할 수 없습니다.' : formatCharacterCount(value, FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH)}
      </Typography>
    </Box>
  </Stack>
)

interface EditDescriptionFieldProps {
  value: string
  onChange: (value: string) => void
}

const EditDescriptionField = ({ value, onChange }: EditDescriptionFieldProps) => (
  <Stack sx={{ width: '100%', minWidth: 0 }}>
    <EditFieldLabel htmlFor="fundamental-edit-description" label="설명" />
    <Box
      id="fundamental-edit-description"
      component="textarea"
      value={value}
      maxLength={FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH}
      placeholder="입력하세요"
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      sx={{
        width: '100%',
        height: 100,
        minHeight: 100,
        maxHeight: 100,
        border: '1px solid',
        borderColor: 'contentBorder.Normal',
        borderRadius: '4px',
        bgcolor: 'commonColor.White',
        boxSizing: 'border-box',
        color: 'contentText.Black',
        display: 'block',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.4,
        outline: 'none',
        overflowY: 'auto',
        px: '12px',
        py: '7px',
        resize: 'none',
        transition: 'border-color 0.15s ease',
        '&::placeholder': {
          color: 'contentText.Placeholder',
          opacity: 1,
        },
        '&:focus': {
          borderColor: 'contentBorder.Active',
        },
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#CED4DA',
          borderRadius: '10px',
        },
      }}
    />
    <Box display="flex" justifyContent="flex-end" width="100%" pt="4px" minHeight="21px">
      <Typography variant="subtext2" color="contentText.Subtext">
        {formatCharacterCount(value, FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH)}
      </Typography>
    </Box>
  </Stack>
)

const FundamentalModelCaseEditPopupContent = ({
  titleValue,
  descriptionValue,
  showTitleDuplicateError,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
}: FundamentalModelCaseEditPopupContentProps) => (
  <Stack sx={{ width: '100%' }}>
    <Stack gap="20px" px="20px">
      <EditTitleField value={titleValue} hasError={showTitleDuplicateError} onChange={onTitleChange} />
      <EditDescriptionField value={descriptionValue} onChange={onDescriptionChange} />
    </Stack>

    <Stack direction="row" justifyContent="flex-end" gap="10px" px="20px" pt="30px" pb="20px">
      <MIButton type="outlined" size="h34" color="gray" onClick={onCancel}>
          취소
      </MIButton>
      <MIButton type="filled" size="h34" color="primary" onClick={onSubmit}>
          확인
      </MIButton>
    </Stack>
  </Stack>
)

export default FundamentalModelCaseEditPopupContent
