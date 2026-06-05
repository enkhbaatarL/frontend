import type { EventListItemRes, EventSignalType, EventStatus } from '@/service/mi/nextGenMI/event'

export type NextGenMIClassificationTone = EventStatus | 'closed' | 'noise'

export const nextGenMIIsEventNoiseSignal = (signalType?: EventSignalType): boolean => signalType === 'noise'

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
