import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Stack, type TypographyProps } from '@mui/material'

import type { MouseEventHandler } from 'react'

import MIDataTableCellText from '@/components/common/table/MIDataTableCellText'

interface NextGenMIHoverLinkCellProps {
  value: string
  onClick: MouseEventHandler<HTMLButtonElement>
  variant?: TypographyProps['variant']
  ariaLabel?: string
}

const NextGenMIHoverLinkCell = ({ value, onClick, variant = 'body1SB16', ariaLabel }: NextGenMIHoverLinkCellProps) => (
  <Stack
    component="button"
    type="button"
    direction="row"
    alignItems="center"
    minWidth={0}
    maxWidth="100%"
    color="contentText.Black"
    aria-label={ariaLabel ?? value}
    onClick={(e) => {
      e.stopPropagation()
      onClick(e)
    }}
    sx={{
      p: 0,
      border: 0,
      backgroundColor: 'transparent',
      font: 'inherit',
      cursor: 'pointer',
      textAlign: 'left',
      '&:hover': {
        color: 'mari.Primary',
      },
      '&:hover .MuiTypography-root': {
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '3px',
      },
      '&:hover .next-gen-mi-hover-link-cell-chevron': {
        width: 20,
        opacity: 1,
      },
    }}
  >
    <MIDataTableCellText
      value={value}
      variant={variant}
      color="inherit"
      tooltipWhenTruncated
      component="span"
      sx={{ display: 'block', minWidth: 0, flex: '0 1 auto', width: 'auto' }}
    />
    <ChevronRightRoundedIcon
      className="next-gen-mi-hover-link-cell-chevron"
      aria-hidden
      focusable="false"
      fontSize="small"
      sx={{
        width: 0,
        opacity: 0,
        color: 'contentText.Black',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 120ms ease, opacity 120ms ease',
      }}
    />
  </Stack>
)

export default NextGenMIHoverLinkCell
