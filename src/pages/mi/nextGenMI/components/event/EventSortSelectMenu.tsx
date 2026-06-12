import { Typography } from '@mui/material'

import MISelectMenu from '@/components/common/menu/MISelectMenu'

export interface EventSortSelectMenuItem<T extends string> {
  value: T
  label: string
}

export interface EventSortSelectMenuProps<T extends string> {
  selected: T
  onSelected: (value: T) => void
  items: ReadonlyArray<EventSortSelectMenuItem<T>>
  closeOnScroll?: boolean
}

/** Events 테이블 툴바 정렬 단일 선택 메뉴 */
const EventSortSelectMenu = <T extends string>({ selected, onSelected, items, closeOnScroll }: EventSortSelectMenuProps<T>) => {
  const selectedItem = items.find((item) => item.value === selected)

  return (
    <MISelectMenu<T>
      variant="outlined"
      selectionIconPosition="left"
      selected={selected}
      onSelected={(value: T) => onSelected(value)}
      items={items.map(({ value, label }) => ({ value, label }))}
      textLabel={
        <Typography variant="body2SB14" color="contentText.Black" noWrap>
          {selectedItem?.label ?? ''}
        </Typography>
      }
      enableHoverBackground
      closeOnScroll={closeOnScroll}
      paperProps={{ sx: { minWidth: '150px' } }}
      sx={{
        height: '36px',
        borderRadius: '8px',
      }}
    />
  )
}

export default EventSortSelectMenu
