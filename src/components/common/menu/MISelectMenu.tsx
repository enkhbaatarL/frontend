import { Box, Typography, Stack, Switch, ButtonProps, PaperProps, ListSubheader, Divider } from '@mui/material'
import { ReactNode, useMemo, useState, Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import CheckIcon from '@/components/common/icons/agent/CheckIcon'
import MIMenu, { MenuPositionOffset } from '@/components/common/menu/MIMenu'

export type DashboardMultipleSelectType = 'default' | 'switch' | 'none'

export interface SelectMenuItem {
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
  ...props
}: Props) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

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

  const selectedItemsLabel = useMemo(() => {
    if (!multiple) {
      return (
        items.find((item) => item.value === selected)?.label ?? (
          <Typography variant="body2M14" color="gray.50">
            {placeholder}
          </Typography>
        )
      )
    }

    const selectedItems = items.filter((item) => selected.includes(item.value))
    if (selectedItems.length === 0) return placeholder
    if (selectedItems.length > 2) {
      return (
        <>
          {selectedItems.slice(0, 2).map(({ label, value }, index) => (
            <span key={value}>
              {label}
              {index < 1 && t('common.comma')}
            </span>
          ))}{' '}
          {t('common.andMore')}
        </>
      )
    }
    return selectedItems.map(({ label, value }, index) => (
      <span key={value}>
        {label}
        {index < selectedItems.length - 1 && t('common.comma')}
      </span>
    ))
  }, [selected, items, placeholder, t, multiple])

  const renderMenuItems = () => {
    if (groupDisplayType === 'divider') {
      return (
        <>
          {groupedItems.ungroupedItems.map(({ label, value, disabled }) => {
            const isSelected = selected.includes(value)

            return (
              <Box
                key={value}
                onClick={() => (disabled ? null : handleToggle(value))}
                borderRadius="10px"
                sx={{
                  padding: '6px 12px',
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
                  <Typography
                    variant="body2M14"
                    color={isSelected ? 'gray.70' : 'gray.60'}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {label}
                  </Typography>
                  {selectType === 'default' && !multiple && (
                    <Box width="20px" height="20px">
                      {isSelected && <CheckIcon fill="gray.70" />}
                    </Box>
                  )}
                  {selectType === 'switch' && (
                    <Switch
                      checked={isSelected}
                      size="small"
                      disabled={disabled}
                      sx={{
                        margin: 0,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            )
          })}

          {Object.entries(groupedItems.groups).map(([groupKey, groupItems], groupIndex) => (
            <Fragment key={groupKey}>
              {groupIndex > 0 && <Divider />}

              {groupItems.map(({ label, value, disabled }) => {
                const isSelected = selected.includes(value)

                return (
                  <Box
                    key={value}
                    onClick={() => (disabled ? null : handleToggle(value))}
                    borderRadius="10px"
                    sx={{
                      padding: '6px 12px',
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
                      <Typography
                        variant="body2M14"
                        color={isSelected ? 'gray.70' : 'gray.60'}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {label}
                      </Typography>
                      {selectType === 'default' && !multiple && (
                        <Box width="20px" height="20px">
                          {isSelected && <CheckIcon fill="gray.70" />}
                        </Box>
                      )}
                      {selectType === 'switch' && (
                        <Switch
                          checked={isSelected}
                          size="small"
                          disabled={disabled}
                          sx={{
                            margin: 0,
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                )
              })}
            </Fragment>
          ))}
        </>
      )
    }

    return (
      <>
        {groupedItems.ungroupedItems.map(({ label, value, disabled }) => {
          const isSelected = selected.includes(value)

          return (
            <Box
              key={value}
              onClick={() => (disabled ? null : handleToggle(value))}
              borderRadius="10px"
              sx={{
                padding: '6px 12px',
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
                <Typography
                  variant="body2M14"
                  color={isSelected ? 'gray.70' : 'gray.60'}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {label}
                </Typography>
                {selectType === 'default' && !multiple && (
                  <Box width="20px" height="20px">
                    {isSelected && <CheckIcon fill="gray.70" />}
                  </Box>
                )}
                {selectType === 'switch' && (
                  <Switch
                    checked={isSelected}
                    size="small"
                    disabled={disabled}
                    sx={{
                      margin: 0,
                    }}
                  />
                )}
              </Stack>
            </Box>
          )
        })}

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

            {groupItems.map(({ label, value, disabled }) => {
              const isSelected = selected.includes(value)

              return (
                <Box
                  key={value}
                  onClick={() => (disabled ? null : handleToggle(value))}
                  borderRadius="10px"
                  sx={{
                    padding: '6px 12px',
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
                    <Typography
                      variant="body2M14"
                      color={isSelected ? 'gray.70' : 'gray.60'}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                    >
                      {label}
                    </Typography>
                    {selectType === 'default' && !multiple && (
                      <Box width="20px" height="20px">
                        {isSelected && <CheckIcon fill="gray.70" />}
                      </Box>
                    )}
                    {selectType === 'switch' && (
                      <Switch
                        checked={isSelected}
                        size="small"
                        disabled={disabled}
                        sx={{
                          margin: 0,
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              )
            })}
          </Box>
        ))}
      </>
    )
  }

  return (
    <MIMenu
      label={selectedItemsLabel}
      displayType="select"
      variant={variant}
      placement={placement}
      menuPositionOffset={menuPositionOffset}
      fadeIn={fadeIn}
      paperProps={paperProps}
      open={open}
      onOpenChange={setOpen}
      disablePortal={disablePortal}
      closeOnScroll={closeOnScroll}
      {...props}
    >
      <Stack gap="8px" sx={{ padding: '12px' }}>
        {renderMenuItems()}
      </Stack>
    </MIMenu>
  )
}

export default MISelectMenu
