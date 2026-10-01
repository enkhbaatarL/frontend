import { Box, Stack, Tooltip } from '@mui/material'

import ReplayIcon from '@/components/common/icons/ReplayIcon'

interface FundamentalModelEditedCellInputProps {
  value: string | number
  originalValue?: string | number
  isNew?: boolean
  unit?: string
  textAlign: 'left' | 'right'
  onChange: (value: string) => void
  onBlur: () => void
  onRestore: () => void
}

const FundamentalModelEditedCellInput = ({
  value,
  originalValue,
  isNew = false,
  unit = '',
  textAlign,
  onChange,
  onBlur,
  onRestore,
}: FundamentalModelEditedCellInputProps) => {
  const isModified = !isNew && originalValue !== undefined && String(value) !== String(originalValue)
  const formatTooltipValue = (cellValue: string | number) => {
    const text = String(cellValue)
    return unit && text.trim() && !text.trim().endsWith(unit) && Number.isFinite(Number(text.replaceAll(',', ''))) ? `${text}${unit}` : text
  }
  const content = (
    <Stack direction="row" alignItems="center" gap="2px" width="100%" minWidth={0}>
      <Box
        component="input"
        value={value}
        placeholder={isNew ? '-' : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
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
        borderColor={isModified ? '#EFA460' : 'contentBorder.Normal'}
        borderRadius="10px"
        bgcolor={isModified ? 'rgba(245, 159, 0, 0.05)' : 'commonColor.White'}
        boxSizing="border-box"
        sx={{ '&:focus, &:focus-visible': { outline: 'none', boxShadow: 'none' } }}
      />
      {isModified && (
        <Box
          component="button"
          type="button"
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
          sx={{ cursor: 'pointer' }}
        >
          <ReplayIcon width="18" height="18" aria-hidden="true" />
        </Box>
      )}
    </Stack>
  )
  const tooltipTitle =
    isModified && originalValue !== undefined ? `기본값: ${formatTooltipValue(originalValue)} → 변경값: ${formatTooltipValue(value)}` : ''

  return (
    <Tooltip
      title={tooltipTitle}
      placement="top-start"
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
      {content}
    </Tooltip>
  )
}

export default FundamentalModelEditedCellInput
