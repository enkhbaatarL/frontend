import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import DashLineIcon from '@/components/common/forecast-chart/icons/DashLineIcon'
import SolidLineIcon from '@/components/common/forecast-chart/icons/SolidLineIcon'
import VisibilityIcon from '@/components/common/icons/VisibilityIcon'
import VisibilityOffIcon from '@/components/common/icons/VisibilityOffIcon'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import theme from '@/theming'

interface Props {
  type: 'forecast' | 'actual'
  color: string
  label: string
  description?: string
  isShow?: boolean
  onToggle?: (isShow: boolean) => void
  isFixedMode?: boolean
}

const Icon = ({
  type,
  color,
  isShow,
  setIsShow,
  isFixedMode,
}: {
  type: 'forecast' | 'actual'
  color: string
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  isFixedMode?: boolean
}) => {
  const LineIcon = type === 'forecast' ? DashLineIcon : SolidLineIcon

  const BaseIcon = isShow ? <LineIcon color={color} /> : <VisibilityOffIcon width={24} height={24} color={theme.palette.gray[60]} />

  const HoverIcon = isShow ? (
    <VisibilityOffIcon width={24} height={24} color={theme.palette.contentIcon.Activeb} />
  ) : (
    <VisibilityIcon width={24} height={24} color={theme.palette.contentIcon.Activeb} />
  )

  const transitionStyle = {
    transition: 'opacity 0.2s ease-in-out',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const

  return (
    <Box
      width="26px"
      height="26px"
      position="relative"
      onClick={(e) => {
        if (isFixedMode) return
        e.stopPropagation()
        setIsShow(!isShow)
      }}
      sx={{
        cursor: isFixedMode ? 'not-allowed' : 'pointer',
        '& .base-icon': {
          ...transitionStyle,
          opacity: 1,
        },
        '& .hover-icon': {
          ...transitionStyle,
          opacity: 0,
        },
        ...(!isFixedMode && {
          '&:hover .base-icon': {
            opacity: 0,
          },
          '&:hover .hover-icon': {
            opacity: 1,
          },
        }),
      }}
    >
      <Box className="base-icon">{BaseIcon}</Box>

      <Box className="hover-icon">{HoverIcon}</Box>
    </Box>
  )
}

const ForecastChartLegend = ({ type, color, label, description, isShow: externalIsShow, onToggle, isFixedMode = false }: Props) => {
  const [internalIsShow, setInternalIsShow] = useState(true)
  const isShow = externalIsShow !== undefined ? externalIsShow : internalIsShow
  const setIsShow = onToggle || setInternalIsShow
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selected, setSelected] = useState('1')

  return (
    <Stack
      direction="row"
      padding="6px"
      borderRadius="10px"
      gap="8px"
      border="1px solid"
      borderColor={isMenuOpen ? 'contentBorder.Active' : 'transparent'}
      bgcolor={isMenuOpen ? 'contentBG.Active' : 'transparent'}
      className={isMenuOpen ? 'menu-open' : ''}
      sx={{
        transition: 'all 0.2s ease-in-out',
        cursor: isFixedMode ? 'not-allowed' : 'default',
        backgroundColor: isShow ? (isMenuOpen ? 'contentBG.Active' : 'transparent') : 'transparent',
        ...(!isFixedMode && {
          '&:hover': {
            backgroundColor: isShow && !isMenuOpen ? 'contentBG.Hover' : undefined,
          },
          '&:hover .menu-container': {
            width: isShow ? '26px' : '0px',
            opacity: isShow ? 1 : 0,
            pointerEvents: isShow ? 'auto' : 'none',
          },
        }),
        '&.menu-open .menu-container': {
          width: isShow ? '26px' : '0px',
          opacity: isShow ? 1 : 0,
          pointerEvents: isShow ? 'auto' : 'none',
        },
      }}
    >
      <Box flexShrink={0}>
        <Icon type={type} color={color} isShow={isShow} setIsShow={setIsShow} isFixedMode={isFixedMode} />
      </Box>

      <Stack overflow="hidden" flex={1} minWidth={0} justifyContent="center">
        <Typography
          variant="subtext5"
          color={isShow ? 'commonColor.Black' : 'contentText.Disabled'}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }}
        >
          {label}
        </Typography>
        {description && (
          <Typography
            variant="body3"
            color={isShow ? 'contentText.Subtext' : 'contentText.Disabled'}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s',
            }}
          >
            {description}
          </Typography>
        )}
      </Stack>

      <Box
        className="menu-container"
        sx={{
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          width: '0px',
          opacity: 0,
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.1s linear',
          pointerEvents: 'none',
        }}
      >
        <MISelectMenu
          label=""
          open={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          selected={selected}
          onSelected={(value: string) => {
            setSelected(value)
          }}
          items={[
            { label: 'Text', value: '1' },
            { label: 'Text', value: '2' },
            { label: 'Text', value: '3' },
            { label: 'Text', value: '4' },
            { label: 'Text', value: '5' },
          ]}
          placement="bottom-end"
          menuPositionOffset={{ top: 20, right: -6 }}
          paperProps={{
            sx: { minWidth: '166px' },
            onMouseEnter: (e) => {
              e.stopPropagation()
              // setIsHovered(false)
            },
          }}
          sx={{
            minWidth: '26px',
            minHeight: '26px',
            maxWidth: '26px',
            maxHeight: '26px',
            padding: '0',
            '&:hover': { backgroundColor: 'transparent' },
          }}
          disableRipple
        />
      </Box>
    </Stack>
  )
}

export default ForecastChartLegend
