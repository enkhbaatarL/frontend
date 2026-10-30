import { Box, Stack, Tooltip } from '@mui/material'
import { useState } from 'react'

import ReplayIcon from '@/components/common/icons/ReplayIcon'
import MIInputErrorIcon from '@/components/common/input/MIInputErrorIcon'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import formatFundamentalModelCellValue from '@/pages/mi/fundamentalModel/components/inputTable/formatFundamentalModelCellValue'
import { compareModelInputDecimals } from '@/utils/modelInputValidation'

interface FundamentalModelEditedCellInputProps {
  value: string | number
  originalValue?: string | number
  modified?: boolean
  restoreAllowed?: boolean
  isNew?: boolean
  disabled?: boolean
  isNumeric?: boolean
  unit?: string
  textAlign: 'left' | 'right'
  options?: SelectMenuItem<string | number>[]
  ariaLabel?: string
  errorMessage?: string | null
  onChange: (value: string | number) => void
  onBlur: () => void
  onRestore: () => void
}

const FundamentalModelEditedCellInput = ({
  value,
  originalValue,
  modified,
  restoreAllowed = true,
  isNew = false,
  disabled = false,
  isNumeric = false,
  unit = '',
  textAlign,
  options,
  ariaLabel,
  errorMessage,
  onChange,
  onBlur,
  onRestore,
}: FundamentalModelEditedCellInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const isModified =
    modified ??
    (!isNew &&
      originalValue !== undefined &&
      String(value) !== String(originalValue) &&
      (!isNumeric || compareModelInputDecimals(String(value), String(originalValue)) !== 0))
  const formatTooltipValue = (cellValue: string | number) => {
    const text = String(cellValue)
    return unit && text.trim() && !text.trim().endsWith(unit) && Number.isFinite(Number(text.replaceAll(',', ''))) ? `${text}${unit}` : text
  }
  const tooltipTitle =
    isModified && originalValue !== undefined ? `기본값: ${formatTooltipValue(originalValue)} → 변경값: ${formatTooltipValue(value)}` : ''

  return (
    <Stack direction="row" alignItems="center" gap="2px" width="100%" minWidth={0}>
      <Tooltip
        title={tooltipTitle}
        placement="top-start"
        followCursor
        disableHoverListener={!isModified}
        slotProps={{
          tooltip: {
            sx: {
              bgcolor: 'contentBG.Tooltip',
              color: 'commonColor.White',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '14px',
              lineHeight: 1.4,
              maxWidth: 'min(420px, calc(100vw - 32px))',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
            },
          },
        }}
      >
        <Stack flex={1} minWidth={0}>
          {options ? (
            <MISelectMenu<string | number>
              variant="outlined"
              selected={value}
              disabled={disabled}
              onSelected={onChange}
              items={options}
              aria-label={ariaLabel}
              aria-invalid={Boolean(errorMessage)}
              aria-description={errorMessage || undefined}
              closeOnScroll
              zIndex={1500}
              paperProps={{ sx: { minWidth: '160px' } }}
              sx={{
                width: '100%',
                height: '28px',
                ...((errorMessage || isModified) && {
                  '&, &:hover:not(:disabled)': {
                    borderColor: errorMessage ? 'contentBorder.Error' : '#EFA460',
                    bgcolor: errorMessage ? 'commonColor.White' : 'rgba(245, 159, 0, 0.05)',
                  },
                }),
              }}
            />
          ) : (
            <Box
              component="input"
              aria-label={ariaLabel}
              aria-invalid={Boolean(errorMessage)}
              aria-description={errorMessage || undefined}
              value={isNumeric && !isFocused && !errorMessage ? formatFundamentalModelCellValue(value) : value}
              disabled={disabled}
              placeholder={isNew ? '-' : undefined}
              onChange={(event) => onChange(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false)
                onBlur()
              }}
              fontFamily="inherit"
              fontSize="12px"
              fontWeight={500}
              color="contentText.Normal"
              textAlign={textAlign}
              width="100%"
              minWidth="54px"
              height="28px"
              padding="8px 12px"
              border="1px solid"
              borderColor={errorMessage ? 'contentBorder.Error' : isModified ? '#EFA460' : 'contentBorder.Normal'}
              borderRadius="10px"
              bgcolor={!errorMessage && isModified ? 'rgba(245, 159, 0, 0.05)' : 'commonColor.White'}
              boxSizing="border-box"
              sx={{ '&:focus, &:focus-visible': { outline: 'none', boxShadow: 'none' } }}
            />
          )}
        </Stack>
      </Tooltip>
      {errorMessage && (
        <Tooltip
          title={errorMessage}
          placement="top-start"
          slotProps={{
            popper: { sx: { zIndex: 1500 } },
            tooltip: {
              sx: {
                bgcolor: 'point.red1',
                color: 'commonColor.White',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: 1.4,
                maxWidth: 'min(420px, calc(100vw - 32px))',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
              },
            },
          }}
        >
          <Stack component="span" role="img" tabIndex={0} aria-label={errorMessage} flexShrink={0}>
            <MIInputErrorIcon width="18px" height="18px" aria-hidden="true" />
          </Stack>
        </Tooltip>
      )}
      {isModified && restoreAllowed && (
        <Box
          component="button"
          type="button"
          disabled={disabled}
          aria-label="기본값으로 되돌리기"
          onClick={onRestore}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          width="18px"
          minWidth="18px"
          height="18px"
          padding={0}
          border={0}
          bgcolor="transparent"
          sx={{ cursor: disabled ? 'default' : 'pointer' }}
        >
          <ReplayIcon width="18" height="18" aria-hidden="true" />
        </Box>
      )}
    </Stack>
  )
}

export default FundamentalModelEditedCellInput
