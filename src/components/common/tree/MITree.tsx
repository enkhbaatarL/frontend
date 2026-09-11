import { IconButton, Stack, StackProps, Typography } from '@mui/material'
import { ReactNode, useId, useMemo, useState } from 'react'

import checkboxIndeterminateDisabledIcon from '@/assets/icons/checkbox-indeterminate-disabled.svg'
import checkboxIndeterminateIcon from '@/assets/icons/checkbox-indeterminate.svg'
import ArrowDown from '@/components/common/icons/ArrowDown'
import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'
import MICheckBox from '@/components/common/input/MICheckBox'

export interface MITreeItem {
  id: string
  label: ReactNode
  children?: readonly MITreeItem[]
  disabled?: boolean
  ariaLabel?: string
}

export interface MITreeProps extends Omit<StackProps<'ul'>, 'children' | 'component' | 'onChange'> {
  items: readonly MITreeItem[]
  checkedItemIds?: readonly string[]
  defaultCheckedItemIds?: readonly string[]
  onCheckedItemIdsChange?: (itemIds: string[]) => void
  expandedItemIds?: readonly string[]
  defaultExpandedItemIds?: readonly string[]
  onExpandedItemIdsChange?: (itemIds: string[]) => void
  disabled?: boolean
}

interface MITreeNodeProps {
  item: MITreeItem
  selectedIdSet: ReadonlySet<string>
  expandedIdSet: ReadonlySet<string>
  disabled: boolean
  onSelectionChange: (ids: readonly string[], checked: boolean) => void
  onExpansionChange: (id: string) => void
}

const getSelectableLeafIds = (item: MITreeItem, disabled = false): string[] => {
  if (disabled || item.disabled) return []
  if (!item.children?.length) return [item.id]

  return item.children.flatMap((child) => getSelectableLeafIds(child))
}

const getLeafIds = (item: MITreeItem): string[] => {
  if (!item.children?.length) return [item.id]

  return item.children.flatMap(getLeafIds)
}

const getExpandableItemIds = (items: readonly MITreeItem[]): string[] =>
  items.flatMap((item) => (item.children?.length ? [item.id, ...getExpandableItemIds(item.children)] : []))

const IndeterminateIcon = ({ disabled }: { disabled: boolean }) => (
  <img
    src={disabled ? checkboxIndeterminateDisabledIcon : checkboxIndeterminateIcon}
    alt=""
    width={24}
    height={24}
    style={{ display: 'block' }}
  />
)

