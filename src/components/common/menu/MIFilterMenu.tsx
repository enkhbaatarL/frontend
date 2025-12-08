import { KeyboardArrowDownRounded, KeyboardArrowUpRounded } from '@mui/icons-material'
import { Divider, FormControlLabel, Stack, Switch, Typography } from '@mui/material'
import { isEqual } from 'lodash-es'
import { Fragment, useEffect, useMemo, useRef, useState, ReactNode } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MIFilterGroup from '@/components/common/filter/MIFilterGroup'
import MIMenu, { MIMenuProps } from '@/components/common/menu/MIMenu'

export interface FilterGroupConfig {
  key: string
  title: string
  filters: { label: string; badge?: string; value: string }[]
  width?: string | number
}

export interface FilterValues {
  [key: string]: string[]
}

interface MIFilterMenuProps extends MIMenuProps {
  label?: ReactNode
  filterGroups: FilterGroupConfig[][]
  initialValues?: FilterValues
  appliedFiltersCount?: number
  onApply: (filterValues: FilterValues, save?: boolean) => void
  showSaveOption?: boolean
  initialSaveOn?: boolean
  groupLayout?:
    | 'horizontal-vertical' // 세로 묶음을 가로로 배치 (기본값)
    | 'vertical-horizontal' // 가로 묶음을 세로로 배치
  enableHoverBackground?: boolean
  hideChevron?: boolean
}

