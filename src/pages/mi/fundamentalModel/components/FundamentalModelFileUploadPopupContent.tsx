import { Box, Stack, Typography } from '@mui/material'

import xlsIcon from '@/assets/icons/file/xls.svg'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import CancelIcon from '@/components/common/icons/CancelIcon'
import InfoIconSm from '@/components/common/icons/InfoIconSm'
import WarningIconRed from '@/components/common/icons/WarningIconRed'
import MIMaskInput from '@/components/common/input/MIMaskInput'
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
  isUploading?: boolean
  showTitleValidationError: boolean
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onFilesAdd: (files: FileList | File[] | null) => void
  onRemoveFile: (file: File) => void
  onSubmit: () => void
  onCancel: () => void
}

const getUploadFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`

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
      {hasError ? (
        <WarningIconRed width={18} height={18} />
      ) : (
        <Box sx={{ color: 'mari.Primary', display: 'flex', flexShrink: 0 }}>
          <InfoIconSm width={18} height={18} style={{ color: 'inherit' }} />
        </Box>
      )}
      <Typography fontSize="13px" fontWeight={600} lineHeight={1.4} color="contentText.Black" sx={{ minWidth: 0 }}>
        {UPLOAD_FILE_REQUIRED_TITLE}
      </Typography>
    </Stack>
    <Typography variant="body3R12" lineHeight={1.5} color="contentText.Normal">
      {UPLOAD_FILE_REQUIRED_BODY}
    </Typography>
  </Stack>
)

interface UploadTitleFieldProps {
  value: string
  hasError: boolean
  onChange: (value: string) => void
}

const UploadTitleField = ({ value, hasError, onChange }: UploadTitleFieldProps) => (
  <MIMaskInput
    id="fundamental-upload-title"
    label="시뮬레이션 케이스명"
    placeholder="입력하세요"
    value={value}
    onUpdateValue={(nextValue) => onChange(nextValue ?? '')}
    maxLength={FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH}
    required
    error={hasError}
    helperText={hasError ? '필수 입력 항목입니다.' : undefined}
  />
)

interface UploadDescriptionFieldProps {
  value: string
  onChange: (value: string) => void
}

const UploadDescriptionField = ({ value, onChange }: UploadDescriptionFieldProps) => (
  <MIMaskInput
    id="fundamental-upload-description"
    label="설명"
    placeholder="입력하세요"
    value={value}
    onUpdateValue={(nextValue) => onChange(nextValue ?? '')}
    multiline
    rows={5}
    maxLength={FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH}
  />
)

const FundamentalModelFileUploadPopupContent = ({
  titleValue,
  descriptionValue,
  files,
  isUploading = false,
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
  const uploadDisabled = files.length >= FUNDAMENTAL_UPLOAD_MAX_FILES || isUploading
  const submitDisabled = isUploading || !isFileValidationPassed || showTitleValidationError

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
            isUploading={isUploading}
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
                    disabled={isUploading}
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
        <MIBaseButton variant="outlined" disabled={isUploading} onClick={onCancel} sx={{ padding: '0 16px', height: '36px' }}>
          취소
        </MIBaseButton>
        <MIBaseButton variant="contained" disabled={submitDisabled} onClick={onSubmit} sx={{ padding: '0 16px', height: '36px' }}>
          {isUploading ? '업로드 중...' : '확인'}
        </MIBaseButton>
      </Stack>
    </Stack>
  )
}

export default FundamentalModelFileUploadPopupContent
