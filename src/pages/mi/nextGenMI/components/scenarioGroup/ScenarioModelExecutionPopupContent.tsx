import { Box, Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

import xlsIcon from '@/assets/icons/file/xls.svg'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import CancelIcon from '@/components/common/icons/CancelIcon'
import InfoIconSm from '@/components/common/icons/InfoIconSm'
import WarningIconRed from '@/components/common/icons/WarningIconRed'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import MIFileUploadDropzone from '@/components/mi/MIFileUploadDropzone'
import {
  FUNDAMENTAL_UPLOAD_ACCEPT,
  FUNDAMENTAL_UPLOAD_GUIDE_TEXT,
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB,
  FUNDAMENTAL_UPLOAD_MAX_FILES,
  UPLOAD_FILE_REQUIRED_BODY,
  UPLOAD_FILE_REQUIRED_TITLE,
  hasRequiredFundamentalModelFiles,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'

export interface ScenarioModelExecutionOption {
  scenarioId: number
  scenarioName: string
  executed: boolean
  disabled: boolean
  badgeLabel?: string
}

interface ScenarioModelExecutionPopupContentProps {
  scenarioOptions: ScenarioModelExecutionOption[]
  selectedScenarioId: number | null
  onSelectScenario: (scenarioId: number) => void
  files: File[]
  isSubmitting: boolean
  onFilesAdd: (files: FileList | File[] | null) => void
  onRemoveFile: (file: File) => void
  onSubmit: () => void
  onCancel: () => void
}

const getUploadFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`

const UploadGuideNotice = ({ hasError }: { hasError: boolean }) => (
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

const ScenarioOptionBadge = ({ label, disabled }: { label: string; disabled: boolean }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
    padding="4px 6px"
    borderRadius="8px"
    border={disabled ? '1px solid' : 'none'}
    bgcolor={disabled ? 'gray.5' : 'gray.20'}
    borderColor={disabled ? 'contentBorder.Normal' : undefined}
  >
    <Typography
      sx={{
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: 1.4,
        color: disabled ? 'contentText.Disabled' : 'contentText.Normal',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Typography>
  </Stack>
)

const ScenarioModelExecutionPopupContent = ({
  scenarioOptions,
  selectedScenarioId,
  onSelectScenario,
  files,
  isSubmitting,
  onFilesAdd,
  onRemoveFile,
  onSubmit,
  onCancel,
}: ScenarioModelExecutionPopupContentProps) => {
  const submitDisabled = isSubmitting || !hasRequiredFundamentalModelFiles(files) || selectedScenarioId === null
  const uploadDisabled = files.length >= FUNDAMENTAL_UPLOAD_MAX_FILES || isSubmitting
  const showFileError = files.length >= FUNDAMENTAL_UPLOAD_MAX_FILES && !hasRequiredFundamentalModelFiles(files)

  const selectWrapperRef = useRef<HTMLDivElement>(null)
  const [selectWidth, setSelectWidth] = useState<number>()

  useEffect(() => {
    const element = selectWrapperRef.current
    if (!element) return undefined
    const update = () => setSelectWidth(element.getBoundingClientRect().width)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const scenarioItems: SelectMenuItem<number>[] = scenarioOptions.map((option) => ({
    value: option.scenarioId,
    disabled: option.disabled,
    label: option.scenarioName,
    suffix: option.badgeLabel ? <ScenarioOptionBadge label={option.badgeLabel} disabled={option.disabled} /> : undefined,
  }))

  return (
    <Stack sx={{ width: '100%' }}>
      <Stack gap="20px" sx={{ width: '100%' }}>
        <Box px="20px">
          <UploadGuideNotice hasError={showFileError} />
        </Box>

        <Stack gap="4px" px="20px">
          <Typography variant="body2SB14" color="contentText.Normal">
            시나리오
          </Typography>
          <Box ref={selectWrapperRef} width="100%">
            <MISelectMenu<number>
              variant="outlined"
              selectionIconPosition="left"
              selected={selectedScenarioId ?? -1}
              onSelected={onSelectScenario}
              items={scenarioItems}
              placeholder="시나리오를 선택해 주세요"
              showSelectedSuffix
              disabled={isSubmitting}
              zIndex={1301}
              paperProps={selectWidth ? { sx: { width: `${selectWidth}px` } } : undefined}
              sx={{ width: '100%', height: '36px', borderRadius: '8px', justifyContent: 'space-between' }}
            />
          </Box>
        </Stack>

        <Stack gap="20px" px="20px">
          {files.length < FUNDAMENTAL_UPLOAD_MAX_FILES && (
            <MIFileUploadDropzone
              accept={FUNDAMENTAL_UPLOAD_ACCEPT}
              disabled={uploadDisabled}
              guideText={FUNDAMENTAL_UPLOAD_GUIDE_TEXT}
              isUploading={isSubmitting}
              maxFileSizeMb={FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB}
              onFilesAdd={onFilesAdd}
            />
          )}

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
                    disabled={isSubmitting}
                    disableRipple
                    buttonHoverBgColor="transparent"
                    sx={{ padding: 0, height: '20px', minWidth: '0px' }}
                  >
                    <CancelIcon width={20} height={20} />
                  </MIBaseButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" gap="8px" padding="20px">
        <MIBaseButton
          variant="outlined"
          disabled={isSubmitting}
          onClick={onCancel}
          sx={{ padding: '0 10px', height: '36px', borderRadius: '8px' }}
        >
          취소
        </MIBaseButton>
        <MIBaseButton
          variant="contained"
          disabled={submitDisabled}
          onClick={onSubmit}
          sx={{ padding: '0 10px', height: '36px', borderRadius: '8px' }}
        >
          MI 수급모델 실행
        </MIBaseButton>
      </Stack>
    </Stack>
  )
}

export default ScenarioModelExecutionPopupContent
