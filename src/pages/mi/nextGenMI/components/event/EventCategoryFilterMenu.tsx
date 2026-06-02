import { KeyboardArrowDownRounded, KeyboardArrowUpRounded } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { isEqual } from 'lodash-es'
import { useEffect, useRef, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MIFilterGroup from '@/components/common/filter/MIFilterGroup'
import MIMenu from '@/components/common/menu/MIMenu'
import { EventCategoryLv1 } from '@/service/mi/nextGenMI/common'

const MENU_MIN_WIDTH = 212
const CATEGORY_FILTER_LABEL = '카테고리'

export interface EventCategoryFilterItem {
  label: string
  value: EventCategoryLv1
}

export interface EventCategoryFilterMenuProps {
  filters: EventCategoryFilterItem[]
  selected: EventCategoryLv1[]
  onApply: (selected: EventCategoryLv1[]) => void
  closeOnScroll?: boolean
}

/** Events 테이블 툴바 카테고리 다중 선택 필터 */
const EventCategoryFilterMenu = ({ filters, selected, onApply, closeOnScroll }: EventCategoryFilterMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [draftSelected, setDraftSelected] = useState<EventCategoryLv1[]>(selected)
  const prevSelectedRef = useRef(selected)

  useEffect(() => {
    const prevSorted = [...prevSelectedRef.current].sort()
    const nextSorted = [...selected].sort()
    if (!isEqual(prevSorted, nextSorted)) {
      setDraftSelected(selected)
      prevSelectedRef.current = selected
    }
  }, [selected])

  const appliedCount = selected.length
  const isApplied = appliedCount > 0

  const menuLabel = (
    <Stack direction="row" alignItems="center" gap="4px">
      <Typography variant="body2SB14" color="contentText.Black" noWrap>
        {CATEGORY_FILTER_LABEL}
      </Typography>
      {isApplied && (
        <Box display="inline-flex" alignItems="center" px="6px" py="2px" borderRadius="8px" bgcolor="commonColor.Primary">
          <Typography variant="body3SB12" color="commonColor.White" lineHeight={1.4} noWrap>
            {appliedCount}
          </Typography>
        </Box>
      )}
    </Stack>
  )

  const handleClear = () => {
    setDraftSelected([])
  }

  const handleApply = () => {
    onApply(draftSelected)
    setIsMenuOpen(false)
  }

  const menuSuffix = isMenuOpen ? (
    <KeyboardArrowUpRounded sx={{ color: 'contentIcon.Enabled' }} />
  ) : (
    <KeyboardArrowDownRounded sx={{ color: 'contentIcon.Enabled' }} />
  )

  return (
    <MIMenu
      open={isMenuOpen}
      onOpenChange={setIsMenuOpen}
      variant="outlined"
      label={menuLabel}
      suffix={menuSuffix}
      enableHoverBackground
      closeOnScroll={closeOnScroll}
      paperProps={{ sx: { minWidth: MENU_MIN_WIDTH } }}
      sx={{
        minWidth: isApplied ? 119 : 95,
        ...(isApplied && {
          borderColor: 'contentBorder.ActivePrimary',
          bgcolor: 'commonColor.White',
        }),
      }}
    >
      <Stack>
        <Stack padding="12px" boxSizing="border-box">
          <MIFilterGroup
            title="카테고리"
            type="menu"
            filters={filters}
            selectedFilters={draftSelected}
            onFilterChange={(values) => setDraftSelected(values as EventCategoryLv1[])}
            padding="0"
            width={MENU_MIN_WIDTH}
          />
        </Stack>
        <Stack
          direction="row"
          padding="10px 12px"
          justifyContent="flex-end"
          alignItems="center"
          borderTop="1px solid"
          borderColor="contentBorder.Normal"
          gap="8px"
        >
          <MIButton type="outlined" size="h28" disabled={draftSelected.length === 0} onClick={handleClear}>
            초기화
          </MIButton>
          <MIButton type="filled" size="h28" onClick={handleApply}>
            적용
          </MIButton>
        </Stack>
      </Stack>
    </MIMenu>
  )
}

export default EventCategoryFilterMenu