const MITreeNode = ({ item, selectedIdSet, expandedIdSet, disabled, onSelectionChange, onExpansionChange }: Readonly<MITreeNodeProps>) => {
  const childrenId = useId()
  const hasChildren = Boolean(item.children?.length)
  const isDisabled = disabled || Boolean(item.disabled)
  const isExpanded = hasChildren && expandedIdSet.has(item.id)
  const selectableLeafIds = getSelectableLeafIds(item, disabled)
  const stateLeafIds = selectableLeafIds.length > 0 ? selectableLeafIds : getLeafIds(item)
  const selectedLeafCount = stateLeafIds.filter((id) => selectedIdSet.has(id)).length
  const checked = stateLeafIds.length > 0 && selectedLeafCount === stateLeafIds.length
  const indeterminate = selectedLeafCount > 0 && !checked
  const isSelectionDisabled = isDisabled || selectableLeafIds.length === 0

  return (
    <Stack component="li" gap={hasChildren && isExpanded ? '8px' : 0} minWidth={0}>
      <Stack
        direction="row"
        alignItems="center"
        gap="12px"
        minWidth={0}
        width="100%"
        sx={{
          '&:hover': {
            backgroundColor: 'contentBG.Hover',
          },
        }}
      >
        <Stack
          component="label"
          direction="row"
          alignItems="center"
          gap="4px"
          flex={1}
          minWidth={0}
          sx={{ cursor: isSelectionDisabled ? 'default' : 'pointer' }}
        >
          <MICheckBox
            checked={checked}
            indeterminate={indeterminate}
            indeterminateIcon={<IndeterminateIcon disabled={isSelectionDisabled} />}
            disabled={isSelectionDisabled}
            inputProps={{ 'aria-checked': indeterminate ? 'mixed' : checked }}
            onChange={(event) => onSelectionChange(selectableLeafIds, event.target.checked)}
          />
          <Typography
            component="span"
            variant="body2M14"
            color={isDisabled ? 'contentText.Disabled' : 'contentText.Normal'}
            flex={1}
            minWidth={0}
            noWrap
          >
            {item.label}
          </Typography>
        </Stack>
        {hasChildren && (
          <IconButton
            aria-controls={isExpanded ? childrenId : undefined}
            aria-expanded={isExpanded}
            aria-label={item.ariaLabel ?? (typeof item.label === 'string' ? item.label : item.id)}
            disableRipple
            onClick={() => onExpansionChange(item.id)}
            sx={{
              padding: 0,
              width: '20px',
              height: '20px',
              flexShrink: 0,
              color: 'contentIcon.Enabled',
              '& svg path': { fill: 'currentColor' },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'contentBorder.Active',
                outlineOffset: '2px',
              },
            }}
          >
            {isExpanded ? <KeyboardArrowUpIcon /> : <ArrowDown />}
          </IconButton>
        )}
      </Stack>
      {isExpanded && item.children && (
        <Stack component="ul" id={childrenId} gap="8px" padding="0 0 0 16px" margin={0} sx={{ listStyle: 'none' }}>
          {item.children.map((child) => (
            <MITreeNode
              key={child.id}
              item={child}
              selectedIdSet={selectedIdSet}
              expandedIdSet={expandedIdSet}
              disabled={isDisabled}
              onSelectionChange={onSelectionChange}
              onExpansionChange={onExpansionChange}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

const MITree = ({
  items,
  checkedItemIds,
  defaultCheckedItemIds = [],
  onCheckedItemIdsChange,
  expandedItemIds,
  defaultExpandedItemIds = [],
  onExpandedItemIdsChange,
  disabled = false,
  sx,
  ...props
}: Readonly<MITreeProps>) => {
  const [internalCheckedItemIds, setInternalCheckedItemIds] = useState<string[]>([...defaultCheckedItemIds])
  const [internalExpandedItemIds, setInternalExpandedItemIds] = useState<string[]>([...defaultExpandedItemIds])
  const currentCheckedItemIds = checkedItemIds ?? internalCheckedItemIds
  const currentExpandedItemIds = expandedItemIds ?? internalExpandedItemIds
  const leafItemIds = useMemo(() => Array.from(new Set(items.flatMap(getLeafIds))), [items])
  const expandableItemIds = useMemo(() => Array.from(new Set(getExpandableItemIds(items))), [items])
  const leafItemIdSet = useMemo(() => new Set(leafItemIds), [leafItemIds])
  const expandableItemIdSet = useMemo(() => new Set(expandableItemIds), [expandableItemIds])
  const selectedIdSet = useMemo(
    () => new Set(currentCheckedItemIds.filter((id) => leafItemIdSet.has(id))),
    [currentCheckedItemIds, leafItemIdSet],
  )
  const expandedIdSet = useMemo(
    () => new Set(currentExpandedItemIds.filter((id) => expandableItemIdSet.has(id))),
    [currentExpandedItemIds, expandableItemIdSet],
  )

  const handleSelectionChange = (ids: readonly string[], checked: boolean) => {
    const nextSelectedIdSet = new Set(selectedIdSet)

    for (const id of ids) {
      if (checked) nextSelectedIdSet.add(id)
      else nextSelectedIdSet.delete(id)
    }

    const nextCheckedItemIds = leafItemIds.filter((id) => nextSelectedIdSet.has(id))
    if (checkedItemIds === undefined) setInternalCheckedItemIds(nextCheckedItemIds)
    onCheckedItemIdsChange?.(nextCheckedItemIds)
  }

  const handleExpansionChange = (id: string) => {
    const nextExpandedIdSet = new Set(expandedIdSet)

    if (nextExpandedIdSet.has(id)) nextExpandedIdSet.delete(id)
    else nextExpandedIdSet.add(id)

    const nextExpandedItemIds = expandableItemIds.filter((itemId) => nextExpandedIdSet.has(itemId))
    if (expandedItemIds === undefined) setInternalExpandedItemIds(nextExpandedItemIds)
    onExpandedItemIdsChange?.(nextExpandedItemIds)
  }

  return (
    <Stack
      component="ul"
      gap="8px"
      padding={0}
      margin={0}
      width="100%"
      {...props}
      sx={[{ listStyle: 'none' }, ...(sx === undefined ? [] : Array.isArray(sx) ? sx : [sx])]}
    >
      {items.map((item) => (
        <MITreeNode
          key={item.id}
          item={item}
          selectedIdSet={selectedIdSet}
          expandedIdSet={expandedIdSet}
          disabled={disabled}
          onSelectionChange={handleSelectionChange}
          onExpansionChange={handleExpansionChange}
        />
      ))}
    </Stack>
  )
}

export default MITree
