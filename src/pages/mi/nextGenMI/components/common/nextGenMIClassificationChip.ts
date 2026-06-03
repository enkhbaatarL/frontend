import type { IDesignEventItem } from '@/service/mi/nextGenMI/design'
import type { EventListItemRes, EventSignalType, EventStatus } from '@/service/mi/nextGenMI/event'
import type { IScenarioListItem } from '@/service/mi/nextGenMI/scenario'

import { NextGenMIStatus } from '@/service/mi/nextGenMI/common'

export type NextGenMIClassificationTone = EventStatus | 'closed' | 'noise'

export const nextGenMIIsEventNoiseSignal = (signalType?: EventSignalType): boolean => signalType === 'noise'

const nextGenMIListingStatusToChipStatus = (status: NextGenMIStatus): Exclude<NextGenMIClassificationTone, 'noise'> => {
  if (status === NextGenMIStatus.NEW || status === NextGenMIStatus.UPDATED) return status
  return 'closed'
}

export const classificationPropsFromNextGenMIEventRow = (
  row: Pick<EventListItemRes, 'status' | 'signalType'> & Partial<Pick<EventListItemRes, 'statusLabel' | 'signalTypeLabel'>>,
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
): { status: NextGenMIClassificationTone; label: string } => ({
  status: nextGenMIListingStatusToChipStatus(row.status),
  label: row.statusLabel?.trim() ?? '',
})

export const classificationPropsFromScenarioListRow = (
  row: Pick<IScenarioListItem, 'status' | 'statusLabel'>,
): { status: NextGenMIClassificationTone; label: string } => ({
  status: nextGenMIListingStatusToChipStatus(row.status),
  label: row.statusLabel?.trim() ?? '',
})
