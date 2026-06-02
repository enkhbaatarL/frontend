import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
} from '@mui/icons-material'
import { Divider, Stack, Typography } from '@mui/material'
import { isEqual } from 'lodash-es'
import { useEffect, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIMenu from '@/components/common/menu/MIMenu'
import { EventCategoryLv1 } from '@/service/mi/nextGenMI/common'

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
    const prevSorted = [...prevSelectedRef.current].sort((a, b) => a.localeCompare(b))
    const nextSorted = [...selected].sort((a, b) => a.localeCompare(b))
    if (!isEqual(prevSorted, nextSorted)) {
      setDraftSelected(selected)
      prevSelectedRef.current = selected
    }
  }, [selected])

  const appliedCount = selected.length
  const isApplied = appliedCount > 0
  const isDraftChanged = !isEqual(
    [...draftSelected].sort((a, b) => a.localeCompare(b)),
    [...selected].sort((a, b) => a.localeCompare(b)),
  )

  const handleClear = () => {
    setDraftSelected([])
  }

  const handleApply = () => {
    onApply(draftSelected)
    setIsMenuOpen(false)
  }

  const handleFilterChange = (value: EventCategoryLv1, checked: boolean) => {
    setDraftSelected((prev) => {
      if (!checked) {
        return prev.filter((selectedValue) => selectedValue !== value)
      }

      if (prev.includes(value)) {
        return prev
      }

      return [...prev, value]
    })
  }

  return (
    <MIMenu
      open={isMenuOpen}
      onOpenChange={setIsMenuOpen}
      variant="outlined"
      label={
        <Stack component="span" direction="row" alignItems="center" gap="4px">
          <Typography component="span" variant="body2SB14" color="contentText.Black" noWrap>
            카테고리
          </Typography>
          {isApplied && (
            <Stack component="span" alignItems="center" justifyContent="center" padding="2px 6px" borderRadius="8px" bgcolor="mari.Primary">
              <Typography component="span" variant="body3SB12" color="commonColor.White" lineHeight={1.4} noWrap>
                {appliedCount}
              </Typography>
            </Stack>
          )}
        </Stack>
      }
      suffix={
        isMenuOpen ? (
          <KeyboardArrowUpRounded fontSize="small" sx={{ color: 'contentIcon.Enabled' }} />
        ) : (
          <KeyboardArrowDownRounded fontSize="small" sx={{ color: 'contentIcon.Enabled' }} />
        )
      }
      enableHoverBackground
      closeOnScroll={closeOnScroll}
      menuPositionOffset={{ top: 3 }}
      paperProps={{ sx: { width: '212px' } }}
      sx={{
        height: '36px',
        minWidth: isApplied ? '119px' : '95px',
        borderRadius: '8px',
        ...(isApplied && {
          borderColor: 'mari.Primary',
          bgcolor: isMenuOpen ? 'contentBG.Active' : 'commonColor.White',
          '&:hover:not(:disabled)': {
            borderColor: 'mari.Primary',
          },
        }),
      }}
    >
      <Stack width="212px" padding="12px" gap="8px" boxSizing="border-box">
        <Stack gap="4px" width="100%">
          {filters.map(({ label, value }) => {
            const checked = draftSelected.includes(value)

            return (
              <Stack
                key={value}
                direction="row"
                alignItems="center"
                height="36px"
                borderRadius="10px"
                padding="8px 12px 8px 6px"
                boxSizing="border-box"
                width="100%"
                bgcolor={checked ? 'contentBG.PrimaryFade' : undefined}
                onClick={() => handleFilterChange(value, !checked)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: checked ? 'contentBG.PrimaryFade' : 'contentBG.Hover',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" gap="8px" minWidth={0}>
                  <Stack component="span" alignItems="center" justifyContent="center" width="20px" height="20px" flexShrink={0}>
                    {checked ? (
                      <CheckBoxIcon sx={{ width: '20px', height: '20px', color: 'mari.Primary' }} />
                    ) : (
                      <CheckBoxOutlineBlankIcon sx={{ width: '20px', height: '20px', color: 'contentIcon.Disabled' }} />
                    )}
                  </Stack>
                  <Typography variant="body2M14" color={checked ? 'contentText.Black' : 'contentText.Normal'} noWrap>
                    {label}
                  </Typography>
                </Stack>
              </Stack>
            )
          })}
        </Stack>

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
    </MIMenu>
  )
}

export default EventCategoryFilterMenu
