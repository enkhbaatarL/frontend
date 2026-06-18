import { InputBase, Stack, SxProps, Theme, Typography } from '@mui/material'
import { type ChangeEvent, type KeyboardEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'

export type NextGenMIInlineEditableInputMode = 'trigger' | 'input' | 'display'
type NextGenMIInlineEditableInputIdleMode = Exclude<NextGenMIInlineEditableInputMode, 'input'>

export interface NextGenMIInlineEditableInputProps {
  mode?: NextGenMIInlineEditableInputMode
  value?: string
  placeholder?: string
  prefix?: ReactNode
  modePrefix?: Partial<Record<NextGenMIInlineEditableInputMode, ReactNode>>
  suffix?: ReactNode
  width?: string
  height?: string
  padding?: string
  inputWidth?: string
  emptyMode?: NextGenMIInlineEditableInputIdleMode
  selected?: boolean
  disabled?: boolean
  autoFocus?: boolean
  showSaveButton?: boolean
  showEditButton?: boolean
  editOnClick?: boolean
  editButtonVisibleOnHover?: boolean
  saveLabel?: string
  editLabel?: string
  saveDisabled?: boolean
  commitOnBlur?: boolean
  commitOnEnter?: boolean
  resetOnBlur?: boolean
  trimOnSave?: boolean
  triggerLabel?: string
  displayColor?: string
  displayButtonBgColor?: string
  displayButtonHoverBgColor?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur?: () => void
  onClick?: () => void
  onEditClick?: () => void
  onCommit?: (value: string) => void
  onSaveClick?: () => void
  onEnter?: () => void
  sx?: SxProps<Theme>
  inputSx?: SxProps<Theme>
}

const actionButtonSx = {
  height: '26px',
  padding: '2px 8px',
  borderRadius: '6px',
  fontWeight: 500,
  flexShrink: 0,
}

const renderSuffix = (suffix?: ReactNode, marginLeft = '4px') =>
  suffix ? (
    <Stack component="span" direction="row" alignItems="center" flexShrink={0} ml={marginLeft}>
      {suffix}
    </Stack>
  ) : null

const getIdleMode = (value: string, emptyMode: NextGenMIInlineEditableInputIdleMode): NextGenMIInlineEditableInputIdleMode =>
  value.trim().length > 0 ? 'display' : emptyMode

const NextGenMIInlineEditableInput = ({
  mode,
  value = '',
  placeholder,
  prefix,
  modePrefix,
  suffix,
  width = '100%',
  height = '36px',
  padding,
  inputWidth,
  emptyMode = 'display',
  selected = false,
  disabled = false,
  autoFocus = false,
  showSaveButton = false,
  showEditButton = false,
  editOnClick = false,
  editButtonVisibleOnHover = true,
  saveLabel = '저장',
  editLabel = '수정',
  saveDisabled,
  commitOnBlur = false,
  commitOnEnter = false,
  resetOnBlur = false,
  trimOnSave = false,
  triggerLabel,
  displayColor = 'contentText.Black',
  displayButtonBgColor,
  displayButtonHoverBgColor = 'contentBG.Hover',
  onChange,
  onBlur,
  onClick,
  onEditClick,
  onCommit,
  onSaveClick,
  onEnter,
  sx,
  inputSx,
}: NextGenMIInlineEditableInputProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const skipNextBlurCommitRef = useRef(false)
  const isModeControlled = mode !== undefined
  const [internalMode, setInternalMode] = useState<NextGenMIInlineEditableInputMode>(() => getIdleMode(value, emptyMode))
  const [draftValue, setDraftValue] = useState(value)
  const editInitialValueRef = useRef(value)
  const resolvedMode = mode ?? internalMode
  const resolvedValue = isModeControlled ? value : draftValue
  const resolvedPrefix = modePrefix?.[resolvedMode] ?? prefix
  const hasDisplayValue = resolvedValue.trim().length > 0
  const nextSaveValue = trimOnSave ? draftValue.trim() : draftValue
  const resolvedSaveDisabled = saveDisabled ?? (!isModeControlled && nextSaveValue.trim().length === 0)
  const resolvedPadding =
    padding ??
    `8px ${
      (resolvedMode === 'input' && showSaveButton) || (resolvedMode === 'display' && showEditButton) ? '4px' : suffix ? '8px' : '12px'
    } 8px ${resolvedPrefix ? '8px' : '12px'}`

  useEffect(() => {
    if (isModeControlled) return
    setDraftValue(value)
    editInitialValueRef.current = value
    setInternalMode(getIdleMode(value, emptyMode))
  }, [emptyMode, isModeControlled, value])

  useEffect(() => {
    if (!disabled || isModeControlled) return

    setDraftValue(value)
    editInitialValueRef.current = value
    setInternalMode(getIdleMode(value, emptyMode))
  }, [disabled, emptyMode, isModeControlled, value])

  useLayoutEffect(() => {
    if (resolvedMode !== 'input' || !autoFocus) return
    const input = inputRef.current
    if (!input) return

    input.focus({ preventScroll: true })
    const caretPosition = input.value.length
    input.setSelectionRange(caretPosition, caretPosition)
    input.scrollLeft = input.scrollWidth
  }, [autoFocus, resolvedMode])

  const handleEditStart = () => {
    if (disabled) return

    skipNextBlurCommitRef.current = false

    if (isModeControlled) {
      onEditClick?.()
      return
    }

    editInitialValueRef.current = resolvedValue
    setDraftValue(resolvedValue)
    setInternalMode('input')
    onEditClick?.()
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return

    if (!isModeControlled) setDraftValue(event.target.value)
    onChange?.(event)
  }

  const commitInternalValue = () => {
    if (disabled) return

    editInitialValueRef.current = nextSaveValue
    setDraftValue(nextSaveValue)
    setInternalMode(getIdleMode(nextSaveValue, emptyMode))
    onCommit?.(nextSaveValue)
  }

  const handleInputBlur = () => {
    if (!isModeControlled) {
      if (skipNextBlurCommitRef.current) {
        skipNextBlurCommitRef.current = false
      } else if (commitOnBlur) {
        commitInternalValue()
      } else if (resetOnBlur) {
        const initialValue = editInitialValueRef.current
        setDraftValue(initialValue)
        setInternalMode(getIdleMode(initialValue, emptyMode))
      }
    }
    onBlur?.()
  }

  const handleSave = () => {
    if (disabled) return

    if (isModeControlled) {
      onSaveClick?.()
      return
    }

    if (resolvedSaveDisabled) return

    commitInternalValue()
    onSaveClick?.()
  }

  const handleDisplayClick = () => {
    if (disabled) return

    if (!isModeControlled && editOnClick) {
      handleEditStart()
      return
    }

    onClick?.()
  }

  if (resolvedMode === 'trigger') {
    return (
      <MIBaseButton
        variant="outlined"
        prefix={resolvedPrefix}
        suffix={suffix}
        onMouseDown={(event) => event.preventDefault()}
        disabled={disabled}
        onClick={isModeControlled ? onClick : handleEditStart}
        labelColor="contentText.Placeholder"
        labelTextAlign="left"
        sx={[
          {
            alignSelf: 'center',
            width,
            height,
            padding: resolvedPadding,
            borderRadius: '8px',
            justifyContent: 'flex-start',
            '&:hover:not(:disabled)': {
              backgroundColor: 'contentBG.Hover',
              borderColor: 'contentBorder.Hover',
              '& .MuiTypography-root, & svg': {
                color: 'contentText.Normal',
              },
            },
            '& > span, & > span > span': {
              justifyContent: 'flex-start',
            },
          },
          ...(sx === undefined ? [] : Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {triggerLabel ?? placeholder ?? ''}
      </MIBaseButton>
    )
  }

  if (resolvedMode === 'display') {
    return (
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        alignSelf="center"
        width={width}
        minWidth={0}
        height={height}
        padding={resolvedPadding}
        border="1px solid"
        borderColor="transparent"
        borderRadius="8px"
        bgcolor={displayButtonBgColor ?? (selected ? 'contentBG.PrimaryFade' : 'commonColor.White')}
        boxSizing="border-box"
        sx={[
          {
            cursor: disabled ? 'default' : onClick || editOnClick ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease-in-out, color 0.15s ease-in-out, border-color 0.4s ease-in-out',
            ...(!disabled && {
              '&:hover': {
                backgroundColor: displayButtonHoverBgColor,
                borderColor: 'contentBorder.Hover',
                '& [data-next-gen-mi-inline-editable-input-edit]': {
                  opacity: 1,
                },
              },
            }),
            '& .MuiTypography-root, & svg': {
              transition: 'color 0.15s ease-in-out',
            },
            '& svg path': {
              transition: 'fill 0.15s ease-in-out',
            },
          },
          ...(sx === undefined ? [] : Array.isArray(sx) ? sx : [sx]),
        ]}
        onClick={disabled ? undefined : handleDisplayClick}
      >
        <Stack direction="row" alignItems="center" gap="4px" flex="1 1 0" minWidth={0} overflow="hidden">
          {resolvedPrefix}
          <Typography
            variant="body2M14"
            color={hasDisplayValue ? displayColor : 'contentText.Placeholder'}
            flex={1}
            minWidth={0}
            overflow="hidden"
            textOverflow="ellipsis"
            noWrap
          >
            {hasDisplayValue ? resolvedValue : (placeholder ?? '')}
          </Typography>
        </Stack>
        {renderSuffix(suffix)}
        {showEditButton && (
          <MIBaseButton
            data-next-gen-mi-inline-editable-input-edit
            variant="contained"
            disabled={disabled}
            onClick={(event) => {
              if (disabled) return

              event.stopPropagation()
              handleEditStart()
            }}
            sx={{
              ...actionButtonSx,
              opacity: editButtonVisibleOnHover ? 0 : 1,
              backgroundColor: 'contentIcon.Activeb',
              '&:hover:not(:disabled)': {
                backgroundColor: 'contentIcon.Activeb',
              },
            }}
          >
            {editLabel}
          </MIBaseButton>
        )}
      </Stack>
    )
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      alignSelf="center"
      width={width}
      height={height}
      padding={resolvedPadding}
      border="1px solid"
      borderColor="contentBorder.Active"
      borderRadius="8px"
      bgcolor="gray.5"
      boxSizing="border-box"
      minWidth={0}
      sx={sx}
    >
      <Stack direction="row" alignItems="center" gap="4px" minWidth={0} flex={1} overflow="hidden">
        {resolvedPrefix}
        <InputBase
          inputRef={inputRef}
          disabled={disabled}
          value={resolvedValue}
          placeholder={placeholder}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (disabled) return
            if (event.key !== 'Enter') return
            if (!isModeControlled && showSaveButton) {
              handleSave()
              return
            }
            if (!isModeControlled && commitOnEnter) {
              skipNextBlurCommitRef.current = true
              commitInternalValue()
              onEnter?.()
              return
            }
            onEnter?.()
          }}
          sx={[
            {
              flex: 1,
              width: inputWidth,
              minWidth: 0,
              height: '20px',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '20px',
              color: 'contentText.Black',
              '& .MuiInputBase-input': {
                width: '100%',
                height: '20px',
                minWidth: 0,
                padding: 0,
                boxSizing: 'border-box',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                '&::placeholder': {
                  color: 'contentText.Placeholder',
                  opacity: 1,
                },
              },
            },
            ...(inputSx === undefined ? [] : Array.isArray(inputSx) ? inputSx : [inputSx]),
          ]}
        />
      </Stack>
      {renderSuffix(suffix, '8px')}
      {showSaveButton && (
        <MIBaseButton
          variant="contained"
          disabled={disabled || resolvedSaveDisabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleSave}
          sx={{
            ...actionButtonSx,
            backgroundColor: (theme) =>
              disabled || resolvedSaveDisabled ? theme.palette.contentIcon.Disabled : theme.palette.contentIcon.ActivePrimary,
            '&:hover:not(:disabled)': {
              backgroundColor: (theme) => theme.palette.contentIcon.ActivePrimary,
            },
            '&.Mui-disabled': {
              backgroundColor: (theme) => theme.palette.contentIcon.Disabled,
              color: 'contentText.White',
              opacity: 1,
            },
            '& .MuiTypography-root': {
              fontWeight: disabled || resolvedSaveDisabled ? 500 : 600,
            },
            '&.Mui-disabled .MuiTypography-root': {
              color: 'contentText.White',
            },
          }}
        >
          {saveLabel}
        </MIBaseButton>
      )}
    </Stack>
  )
}

export default NextGenMIInlineEditableInput
