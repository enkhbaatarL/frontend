import { Stack } from '@mui/material'
import { type ReactNode } from 'react'

import FundamentalModelColumnPinButton from '@/pages/mi/fundamentalModel/components/inputTable/FundamentalModelColumnPinButton'
import { getSheetHeaderRows } from '@/pages/mi/fundamentalModel/components/inputTable/fundamentalModelTableLayout'
import { MatrixHeaderRow } from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionMatrixTable'

const FundamentalModelColumnHeader = ({
  values,
  label,
  pinned,
  showPin,
  onPinToggle,
  action,
  align,
}: {
  values: string[]
  label: string
  pinned: boolean
  showPin: boolean
  onPinToggle: () => void
  action?: ReactNode
  align?: 'left' | 'right'
}) => (
  <Stack component="span" width="100%" minWidth={0}>
    {getSheetHeaderRows(values).map(({ value, rowSpan }, index) => (
      <Stack
        key={index}
        component="span"
        height={`${rowSpan * 24}px`}
        boxSizing="border-box"
        borderBottom="0.5px solid"
        borderColor="contentBorder.Active"
        paddingRight={index === 0 && (showPin || action) ? '4px' : undefined}
      >
        <Stack
          component="span"
          direction="row"
          alignItems="center"
          height="24px"
          flexShrink={0}
          marginTop={index === 0 ? `${values.findIndex((item) => item.trim()) * 24}px` : undefined}
        >
          <Stack component="span" flex={1} minWidth={0}>
            <MatrixHeaderRow value={value} align={align ?? (/[A-Za-z가-힣]/.test(value) ? 'left' : 'right')} border={false} />
          </Stack>
          {index === 0 && showPin && <FundamentalModelColumnPinButton label={label} pinned={pinned} onClick={onPinToggle} />}
          {index === 0 && action}
        </Stack>
      </Stack>
    ))}
  </Stack>
)

export default FundamentalModelColumnHeader
