import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Box, SxProps, Tooltip, TooltipProps } from '@mui/material'
import { JSX, PropsWithChildren, ReactElement, useMemo, useState, MouseEvent } from 'react'

import MIMenuSelector from '@/components/common/input/MIMenuSelector'
import theme from '@/theming'

export type MIButtonSize = 'h42' | 'h34' | 'h32' | 'h28'
export type MIButtonType = 'filled' | 'outlined' | 'ghost'
export type MIButtonContentType = 'text' | 'link' | 'icon' | 'select'
export type MIButtonColor = 'primary' | 'gray' | 'gray2' | 'white' | 'red'

export interface MIButtonProps {
  toolTip?: string
  toolTipProps?: Partial<TooltipProps>
  size?: MIButtonSize
  type?: MIButtonType
  contentType?: MIButtonContentType
  endIcon?: ReactElement
  startIcon?: ReactElement
  hoverIcon?: ReactElement
  color?: MIButtonColor
  disabled?: boolean
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  onChange?: (value: { label: string; value: string }) => void
  width?: number | string
  minWidth?: number | string
  padding?: number | string
  active?: boolean
  valueSelect?: {
    icon?: JSX.Element
    label: string
    value: string
  }
  offsetTop?: string | number
  options?: {
    icon?: JSX.Element
    label: string
    value: string
  }[]
}

