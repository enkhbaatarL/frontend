import type { IDesignEventItem } from '@/service/mi/scenarioWorkbench/design'
import type {
  IScenarioWorkbenchEventListItem,
  ScenarioWorkbenchEventSignalType,
  ScenarioWorkbenchEventStatus,
} from '@/service/mi/scenarioWorkbench/event'
import type { IScenarioListItem } from '@/service/mi/scenarioWorkbench/scenario'

import { ScenarioWorkbenchStatus } from '@/service/mi/scenarioWorkbench/common'

export type WorkbenchClassificationTone = ScenarioWorkbenchEventStatus | 'noise'

export const scenarioWorkbenchIsEventNoiseSignal = (signalType?: ScenarioWorkbenchEventSignalType): boolean => signalType === 'noise'

const workbenchListingStatusToChipStatus = (status: ScenarioWorkbenchStatus): Exclude<WorkbenchClassificationTone, 'noise'> => {
  if (status === ScenarioWorkbenchStatus.NEW || status === ScenarioWorkbenchStatus.UPDATED) return status
  return 'closed'
}

export const classificationPropsFromScenarioWorkbenchEventRow = (
  row: Pick<IScenarioWorkbenchEventListItem, 'status' | 'signalType'> &
    Partial<Pick<IScenarioWorkbenchEventListItem, 'statusLabel' | 'signalTypeLabel'>>,
): { status: WorkbenchClassificationTone; label: string } => {
  if (scenarioWorkbenchIsEventNoiseSignal(row.signalType)) {
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
): { status: WorkbenchClassificationTone; label: string } => {
  const chipStatus = workbenchListingStatusToChipStatus(row.status)
  return {
    status: chipStatus,
    label: row.statusLabel?.trim() ?? '',
  }
}

export const classificationPropsFromScenarioListRow = (
  row: Pick<IScenarioListItem, 'status' | 'statusLabel'>,
): { status: WorkbenchClassificationTone; label: string } => {
  const chipStatus = workbenchListingStatusToChipStatus(row.status)
  return {
    status: chipStatus,
    label: row.statusLabel?.trim() ?? '',
  }
}
