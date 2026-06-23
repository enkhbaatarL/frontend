import { Divider, Stack, Typography } from '@mui/material'
import { isEqual } from 'lodash-es'
import { useEffect, useMemo, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import useCodeData from '@/hooks/useCodeData'

export interface EventCategoryFilterItem {
  label: string
  value: number
}

export interface EventCategoryFilterMenuProps {
  selected: number[]
  onApply: (selected: number[]) => void
  closeOnScroll?: boolean
}

/** Events 테이블 툴바 카테고리 다중 선택 필터 */
const EventCategoryFilterMenu = ({ selected, onApply, closeOnScroll }: EventCategoryFilterMenuProps) => {
  const { nextGenMIEventTypeL1List } = useCodeData()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [draftSelected, setDraftSelected] = useState<number[]>(selected)
  const prevSelectedRef = useRef(selected)

  const filters = useMemo(
    () =>
      nextGenMIEventTypeL1List?.map(({ eventTypeL1Id, label }) => ({
        label,
        value: eventTypeL1Id,
      })) ?? [],
    [nextGenMIEventTypeL1List],
  )

  useEffect(() => {
    const prevSorted = [...prevSelectedRef.current].sort((a, b) => a - b)
    const nextSorted = [...selected].sort((a, b) => a - b)
    if (!isEqual(prevSorted, nextSorted)) {
      setDraftSelected(selected)
      prevSelectedRef.current = selected
    }
  }, [selected])

  const appliedCount = selected.length
  const isApplied = appliedCount > 0
  const isDraftChanged = !isEqual(
    [...draftSelected].sort((a, b) => a - b),
    [...selected].sort((a, b) => a - b),
  )

  const handleClear = () => {
    setDraftSelected([])
    onApply([])
    setIsMenuOpen(false)
  }

  const handleApply = () => {
    onApply(draftSelected)
    setIsMenuOpen(false)
  }

  return (
    <MISelectMenu<number>
      open={isMenuOpen}
      onOpenChange={setIsMenuOpen}
      variant="outlined"
      selectionIconPosition="left"
      multiple
      selected={draftSelected}
      onSelected={(next: number[]) => setDraftSelected(next)}
      items={filters}
      textLabel={
        <Stack component="span" direction="row" alignItems="center" gap="4px">
          <Typography component="span" variant="body2SB14" color="contentText.Black" noWrap>
            카테고리
          </Typography>
          {isApplied && (
            <Stack
              component="span"
              alignItems="center"
              justifyContent="center"
              padding="2px 6px"
              borderRadius="8px"
              minWidth="20px"
              bgcolor="mari.Primary"
              boxSizing="border-box"
            >
              <Typography component="span" variant="body3SB12" color="commonColor.White" lineHeight={1.4} noWrap>
                {appliedCount}
              </Typography>
            </Stack>
          )}
        </Stack>
      }
      enableHoverBackground
      closeOnScroll={closeOnScroll}
      menuPositionOffset={{ top: 3 }}
      paperProps={{ sx: { width: '212px' } }}
      footer={
        <Stack width="212px" padding="8px 12px 12px" gap="8px" boxSizing="border-box">
          <Divider flexItem sx={{ borderColor: 'contentBorder.Normal' }} />

          <Stack direction="row" justifyContent="flex-end" alignItems="center" gap="8px" padding="4px 8px">
            <MIBaseButton
              variant="outlined"
              disabled={draftSelected.length === 0}
              onClick={handleClear}
              sx={{ height: '32px', padding: '6px 10px', borderRadius: '8px' }}
            >
              초기화
            </MIBaseButton>
            <MIBaseButton
              variant="contained"
              color="primary"
              disabled={isApplied && !isDraftChanged}
              onClick={handleApply}
              sx={{ height: '32px', padding: '6px 10px', borderRadius: '8px' }}
            >
              적용
            </MIBaseButton>
          </Stack>
        </Stack>
      }
      sx={{
        height: '36px',
        minWidth: isApplied ? '119px' : '95px',
        borderRadius: '8px',
        borderColor: isApplied || isMenuOpen ? 'mari.Primary' : 'contentBorder.Normal',
        bgcolor: isMenuOpen ? (isApplied ? 'contentBG.Active' : 'gray.5') : 'commonColor.White',
        '& .MuiSvgIcon-root': { fontSize: '20px' },
        '&:hover:not(:disabled)': {
          borderColor: isApplied || isMenuOpen ? 'mari.Primary' : 'contentBorder.Hover',
          backgroundColor: isMenuOpen ? (isApplied ? 'contentBG.Active' : 'gray.5') : 'contentBG.Hover',
        },
      }}
    />
  )
}

export default EventCategoryFilterMenu