export default function MIButton(props: PropsWithChildren<MIButtonProps>) {
  const {
    toolTip,
    size = 'h34',
    children,
    type = 'filled',
    contentType = 'text',
    endIcon,
    startIcon,
    hoverIcon,
    color = 'primary',
    disabled = false,
    width,
    minWidth = 100,
    valueSelect,
    options,
    offsetTop = '8px',
    active = false,
    onChange,
    onClick,
    toolTipProps = {},
  } = props

  const [isActive, setIsActive] = useState(false)

  const [icon, setIcon] = useState(startIcon)

  const handleMouseEnter = () => {
    if (hoverIcon) setIcon(hoverIcon)
  }

  const handleMouseLeave = () => {
    setIcon(startIcon)
  }
  const styleBaseSize = useMemo(() => {
    const typography = {
      h28: theme.typography.body3SB12,
      h32: theme.typography.body2SB14,
      h34: theme.typography.body2SB14,
      h42: theme.typography.body1SB16,
    }[size]

    const padding = {
      h28: contentType === 'icon' ? '3px' : '3px 11px',
      h32: contentType === 'icon' ? '5px' : contentType === 'link' ? '4px' : '5px 13px',
      h34: contentType === 'icon' ? '6px' : contentType === 'select' ? '7px 8px' : '6px 15px',
      h42: contentType === 'icon' ? '9px' : '9px 15px',
    }[size]

    const height = {
      h28: '28px',
      h32: '32px',
      h34: '34px',
      h42: '42px',
    }[size]

    const width = {
      h28: contentType === 'icon' ? '28px' : 'auto',
      h32: contentType === 'icon' ? '32px' : 'auto',
      h34: contentType === 'icon' ? '34px' : 'auto',
      h42: contentType === 'icon' ? '42px' : 'auto',
    }[size]

    return {
      padding,
      height,
      width,
      ...typography,
    }
  }, [size, contentType])

  const [isOpenMenu, setIsOpenMenu] = useState(false)
  const styleBaseType = useMemo((): Record<MIButtonType, SxProps> => {
    const colors: Record<MIButtonColor, string> = {
      primary: theme.palette.primary.main,
      gray: theme.palette.gray[70],
      gray2: theme.palette.gray[70],
      red: theme.palette.point['red1'],
      white: theme.palette.common.white,
    }

    return {
      filled: {
        color: theme.palette.common.white,
        border: `1px solid ${colors[color]}`,
        background:
          isActive || active
            ? `linear-gradient(0deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.10)), ${colors[color]}`
            : colors[color],
        '&:hover': {
          background: `linear-gradient(0deg, rgba(0, 0, 0, 0.20), rgba(0, 0, 0, 0.20)), ${colors[color]}`,
        },
        '&:disabled': {
          borderColor: theme.palette.gray[10],
          color: theme.palette.gray[50],
          background: theme.palette.gray[10],
        },
      },
      outlined: {
        color: colors[color],
        border: color === 'gray2' ? `1px solid ${theme.palette.gray[60]}` : `1px solid ${theme.palette.gray[30]}`,
        background: isActive || active ? theme.palette.gray[5] : theme.palette.common.white,
        svg: {
          color: theme.palette.content['iconEnabled'],
          transition: 'all 0.3s',
          path: {
            fill: theme.palette.gray[60],
            transition: 'all 0.3s',
          },
        },
        '&:hover': {
          background: theme.palette.content['backgroundHover'],
          borderColor: color === 'gray2' ? theme.palette.gray[70] : theme.palette.content['borderHover'],
          svg: {
            color: theme.palette.content['iconHover'],
            path: {
              fill: theme.palette.content['iconHover'],
            },
          },
        },
        '&:active': {
          background: theme.palette.content['backgroundHover'],
          borderColor: color === 'gray2' ? theme.palette.gray[70] : theme.palette.content['borderHover'],
          color: theme.palette.gray[90],
          svg: {
            color: theme.palette.content['iconActive'],
            path: {
              fill: theme.palette.content['iconActive'],
            },
          },
        },
        '&:disabled': {
          borderColor: theme.palette.gray[20],
          color: theme.palette.gray[50],
          background: theme.palette.gray[10],
          '& svg': {
            color: theme.palette.content['iconDisabled'],
            path: {
              fill: theme.palette.content['iconDisabled'],
            },
          },
        },
      },
      ghost: {
        color: colors[color],
        border: '1px solid transparent',
        background: active ? theme.palette.content['backgroundHover'] : isActive ? theme.palette.gray[5] : 'transparent',
        svg: {
          color: active ? theme.palette.content['iconActive'] : theme.palette.content['iconEnabled'],
          transition: 'all 0.3s',
          path: {
            fill: active ? theme.palette.content['iconActive'] : theme.palette.content['iconEnabled'],
            transition: 'all 0.3s',
          },
        },
        '&:hover': {
          background: theme.palette.content['backgroundHover'],
          svg: {
            color: theme.palette.content['iconHover'],
            path: {
              fill: theme.palette.content['iconHover'],
            },
          },
        },
        '&:active': {
          background: theme.palette.content['backgroundHover'],
          borderColor: color === 'gray2' ? theme.palette.gray[70] : 'transparent',
          color: theme.palette.gray[90],
          svg: {
            color: theme.palette.content['iconActive'],
            path: {
              fill: theme.palette.content['iconActive'],
            },
          },
        },
        '&:disabled': {
          borderColor: theme.palette.gray[10],
          color: theme.palette.gray[50],
          '& svg': {
            color: theme.palette.content['iconDisabled'],
            path: {
              fill: theme.palette.content['iconDisabled'],
            },
          },
        },
      },
    }
  }, [isActive, active, color])

  const renderButtonContent = () => (
    <Tooltip title={toolTip} {...toolTipProps}>
      <span>
        <Box
          component="button"
          disabled={disabled}
          display="inline-flex"
          alignItems="center"
          columnGap={contentType === 'select' ? '12px' : '8px'}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={() => {
            setIsActive(true)
          }}
          onMouseUp={() => {
            setIsActive(false)
          }}
          onClick={onClick}
          sx={{
            whiteSpace: 'nowrap',
            transition: 'all 0.3s',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: theme.typography.fontFamily,
            ...styleBaseSize,
            ...styleBaseType[type],
            ...(width && { width }),
            justifyContent: contentType === 'select' ? 'space-between' : 'center',
            ...(isOpenMenu && { backgroundColor: 'content.backgroundHover', color: theme.palette.gray[90] }),
            ...(contentType === 'select' && { minWidth }),
          }}
        >
          {contentType === 'select' ? (
            <>
              {valueSelect?.icon}
              {valueSelect?.label}
              <KeyboardArrowDownIcon
                sx={{
                  color: isOpenMenu ? '#343A40 !important' : '#868E96',
                  ml: 'auto',
                  transform: isOpenMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'none !important',
                  path: {
                    fill: '#343A40 !important',
                  },
                }}
                fontSize="small"
              />
            </>
          ) : (
            <>
              {icon}
              {children && <Box sx={{ textDecoration: contentType === 'link' ? 'underline' : 'inherit' }}>{children}</Box>}
              {endIcon}
            </>
          )}
        </Box>
      </span>
    </Tooltip>
  )

  return contentType === 'select' ? (
    <MIMenuSelector
      size={size}
      minWidthMenu={minWidth}
      sx={{ marginTop: offsetTop }}
      value={valueSelect}
      onOpen={setIsOpenMenu}
      onChange={(option) => onChange?.(option as { label: string; value: string })}
      options={options}
    >
      {renderButtonContent()}
    </MIMenuSelector>
  ) : (
    renderButtonContent()
  )
}
