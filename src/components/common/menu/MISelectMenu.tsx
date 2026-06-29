import { CheckBox, CheckBoxOutlineBlank, CheckRounded, KeyboardArrowDownRounded, KeyboardArrowUpRounded } from '@mui/icons-material'
import { Box, Typography, Stack, Switch, ButtonProps, PaperProps, ListSubheader, Divider } from '@mui/material'
import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButtonLabel from '@/components/common/label/MIBaseButtonLabel'
import MIMenu, { MenuPositionOffset } from '@/components/common/menu/MIMenu'

export type DashboardMultipleSelectType = 'default' | 'switch' | 'none'

export interface SelectMenuItem<T = string> {
  icon?: ReactNode
  label: ReactNode
  value: T
  disabled?: boolean
  group?: string
  suffix?: ReactNode
}

export type GroupDisplayType = 'label' | 'divider' | 'none'

interface Props<T> extends ButtonProps {
  variant?: 'text' | 'outlined' | 'contained'
  buttonHoverBgColor?: string
  selectType?: DashboardMultipleSelectType
  multiple?: boolean
  selected: T | T[]
  onSelected: ((selected: T) => void) | ((selected: T[]) => void)
  items: SelectMenuItem<T>[]
  placeholder?: string
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  fadeIn?: 'left' | 'right' | 'center'
  menuPositionOffset?: MenuPositionOffset
  paperProps?: PaperProps
  groupDisplayType?: GroupDisplayType
  groupLabels?: { [groupKey: string]: ReactNode }
  disablePortal?: boolean
  closeOnScroll?: boolean
  maxHeight?: number | string
  enableHoverBackground?: boolean
  hideChevron?: boolean
  showSelectedSuffix?: boolean
  zIndex?: number
  disableRipple?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  label?: ReactNode
  textLabel?: ReactNode
  labelPrefix?: ReactNode
  footer?: ReactNode
  selectionIconPosition?: 'left' | 'right'
}

