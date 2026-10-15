import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { Box, Stack, Typography, type SxProps, type Theme } from '@mui/material'
import { type ChangeEvent, type DragEvent, useCallback, useMemo, useRef, useState } from 'react'

import LoadingSpinner from '@/components/common/influence-factor-chart/icons/LoadingSpinIcon'

type UploadDropzoneVisualState = 'default' | 'hoverDrag' | 'uploading' | 'disabled'

export interface MIFileUploadDropzoneProps {
  accept: string
  disabled?: boolean
  guideText?: string
  isUploading?: boolean
  maxFileSizeMb: number
  onFilesAdd: (files: FileList | File[] | null) => void
  sx?: SxProps<Theme>
}

const getUploadDropzoneStyle = (state: UploadDropzoneVisualState) => {
  if (state === 'disabled') {
    return {
      bgcolor: 'contentBG.Disabled',
      borderColor: 'contentBorder.Hover',
      borderStyle: 'dashed',
      iconColor: 'contentText.Disabled',
      mainTextColor: 'contentText.Disabled',
      helperTextColor: 'contentText.Disabled',
    }
  }

  if (state === 'hoverDrag') {
    return {
      bgcolor: 'contentBG.Hover',
      borderColor: 'contentBorder.Hover',
      borderStyle: 'dashed',
      iconColor: 'gray.60',
      mainTextColor: 'contentText.Normal',
      helperTextColor: 'gray.50',
    }
  }

  return {
    bgcolor: 'commonColor.White',
    borderColor: 'contentBorder.Normal',
    borderStyle: 'solid',
    iconColor: 'gray.60',
    mainTextColor: 'contentText.Normal',
    helperTextColor: 'gray.50',
  }
}

const MIFileUploadDropzone = ({
  accept,
  disabled = false,
  guideText,
  isUploading = false,
  maxFileSizeMb,
  onFilesAdd,
  sx,
}: MIFileUploadDropzoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const isInteractionDisabled = disabled || isUploading

  const visualState = useMemo<UploadDropzoneVisualState>(() => {
    if (disabled) return 'disabled'
    if (isUploading) return 'uploading'
    if (isDragging) return 'hoverDrag'
    return 'default'
  }, [disabled, isDragging, isUploading])

  const visualStyle = getUploadDropzoneStyle(visualState)

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onFilesAdd(event.target.files)
      event.target.value = ''
    },
    [onFilesAdd],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault()
      setIsDragging(false)
      if (isInteractionDisabled) return
      onFilesAdd(event.dataTransfer.files)
    },
    [isInteractionDisabled, onFilesAdd],
  )

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault()
      if (!isInteractionDisabled) setIsDragging(true)
    },
    [isInteractionDisabled],
  )

  const handleDragLeave = useCallback((event: DragEvent<HTMLButtonElement>) => {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return
    setIsDragging(false)
  }, [])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept={accept}
        disabled={isInteractionDisabled}
        onChange={handleFileInputChange}
      />
      <Box
        component="button"
        type="button"
        disabled={isInteractionDisabled}
        aria-busy={isUploading}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={[
          {
            width: '100%',
            position: 'relative',
            minHeight: 106,
            p: '20px',
            borderWidth: '1px',
            borderStyle: visualStyle.borderStyle,
            borderColor: visualStyle.borderColor,
            borderRadius: '4px',
            bgcolor: visualStyle.bgcolor,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: visualStyle.iconColor,
            cursor: isInteractionDisabled ? 'default' : 'pointer',
            appearance: 'none',
            transition: 'background-color 0.15s ease, border-color 0.15s ease',
            '&:hover:not(:disabled)': {
              bgcolor: 'contentBG.Hover',
              borderColor: 'contentBorder.Hover',
              borderStyle: 'dashed',
            },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'contentBorder.Active',
              outlineOffset: '2px',
            },
          },
          ...(sx === undefined ? [] : Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Stack width="100%" alignItems="center" gap="10px" visibility={isUploading ? 'hidden' : 'visible'} aria-hidden={isUploading}>
          <UploadFileRoundedIcon width={24} height={24} />
          <Stack gap="4px" alignItems="center" justifyContent="center" sx={{ width: '100%', minWidth: 0 }}>
            <Typography
              variant="body3R12"
              color={visualStyle.mainTextColor}
              textAlign="center"
              sx={{ width: '100%', lineHeight: 'normal', wordBreak: 'break-word' }}
            >
              파일을 드래그하여 업로드하거나 클릭하여 파일을 첨부하세요.
            </Typography>
            <Typography
              variant="body3R12"
              color={visualStyle.helperTextColor}
              textAlign="center"
              sx={{ width: '100%', lineHeight: 'normal', wordBreak: 'break-word' }}
            >
              {guideText ?? `(최대 ${maxFileSizeMb}MB)`}
            </Typography>
          </Stack>
        </Stack>
        {isUploading && (
          <Stack
            position="absolute"
            top="0px"
            right="0px"
            bottom="0px"
            left="0px"
            alignItems="center"
            justifyContent="center"
            gap="10px"
            role="status"
          >
            <LoadingSpinner size={24} color="rgba(31, 42, 68, 0.4)" speed={1.2} />
            <Typography variant="body3R12" color={visualStyle.mainTextColor} textAlign="center" lineHeight="normal">
              파일 업로드 중...
            </Typography>
          </Stack>
        )}
      </Box>
    </>
  )
}

export default MIFileUploadDropzone
