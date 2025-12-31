import { CheckRounded, KeyboardArrowDownRounded, KeyboardArrowUpRounded } from '@mui/icons-material'
import { Box, Typography, Stack, Switch, ButtonProps, PaperProps, ListSubheader, Divider } from '@mui/material'
import { ReactNode, useMemo, useState, Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButtonLabel from '@/components/common/label/MIBaseButtonLabel'
import MIMenu, { MenuPositionOffset } from '@/components/common/menu/MIMenu'

export type DashboardMultipleSelectType = 'default' | 'switch' | 'none'

export interface SelectMenuItem {
  icon?: ReactNode
  label: ReactNode
  value: string
  disabled?: boolean
  group?: string
}

export type GroupDisplayType = 'label' | 'divider' | 'none'

interface Props extends ButtonProps {
  variant?: 'text' | 'outlined' | 'contained'
  selectType?: DashboardMultipleSelectType
  multiple?: boolean
  selected: string | string[]
  onSelected: ((selected: string) => void) | ((selected: string[]) => void)
  items: SelectMenuItem[]
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
  zIndex?: number
  disableRipple?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  label?: ReactNode
  labelPrefix?: ReactNode
}

const MISelectMenu = ({
  variant = 'text',
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
  zIndex,
  disableRipple,
  open: controlledOpen,
  onOpenChange,
  label: externalLabel,
  labelPrefix: externalPrefix,
  ...props
}: Props) => {
  const { t } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)

  // 외부에서 open이 제공되면 controlled, 아니면 uncontrolled
  const open = controlledOpen ?? internalOpen
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  const handleMultipleToggle = (value: string) => {
    const currentArray = Array.isArray(selected) ? selected : [selected]
    const newArray = currentArray.includes(value) ? currentArray.filter((item) => item !== value) : [...currentArray, value]
    ;(onSelected as (selected: string[]) => void)(newArray)
  }

  const handleSingleSelect = (value: string) => {
    ;(onSelected as (selected: string) => void)(value)
    setOpen(false)
  }

  const handleToggle = multiple ? handleMultipleToggle : handleSingleSelect

  const isItemSelected = (value: string): boolean => {
    if (Array.isArray(selected)) {
      return selected.includes(value)
    }
    return selected === value
  }

  const groupedItems = useMemo(() => {
    if (groupDisplayType === 'none') {
      return { groups: {}, ungroupedItems: items }
    }

    const groups: { [key: string]: SelectMenuItem[] } = {}
    const ungroupedItems: SelectMenuItem[] = []

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
            <Stack direction="row" alignItems="center" key={value}>
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
            <Stack direction="row" alignItems="center" key={value}>
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
    }
  }, [items, multiple, placeholder, selected, t])

  const renderSuffix = (isSelected: boolean, disabled?: boolean): ReactNode => {
    if (selectType === 'default' && !multiple) {
      return (
        <Box width="20px" height="20px">
          {isSelected && <CheckRounded fontSize="small" sx={{ color: 'contentIcon.ActivePrimary' }} />}
        </Box>
      )
    }
    if (selectType === 'switch') {
      return (
        <Switch
          checked={isSelected}
          size="small"
          disabled={disabled}
          sx={{
            margin: '0 4px 0 8px',
          }}
        />
      )
    }
    return undefined
  }

  const renderMenuItem = ({ icon, label, value, disabled }: SelectMenuItem) => {
    const isSelected = isItemSelected(value)
    const prefix = icon
    const suffix = renderSuffix(isSelected, disabled)
    const labelColor = isSelected ? undefined : 'contentText.Subtext'

    return (
      <Box
        key={value}
        onClick={() => (disabled ? null : handleToggle(value))}
        borderRadius="10px"
        sx={{
          padding: `8px ${suffix ? '8px' : '12px'} 8px ${prefix ? '8px' : '12px'}`,
          cursor: disabled ? 'default' : 'pointer',
          '&:hover': {
            backgroundColor: disabled ? 'transparent' : 'gray.10',
          },
          textWrap: 'nowrap',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          minWidth={(props.sx as Record<string, unknown>)?.minWidth as string | number}
          gap="12px"
          component="div"
        >
          <MIBaseButtonLabel prefix={prefix} suffix={suffix} color={labelColor} variant="body2M14">
            {label}
          </MIBaseButtonLabel>
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

  return (
    <MIMenu
      prefix={externalPrefix !== undefined ? externalPrefix : selectedItems.prefix}
      suffix={
        !hideChevron &&
        (open ? (
          <KeyboardArrowUpRounded sx={{ color: 'contentIcon.Enabled' }} />
        ) : (
          <KeyboardArrowDownRounded sx={{ color: 'contentIcon.Enabled' }} />
        ))
      }
      label={externalLabel !== undefined ? externalLabel : selectedItems.label}
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
      {...props}
    >
      <ScrollWrapper
        maxHeight={maxHeight}
        offsetTop={12}
        offsetBottom={12}
        scrollbarGap={6}
        sx={{
          padding: '0',
        }}
      >
        <Stack gap="8px" sx={{ padding: '12px' }}>
          {renderMenuItems()}
        </Stack>
      </ScrollWrapper>
    </MIMenu>
  )
}

export default MISelectMenu