const MISelectMenu = <T,>({
  variant = 'text',
  buttonHoverBgColor,
  selected,
  onSelected,
  items,
  selectType = 'default',
  multiple = false,
  placeholder = '선택하세요',
  placement = 'bottom-start',
  fadeIn,
  menuPositionOffset = {},
  paperProps,
  groupDisplayType = 'label',
  groupLabels = {},
  disablePortal = false,
  closeOnScroll = false,
  maxHeight = 300,
  enableHoverBackground = false,
  hideChevron = false,
  showSelectedSuffix = false,
  zIndex,
  disableRipple,
  open: controlledOpen,
  onOpenChange,
  label: externalLabel,
  textLabel: externalTextLabel,
  labelPrefix: externalPrefix,
  footer,
  selectionIconPosition = 'right',
  disabled,
  ...props
}: Props<T>) => {
  const { t } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedMenuItemRef = useRef<HTMLDivElement>(null)

  // 외부에서 open이 제공되면 controlled, 아니면 uncontrolled
  const open = controlledOpen ?? internalOpen
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  const handleMultipleToggle = (value: T) => {
    const currentArray = Array.isArray(selected) ? selected : [selected]
    const newArray = currentArray.includes(value) ? currentArray.filter((item) => item !== value) : [...currentArray, value]
    ;(onSelected as (selected: T[]) => void)(newArray)
  }

  const handleSingleSelect = (value: T) => {
    ;(onSelected as (selected: T) => void)(value)
    setOpen(false)
  }

  const handleToggle = multiple ? handleMultipleToggle : handleSingleSelect

  const isItemSelected = (value: T): boolean => {
    if (Array.isArray(selected)) {
      return selected.includes(value)
    }
    return selected === value
  }

  const selectedScrollTargetItem = useMemo(
    () => items.find((item) => (Array.isArray(selected) ? selected.includes(item.value) : selected === item.value)),
    [items, selected],
  )

  const groupedItems = useMemo(() => {
    if (groupDisplayType === 'none') {
      return { groups: {}, ungroupedItems: items }
    }

    const groups: { [key: string]: SelectMenuItem<T>[] } = {}
    const ungroupedItems: SelectMenuItem<T>[] = []

    for (const item of items) {
      const groupKey = item.group
      if (groupKey) {
        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(item)
      } else {
        ungroupedItems.push(item)
      }
    }

    return { groups, ungroupedItems }
  }, [items, groupDisplayType])

  const selectedItems = useMemo(() => {
    if (!multiple) {
      const item = items.find((menuItem) => menuItem.value === selected)

      return {
        prefix: item?.icon,
        label: item?.label ?? (
          <Typography variant="body2M14" color="gray.50">
            {placeholder}
          </Typography>
        ),
        suffix: item?.suffix,
      }
    }

    let label: ReactNode

    const selectedItemList = items.filter((item) => (Array.isArray(selected) ? selected.includes(item.value) : selected === item.value))

    if (selectedItemList?.length === 0) {
      label = (
        <Typography variant="body2M14" color="gray.50">
          {placeholder}
        </Typography>
      )
    } else if (selectedItemList.length > 2) {
      label = (
        <Stack direction="row" alignItems="center" gap="4px">
          {selectedItemList.slice(0, 2).map(({ icon, label: itemLabel, value }, index) => (
            <Stack direction="row" alignItems="center" key={String(value)}>
              <MIBaseButtonLabel prefix={icon} gap="4px">
                {itemLabel}
              </MIBaseButtonLabel>
              {index < 1 && t('common.comma')}
            </Stack>
          ))}
          <Box>{t('common.andMore')}</Box>
        </Stack>
      )
    } else {
      label = (
        <Stack direction="row" alignItems="center" gap="4px">
          {selectedItemList.map(({ icon, label: itemLabel, value }, index) => (
            <Stack direction="row" alignItems="center" key={String(value)}>
              <MIBaseButtonLabel prefix={icon} gap="4px">
                {itemLabel}
              </MIBaseButtonLabel>
              {index < selectedItemList.length - 1 && t('common.comma')}
            </Stack>
          ))}
        </Stack>
      )
    }

    return {
      prefix: undefined,
      label,
      suffix: undefined,
    }
  }, [items, multiple, placeholder, selected, t])

  useEffect(() => {
    if (!open) return undefined

    let scrollAnimationFrame: number | undefined

    scrollAnimationFrame = requestAnimationFrame(() => {
      scrollAnimationFrame = requestAnimationFrame(() => {
        const container = scrollContainerRef.current
        const selectedMenuItem = selectedMenuItemRef.current

        if (!container || !selectedMenuItem) return

        const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight)

        container.scrollTop = Math.min(Math.max(0, selectedMenuItem.offsetTop - 12), maxScrollTop)
      })
    })

    return () => {
      if (scrollAnimationFrame !== undefined) {
        cancelAnimationFrame(scrollAnimationFrame)
      }
    }
  }, [open, selectedScrollTargetItem])

  const renderSelectionIcon = (isSelected: boolean, itemDisabled?: boolean): ReactNode => {
    if (selectType !== 'default') {
      return undefined
    }

    if (multiple) {
      if (selectionIconPosition === 'right') {
        return undefined
      }

      return isSelected ? (
        <CheckBox sx={{ width: '20px', height: '20px', color: itemDisabled ? 'contentIcon.Disabled' : 'mari.Primary' }} />
      ) : (
        <CheckBoxOutlineBlank sx={{ width: '20px', height: '20px', color: 'contentIcon.Disabled' }} />
      )
    }

    return (
      <CheckRounded
        fontSize="small"
        sx={{
          color: itemDisabled ? 'contentIcon.Disabled' : selectionIconPosition === 'left' ? 'mari.Primary' : 'contentIcon.ActivePrimary',
          opacity: isSelected ? 1 : 0,
        }}
      />
    )
  }

  const renderSuffix = (isSelected: boolean, itemDisabled?: boolean): ReactNode => {
    if (selectType === 'switch') {
      return (
        <Box
          component="span"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          width="32px"
          height="20px"
          ml="8px"
          mr="4px"
        >
          <Switch
            checked={isSelected}
            size="small"
            disabled={itemDisabled}
            tabIndex={-1}
            slotProps={{ input: { readOnly: true, tabIndex: -1 } }}
            sx={{ margin: 0, pointerEvents: 'none', flexShrink: 0 }}
          />
        </Box>
      )
    }
    return undefined
  }

  const renderMenuItem = ({ icon, label, value, disabled: itemDisabled, suffix: itemSuffix }: SelectMenuItem<T>) => {
    const isSelected = isItemSelected(value)
    const selectionIcon = renderSelectionIcon(isSelected, itemDisabled)
    const hasLeftSelectionIcon = selectionIconPosition === 'left' && selectionIcon !== undefined
    const selectionIconSuffix =
      selectionIconPosition === 'right' && selectionIcon !== undefined ? (
        <Box component="span" display="inline-flex" alignItems="center" justifyContent="center" width="20px" height="20px" flexShrink={0}>
          {selectionIcon}
        </Box>
      ) : undefined
    const prefix = hasLeftSelectionIcon ? (
      <Stack direction="row" alignItems="center" gap="8px" minWidth={0}>
        <Box component="span" display="inline-flex" alignItems="center" justifyContent="center" width="20px" height="20px" flexShrink={0}>
          {selectionIcon}
        </Box>
        {icon}
      </Stack>
    ) : (
      icon
    )
    const suffix = renderSuffix(isSelected, itemDisabled) ?? selectionIconSuffix ?? itemSuffix
    const labelColor =
      selectionIconPosition === 'left'
        ? itemDisabled
          ? 'contentText.Disabled'
          : isSelected
            ? 'contentText.Black'
            : 'contentText.Normal'
        : itemDisabled
          ? 'contentText.Disabled'
          : isSelected
            ? undefined
            : 'contentText.Subtext'

    return (
      <Box
        ref={selectedScrollTargetItem?.value === value ? selectedMenuItemRef : undefined}
        key={String(value)}
        onClick={() => (itemDisabled ? null : handleToggle(value))}
        borderRadius="10px"
        height={selectionIconPosition === 'left' ? '36px' : undefined}
        width="100%"
        minWidth={0}
        boxSizing="border-box"
        sx={{
          padding: `8px ${suffix ? '8px' : '12px'} 8px ${hasLeftSelectionIcon ? '6px' : icon ? '8px' : '12px'}`,
          backgroundColor:
            selectionIconPosition === 'left'
              ? itemDisabled
                ? 'transparent'
                : isSelected
                  ? 'contentBG.PrimaryFade'
                  : 'transparent'
              : undefined,
          cursor: itemDisabled ? 'default' : 'pointer',
          '&:hover': {
            backgroundColor: itemDisabled ? 'transparent' : selectionIconPosition === 'left' ? 'contentBG.Active' : 'gray.10',
          },
          textWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          minWidth={0}
          gap={selectionIconPosition === 'left' ? '8px' : '12px'}
          component="div"
          overflow="hidden"
        >
          {prefix && (
            <Box component="span" display="inline-flex" alignItems="center" flexShrink={0} minWidth={0}>
              {prefix}
            </Box>
          )}
          <Typography
            component="span"
            variant="body2M14"
            color={labelColor}
            flex={1}
            minWidth={0}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            textAlign="left"
          >
            {label}
          </Typography>
          {suffix && (
            <Box component="span" display="inline-flex" alignItems="center" justifyContent="center" flexShrink={0}>
              {suffix}
            </Box>
          )}
        </Stack>
      </Box>
    )
  }

  const renderMenuItems = () => {
    if (groupDisplayType === 'divider') {
      return (
        <>
          {groupedItems.ungroupedItems.map(renderMenuItem)}

          {Object.entries(groupedItems.groups).map(([groupKey, groupItems], groupIndex) => (
            <Fragment key={groupKey}>
              {groupIndex > 0 && <Divider />}
              {groupItems.map(renderMenuItem)}
            </Fragment>
          ))}
        </>
      )
    }

    return (
      <>
        {groupedItems.ungroupedItems.map(renderMenuItem)}

        {Object.entries(groupedItems.groups).map(([groupKey, groupItems]) => (
          <Box key={groupKey}>
            {groupDisplayType === 'label' && (
              <ListSubheader
                sx={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: 'gray.50',
                  fontSize: '12px',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {groupLabels[groupKey] || groupKey}
              </ListSubheader>
            )}

            {groupItems.map(renderMenuItem)}
          </Box>
        ))}
      </>
    )
  }

  const chevronIcon = hideChevron ? null : open ? (
    <KeyboardArrowUpRounded sx={{ color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled' }} />
  ) : (
    <KeyboardArrowDownRounded sx={{ color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled' }} />
  )
  const selectedSuffixNode = showSelectedSuffix && !multiple ? selectedItems.suffix : undefined

  const hasExternalLabel = externalLabel !== undefined
  const buttonLabelColor =
    !hasExternalLabel && externalTextLabel === undefined ? (disabled ? 'contentText.Disabled' : 'contentText.Normal') : undefined

  const menuLabel = hasExternalLabel ? (
    <Stack direction="row" alignItems="stretch" flex={1} minWidth={0}>
      <Box
        px="10px"
        display="flex"
        alignItems="center"
        bgcolor={open ? 'contentBG.Active' : 'gray.10'}
        sx={{ transition: 'background-color 0.15s ease-in-out' }}
      >
        <Typography variant="body2SB14" color="contentText.Black" noWrap>
          {externalLabel}
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem sx={{ borderColor: open ? 'contentBorder.Active' : 'contentBorder.Normal' }} />
      <Stack
        direction="row"
        alignItems="center"
        gap="6px"
        pl="10px"
        pr="8px"
        flex={1}
        minWidth={0}
        sx={buttonHoverBgColor ? { '&:hover': { backgroundColor: buttonHoverBgColor } } : undefined}
      >
        <Typography
          variant="body2SB14"
          color={disabled ? 'contentText.Disabled' : open ? 'contentText.Black' : 'contentText.Normal'}
          flex={1}
          minWidth={0}
          noWrap
        >
          {externalTextLabel !== undefined ? externalTextLabel : selectedItems.label}
        </Typography>
        {!hideChevron &&
          (open ? (
            <KeyboardArrowUpRounded sx={{ color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled', flexShrink: 0 }} />
          ) : (
            <KeyboardArrowDownRounded sx={{ color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled', flexShrink: 0 }} />
          ))}
      </Stack>
    </Stack>
  ) : externalTextLabel !== undefined ? (
    externalTextLabel
  ) : (
    selectedItems.label
  )

  return (
    <MIMenu
      prefix={hasExternalLabel ? undefined : externalPrefix !== undefined ? externalPrefix : selectedItems.prefix}
      suffix={
        hasExternalLabel ? undefined : selectedSuffixNode ? (
          <Stack direction="row" alignItems="center" gap="6px">
            {selectedSuffixNode}
            {chevronIcon}
          </Stack>
        ) : (
          chevronIcon
        )
      }
      label={menuLabel}
      variant={variant}
      placement={placement}
      menuPositionOffset={menuPositionOffset}
      fadeIn={fadeIn}
      paperProps={paperProps}
      open={open}
      onOpenChange={setOpen}
      disablePortal={disablePortal}
      closeOnScroll={closeOnScroll}
      enableHoverBackground={enableHoverBackground}
      zIndex={zIndex}
      disableRipple={disableRipple}
      buttonHoverBgColor={buttonHoverBgColor}
      disabled={disabled}
      labelColor={buttonLabelColor}
      labelTextAlign="left"
      {...props}
      sx={{
        ...(typeof props.sx === 'object' && !Array.isArray(props.sx) ? (props.sx as Record<string, unknown>) : {}),
        ...(hasExternalLabel && {
          padding: 0,
          overflow: 'hidden',
          alignItems: 'stretch',
          // MIBaseButton 구조: Button > Box > Box > MIBaseButtonLabel(Stack) > Stack > Typography > menuLabel
          // Typography의 line-height가 높이를 제한해 회색 라벨 영역이 위아래로 채워지지 않음 → stretch 체인으로 전체 높이 채움
          '& > .MuiBox-root': { alignItems: 'stretch', height: '100%' },
          '& > .MuiBox-root > .MuiBox-root': { alignItems: 'stretch', height: '100%' },
          '& .MuiStack-root': { alignItems: 'stretch', height: '100%' },
          '& .MuiDivider-root + .MuiStack-root': { alignItems: 'center' },
          '& > .MuiBox-root > .MuiBox-root > .MuiStack-root > .MuiStack-root > .MuiTypography-root': {
            alignSelf: 'stretch',
            display: 'flex',
            lineHeight: 1,
            height: '100%',
            overflow: 'visible',
          },
        }),
      }}
    >
      <ScrollWrapper
        ref={scrollContainerRef}
        maxHeight={maxHeight}
        offsetTop={12}
        offsetBottom={12}
        scrollbarGap={6}
        sx={{
          padding: '0',
        }}
      >
        <Stack gap={selectionIconPosition === 'left' ? '4px' : '8px'} padding={footer ? '12px 12px 0 12px' : '12px'}>
          {renderMenuItems()}
        </Stack>
      </ScrollWrapper>
      {footer}
    </MIMenu>
  )
}

export default MISelectMenu
