import { CheckRounded, KeyboardArrowDownRounded, KeyboardArrowUpRounded } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import MIBaseButtonLabel from '@/components/common/label/MIBaseButtonLabel'
import MIMenu from '@/components/common/menu/MIMenu'

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
  const [open, setOpen] = useState(false)
  const selectedItem = items.find((item) => item.value === selected)

  const menuSuffix = open ? (
    <KeyboardArrowUpRounded sx={{ color: 'contentIcon.Enabled' }} />
  ) : (
    <KeyboardArrowDownRounded sx={{ color: 'contentIcon.Enabled' }} />
  )

  return (
    <MIMenu
      open={open}
      onOpenChange={setOpen}
      variant="outlined"
      label={
        <Typography variant="body2SB14" color="contentText.Black" noWrap>
          {selectedItem?.label ?? ''}
        </Typography>
      }
      suffix={menuSuffix}
      enableHoverBackground
      closeOnScroll={closeOnScroll}
      paperProps={{ sx: { minWidth: '150px' } }}
      sx={{
        height: '36px',
        borderRadius: '8px',
      }}
    >
      <Stack gap="8px" padding="12px">
        {items.map((item) => {
          const isSelected = item.value === selected

          return (
            <Box
              key={String(item.value)}
              onClick={() => {
                onSelected(item.value)
                setOpen(false)
              }}
              borderRadius="10px"
              sx={{
                padding: '8px 8px 8px 6px',
                cursor: 'pointer',
                ...(isSelected ? { backgroundColor: 'contentBG.PrimaryFade' } : undefined),
                '&:hover': {
                  backgroundColor: isSelected ? 'contentBG.PrimaryFade' : 'gray.10',
                },
                textWrap: 'nowrap',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap="8px">
                <MIBaseButtonLabel
                  suffix={
                    <Box width="20px" height="20px">
                      {isSelected && <CheckRounded fontSize="small" sx={{ color: 'contentIcon.ActivePrimary' }} />}
                    </Box>
                  }
                  color={isSelected ? undefined : 'contentText.Subtext'}
                  variant="body2M14"
                >
                  {item.label}
                </MIBaseButtonLabel>
              </Stack>
            </Box>
          )
        })}
      </Stack>
    </MIMenu>
  )
}

export default EventSortSelectMenu
