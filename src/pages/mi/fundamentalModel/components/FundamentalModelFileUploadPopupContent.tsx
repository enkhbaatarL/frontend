import { Box, Stack, Typography } from '@mui/material'
import { type ChangeEvent } from 'react'

import xlsIcon from '@/assets/icons/file/xls.svg'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIButton from '@/components/common/button/MIButton'
import CancelIcon from '@/components/common/icons/CancelIcon'
import InfoIconSm from '@/components/common/icons/InfoIconSm'
import WarningIconRed from '@/components/common/icons/WarningIconRed'
import MIFileUploadDropzone from '@/components/mi/MIFileUploadDropzone'
import {
  FUNDAMENTAL_UPLOAD_ACCEPT,
  FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH,
  FUNDAMENTAL_UPLOAD_GUIDE_TEXT,
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB,
  FUNDAMENTAL_UPLOAD_MAX_FILES,
  FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH,
  UPLOAD_FILE_REQUIRED_BODY,
  UPLOAD_FILE_REQUIRED_TITLE,
  hasRequiredFundamentalModelFiles,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'

interface FundamentalModelFileUploadPopupContentProps {
  titleValue: string
  descriptionValue: string
  files: File[]
  showTitleValidationError: boolean
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onFilesAdd: (files: FileList | File[] | null) => void
  onRemoveFile: (file: File) => void
  onSubmit: () => void
  onCancel: () => void
}

const getUploadFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`
const characterCountFormatter = new Intl.NumberFormat('en-US')

const formatCharacterCount = (value: string, maxLength: number) =>
  `${characterCountFormatter.format(value.length)} / ${characterCountFormatter.format(maxLength)}`

interface UploadGuideNoticeProps {
  hasError: boolean
}

const UploadGuideNotice = ({ hasError }: UploadGuideNoticeProps) => (
  <Stack
    sx={{
      width: '100%',
      borderRadius: '8px',
      bgcolor: hasError ? 'rgba(240, 62, 62, 0.1)' : 'gray.5',
      px: '16px',
      py: '10px',
      boxSizing: 'border-box',
      gap: '4px',
    }}
  >
    <Stack direction="row" alignItems="flex-start" gap="8px" sx={{ width: '100%', minWidth: 0 }}>
      {hasError ? <WarningIconRed width={18} height={18} /> : <InfoIconSm width={18} height={18} />}
      <Typography fontSize="13px" fontWeight={600} lineHeight={1.4} color="contentText.Black" sx={{ minWidth: 0 }}>
        {UPLOAD_FILE_REQUIRED_TITLE}
      </Typography>
    </Stack>
    <Typography variant="body3R12" lineHeight={1.5} color="contentText.Normal">
      {UPLOAD_FILE_REQUIRED_BODY}
    </Typography>
  </Stack>
)

interface UploadFieldLabelProps {
  htmlFor: string
  label: string
  required?: boolean
  size?: 'lg' | 'sm'
}

const UploadFieldLabel = ({ htmlFor, label, required = false, size = 'sm' }: UploadFieldLabelProps) => (
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
    {required && (
      <Box component="span" sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'point.red1', alignSelf: 'flex-start', mt: '3px' }} />
    )}
  </Box>
)

interface UploadTitleFieldProps {
  value: string
  hasError: boolean
  onChange: (value: string) => void
}

const UploadTitleField = ({ value, hasError, onChange }: UploadTitleFieldProps) => (
  <Stack sx={{ width: '100%', minWidth: 0 }}>
    <UploadFieldLabel htmlFor="fundamental-upload-title" label="시뮬레이션 케이스 케이스명" required size="lg" />
    <Box
      id="fundamental-upload-title"
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
        borderRadius: hasError ? '4px' : '10px',
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
        {hasError ? '필수 입력 항목입니다.' : formatCharacterCount(value, FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH)}
      </Typography>
    </Box>
  </Stack>
)

interface UploadDescriptionFieldProps {
  value: string
  onChange: (value: string) => void
}

const UploadDescriptionField = ({ value, onChange }: UploadDescriptionFieldProps) => (
  <Stack sx={{ width: '100%', minWidth: 0 }}>
    <UploadFieldLabel htmlFor="fundamental-upload-description" label="설명" />
    <Box
      id="fundamental-upload-description"
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

const FundamentalModelFileUploadPopupContent = ({
  titleValue,
  descriptionValue,
  files,
  showTitleValidationError,
  onTitleChange,
  onDescriptionChange,
  onFilesAdd,
  onRemoveFile,
  onSubmit,
  onCancel,
}: FundamentalModelFileUploadPopupContentProps) => {
  const isFileValidationPassed = hasRequiredFundamentalModelFiles(files)
  const showFileValidationError = files.length >= FUNDAMENTAL_UPLOAD_MAX_FILES && !isFileValidationPassed
  const uploadDisabled = files.length >= FUNDAMENTAL_UPLOAD_MAX_FILES
  const submitDisabled = !isFileValidationPassed || showTitleValidationError

  return (
    <Stack sx={{ width: '100%' }}>
      <Stack gap="20px" sx={{ width: '100%' }}>
        <Box px="20px">
          <UploadGuideNotice hasError={showFileValidationError} />
        </Box>

        <Stack gap="20px" px="20px">
          <UploadTitleField value={titleValue} hasError={showTitleValidationError} onChange={onTitleChange} />
          <UploadDescriptionField value={descriptionValue} onChange={onDescriptionChange} />
        </Stack>

        <Stack gap="20px" px="20px">
          <MIFileUploadDropzone
            accept={FUNDAMENTAL_UPLOAD_ACCEPT}
            disabled={uploadDisabled}
            guideText={FUNDAMENTAL_UPLOAD_GUIDE_TEXT}
            maxFileSizeMb={FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB}
            onFilesAdd={onFilesAdd}
          />

          {files.length > 0 && (
            <Stack gap="8px">
              {files.map((file) => (
                <Stack
                  key={getUploadFileKey(file)}
                  direction="row"
                  alignItems="center"
                  gap="8px"
                  sx={{
                    width: '100%',
                    minHeight: 34,
                    border: '1px solid',
                    borderColor: 'contentBorder.Disabled',
                    borderRadius: '6px',
                    px: '12px',
                    py: '7px',
                    boxSizing: 'border-box',
                  }}
                >
                  <Box
                    component="img"
                    src={xlsIcon}
                    alt=""
                    sx={{ width: 20, height: 20, flexShrink: 0, display: 'block' }}
                    draggable={false}
                  />
                  <Typography variant="body2R14" color="contentText.Normal" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {file.name}
                  </Typography>
                  <MIBaseButton
                    onClick={() => onRemoveFile(file)}
                    disableRipple
                    buttonHoverBgColor="transparent"
                    sx={{
                      padding: 0,
                      height: '20px',
                      minWidth: '0px',
                    }}
                  >
                    <CancelIcon width={20} height={20} />
                  </MIBaseButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" gap="10px" px="20px" pt="30px" pb="20px">
        <MIButton type="outlined" size="h34" color="gray" onClick={onCancel}>
          취소
        </MIButton>
        <MIButton type="filled" size="h34" color="primary" disabled={submitDisabled} onClick={onSubmit}>
          확인
        </MIButton>
      </Stack>
    </Stack>
  )
}

export default FundamentalModelFileUploadPopupContent
