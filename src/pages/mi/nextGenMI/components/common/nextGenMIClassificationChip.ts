import type { IDesignEventItem } from '@/service/mi/nextGenMI/design'
import type { INextGenMIEventListItem, NextGenMIEventSignalType, NextGenMIEventStatus } from '@/service/mi/nextGenMI/event'
import type { IScenarioListItem } from '@/service/mi/nextGenMI/scenario'

import { NextGenMIStatus } from '@/service/mi/nextGenMI/common'

export type NextGenMIClassificationTone = NextGenMIEventStatus | 'noise'

export const nextGenMIIsEventNoiseSignal = (signalType?: NextGenMIEventSignalType): boolean => signalType === 'noise'

const nextGenMIListingStatusToChipStatus = (status: NextGenMIStatus): Exclude<NextGenMIClassificationTone, 'noise'> => {
  if (status === NextGenMIStatus.NEW || status === NextGenMIStatus.UPDATED) return status
  return 'closed'
}

export const classificationPropsFromNextGenMIEventRow = (
  row: Pick<INextGenMIEventListItem, 'status' | 'signalType'> & Partial<Pick<INextGenMIEventListItem, 'statusLabel' | 'signalTypeLabel'>>,
): { status: NextGenMIClassificationTone; label: string } => {
  if (nextGenMIIsEventNoiseSignal(row.signalType)) {
    return {
      status: 'noise',
      label: row.signalTypeLabel?.trim() ?? '',
    }
  }
  return {
    status: row.status,
    label: row.statusLabel?.trim() ?? '',
  }
}

export const classificationPropsFromDesignEventRow = (
  row: Pick<IDesignEventItem, 'status' | 'statusLabel'>,
): { status: NextGenMIClassificationTone; label: string } => {
  const chipStatus = nextGenMIListingStatusToChipStatus(row.status)
  return {
    status: chipStatus,
    label: row.statusLabel?.trim() ?? '',
  }
}

export const classificationPropsFromScenarioListRow = (
  row: Pick<IScenarioListItem, 'status' | 'statusLabel'>,
): { status: NextGenMIClassificationTone; label: string } => {
  const chipStatus = nextGenMIListingStatusToChipStatus(row.status)
  return {
    status: chipStatus,
    label: row.statusLabel?.trim() ?? '',
  }
}