const MIFilterMenu = ({
  label,
  filterGroups,
  initialValues = {},
  appliedFiltersCount = 0,
  onApply,
  showSaveOption = true,
  initialSaveOn = false,
  groupLayout = 'vertical-horizontal',
  enableHoverBackground = false,
  hideChevron = false,
  ...props
}: MIFilterMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [save, setSave] = useState(initialSaveOn)

  // 필터 그룹을 평탄화하여 상태 관리 (메모이제이션)
  const allFilterGroups = useMemo(() => filterGroups.flat(), [filterGroups])

  const prevInitialValuesRef = useRef<FilterValues>(initialValues)

  // 각 필터 그룹별로 상태 관리
  const [filterStates, setFilterStates] = useState<FilterValues>(() => {
    const states: FilterValues = {}
    for (const group of allFilterGroups) {
      states[group.key] = initialValues[group.key] ?? []
    }
    return states
  })

  // 초기값이 변경되면 상태 업데이트
  useEffect(() => {
    const hasInitialValuesChanged = allFilterGroups.some((group) => {
      const prevValues = prevInitialValuesRef.current[group.key] ?? []
      const newValues = initialValues[group.key] ?? []
      const prevSorted = [...prevValues].sort((a, b) => a.localeCompare(b))
      const newSorted = [...newValues].sort((a, b) => a.localeCompare(b))
      return !isEqual(prevSorted, newSorted)
    })

    if (hasInitialValuesChanged) {
      const newStates: FilterValues = {}
      for (const group of allFilterGroups) {
        newStates[group.key] = initialValues[group.key] ?? []
      }
      setFilterStates(newStates)
      prevInitialValuesRef.current = initialValues
    }
  }, [initialValues, allFilterGroups])

  useEffect(() => {
    setSave(initialSaveOn)
  }, [initialSaveOn])

  const handleFilterChange = (groupKey: string) => (selectedFilters: string[]) => {
    setFilterStates((prev) => ({
      ...prev,
      [groupKey]: selectedFilters,
    }))
  }

  const handleClear = () => {
    const clearedStates: FilterValues = {}
    for (const group of allFilterGroups) {
      clearedStates[group.key] = []
    }
    setFilterStates(clearedStates)
  }

  const handleApply = () => {
    onApply(filterStates, showSaveOption ? save : undefined)
    setIsMenuOpen(false)
  }

  const totalFilterCount = Object.values(filterStates).reduce((sum, values) => sum + values.length, 0)

  const defaultLabel = label || (
    <Stack direction="row" alignItems="center" gap="6px">
      <Typography variant="body2SB14">Filters</Typography>
      {appliedFiltersCount > 0 && (
        <Stack justifyContent="center" alignItems="center" minWidth="20px" height="20px" borderRadius="100px" bgcolor="commonColor.Primary">
          <Typography px="5px" variant="body2SB14" color="commonColor.White" textAlign="center">
            {appliedFiltersCount}
          </Typography>
        </Stack>
      )}
    </Stack>
  )

  const renderFilterGroups = () => {
    if (groupLayout === 'vertical-horizontal') {
      return (
        <Stack direction="row" padding="12px" gap="12px" boxSizing="border-box">
          {filterGroups.map((row, rowIndex) => {
            const rowKey = row.length > 0 ? row[0].key : `row-${rowIndex}`
            const isLastRow = rowIndex === filterGroups.length - 1

            return (
              <Fragment key={rowKey}>
                {/* 각 행: 세로로 배치 */}
                <Stack gap="12px">
                  {row.map((group, groupIndex) => (
                    <Fragment key={group.key}>
                      <Stack gap="12px">
                        <MIFilterGroup
                          title={group.title}
                          type="menu"
                          filters={group.filters}
                          selectedFilters={filterStates[group.key]}
                          onFilterChange={handleFilterChange(group.key)}
                          padding="0"
                          width={group.width ?? 'auto'}
                        />
                      </Stack>
                      {/* 같은 행 내 그룹 간 horizontal divider */}
                      {groupIndex < row.length - 1 && <Divider flexItem sx={{ borderColor: 'contentBorder.Normal' }} />}
                    </Fragment>
                  ))}
                </Stack>
                {/* 행 간 vertical divider */}
                {!isLastRow && <Divider orientation="vertical" flexItem sx={{ borderColor: 'contentBorder.Normal' }} />}
              </Fragment>
            )
          })}
        </Stack>
      )
    }

    return (
      <Stack padding="12px" gap="12px" boxSizing="border-box">
        {filterGroups.map((row, rowIndex) => {
          const rowKey = row.length > 0 ? row[0].key : `row-${rowIndex}`
          const isLastRow = rowIndex === filterGroups.length - 1

          return (
            <Fragment key={rowKey}>
              {/* 각 행: 가로로 배치 */}
              <Stack direction="row" gap="12px">
                {row.map((group, groupIndex) => (
                  <Fragment key={group.key}>
                    <Stack gap="12px">
                      <MIFilterGroup
                        title={group.title}
                        type="menu"
                        filters={group.filters}
                        selectedFilters={filterStates[group.key]}
                        onFilterChange={handleFilterChange(group.key)}
                        padding="0"
                        width={group.width ?? 'auto'}
                      />
                    </Stack>
                    {/* 같은 행 내 그룹 간 vertical divider */}
                    {groupIndex < row.length - 1 && (
                      <Divider orientation="vertical" flexItem sx={{ borderColor: 'contentBorder.Normal' }} />
                    )}
                  </Fragment>
                ))}
              </Stack>
              {/* 행 간 horizontal divider */}
              {!isLastRow && <Divider flexItem sx={{ borderColor: 'contentBorder.Normal' }} />}
            </Fragment>
          )
        })}
      </Stack>
    )
  }

  return (
    <MIMenu
      open={isMenuOpen}
      suffix={
        !hideChevron &&
        (isMenuOpen ? (
          <KeyboardArrowUpRounded sx={{ color: 'contentIcon.Enabled' }} />
        ) : (
          <KeyboardArrowDownRounded sx={{ color: 'contentIcon.Enabled' }} />
        ))
      }
      onOpenChange={setIsMenuOpen}
      variant="outlined"
      label={defaultLabel}
      enableHoverBackground={enableHoverBackground}
      {...props}
    >
      <Stack>
        {renderFilterGroups()}
        <Stack
          direction="row"
          padding="10px 12px"
          justifyContent="space-between"
          alignItems="center"
          borderTop="1px solid"
          borderColor="contentBorder.Normal"
          gap="16px"
        >
          {showSaveOption && (
            <FormControlLabel
              label="Save"
              control={
                <Switch
                  size="small"
                  checked={save}
                  onChange={() => {
                    setSave(!save)
                  }}
                  sx={{
                    mt: '1px',
                  }}
                />
              }
              sx={{ marginRight: 0 }}
            />
          )}
          <Stack direction="row" gap="10px" ml={showSaveOption ? 0 : 'auto'}>
            <MIButton type="outlined" size="h28" disabled={totalFilterCount === 0} onClick={handleClear}>
              Clear
            </MIButton>
            <MIButton type="filled" size="h28" onClick={handleApply}>
              Apply
            </MIButton>
          </Stack>
        </Stack>
      </Stack>
    </MIMenu>
  )
}

export default MIFilterMenu
