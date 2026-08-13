import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded'

import type { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import type {
  DesignEditTable,
  DesignScenarioRow,
  ScenarioDimension,
  ScenarioDimensionColumn,
  ScenarioDimensionTemplateItem,
} from '@/service/mi/nextGenMI/scenarioDesign'

export const SCENARIO_DESIGN_BASE_EVENT_TABS = [
  { key: 'ai', label: 'AI Insights' },
  { key: 'impact', label: '영향도 분석' },
  { key: 'driverTree', label: 'Index Driver별 영향도 분석' },
  { key: 'outlook', label: '기관 전망' },
  { key: 'records', label: 'MI Records' },
] as const

export type ScenarioDesignBaseEventTabKey = (typeof SCENARIO_DESIGN_BASE_EVENT_TABS)[number]['key']
export type ScenarioDesignConfirmType = 'cancel' | 'reviewComplete' | 'reviewCompleteWithWarning'

export type ScenarioDesignLocationState = {
  eventName?: string
  eventIds?: number[]
  scenarioGroupId?: number
  designStep?: string | null
}

export type ScenarioDesignColumn = {
  key: string
  label: string
  width: string
  required?: boolean
  displayOrder?: number
  valueEnums?: string[]
  description?: string | null
  valueEnumDescriptions?: Record<string, string>
}

export const SCENARIO_DESIGN_MAX_ROW_COUNT = 15

export const SCENARIO_DESIGN_SELECT_COMMON_ACTIONS = {
  agent: {
    value: 'agent',
    label: 'Agent 자동 설정',
  },
  manual: {
    value: 'manual',
    label: '직접 입력값',
    inputLabel: '직접 입력',
  },
  reset: {
    label: '초기화',
  },
} as const

export const scenarioDesignAgentItem: SelectMenuItem<string> = {
  value: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
  label: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.label,
  icon: <AutoAwesomeRoundedIcon sx={{ fontSize: '18px', color: 'contentIcon.Enabled' }} />,
}

export const scenarioDesignManualItem: SelectMenuItem<string> = {
  value: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.value,
  label: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
  icon: <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />,
}

const getScenarioDesignTemplateKey = (template: ScenarioDimensionTemplateItem) => template.dimKey?.trim() ?? ''

const getScenarioDesignTemplateLabel = (template: ScenarioDimensionTemplateItem) => {
  const key = getScenarioDesignTemplateKey(template)
  return template.label?.trim() || key
}

export const createScenarioDesignColumn = (
  column: ScenarioDimensionColumn,
  templates: ScenarioDimensionTemplateItem[] = [],
): ScenarioDesignColumn | null => {
  const key = column.key?.trim() ?? ''
  if (!key) return null

  const template = templates.find((item) => getScenarioDesignTemplateKey(item) === key)

  return {
    key,
    label: column.label?.trim() || template?.label?.trim() || key,
    width: '200px',
    required: template?.required,
    displayOrder: template?.displayOrder,
    valueEnums: template?.valueEnums,
    description: column.description?.trim() || template?.description?.trim() || null,
    valueEnumDescriptions: template?.valueEnumDescriptions,
  }
}

export const sortScenarioDesignColumns = <Column extends ScenarioDesignColumn>(columns: Column[]): Column[] =>
  [...columns].sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER))

export const createScenarioDesignColumns = (
  dimensionColumns: ScenarioDimensionColumn[] = [],
  templates: ScenarioDimensionTemplateItem[] = [],
): ScenarioDesignColumn[] =>
  sortScenarioDesignColumns(
    dimensionColumns.flatMap((column) => {
      const nextColumn = createScenarioDesignColumn(column, templates)
      return nextColumn ? [nextColumn] : []
    }),
  )

export const createScenarioDesignTemplateColumns = (
  templates: ScenarioDimensionTemplateItem[] = [],
  visibleColumns: ScenarioDesignColumn[] = [],
): ScenarioDesignColumn[] => {
  const visibleColumnKeys = new Set(visibleColumns.map((column) => column.key))

  return sortScenarioDesignColumns(
    templates
      .filter((template) => {
        const key = getScenarioDesignTemplateKey(template)
        return key.length > 0 && !visibleColumnKeys.has(key)
      })
      .map((template) => ({
        key: getScenarioDesignTemplateKey(template),
        label: getScenarioDesignTemplateLabel(template),
        width: '200px',
        required: template.required,
        displayOrder: template.displayOrder,
        valueEnums: template.valueEnums,
        description: template.description?.trim() || null,
        valueEnumDescriptions: template.valueEnumDescriptions,
      })),
  )
}

export const isScenarioDesignRequiredColumn = (column: ScenarioDesignColumn) => column.required === true

export const getScenarioDesignRowId = (row: DesignScenarioRow, fallback = 0) => row.scenarioId ?? row.displayOrder ?? fallback

export const getScenarioDesignDimension = (row: DesignScenarioRow, key: string) =>
  row.dimensions?.find((dimension) => dimension.key === key)

export const getScenarioDesignDimensionSelectedValue = (row: DesignScenarioRow, key: string) => {
  const value = getScenarioDesignDimension(row, key)?.value
  if (value === undefined || value === null || value === '') return ''
  return value
}

export const getScenarioDesignDimensionRationale = (row: DesignScenarioRow, key: string) =>
  getScenarioDesignDimension(row, key)?.rationale?.trim() || ''

export const getScenarioDesignColumnValueDescription = (column: ScenarioDesignColumn, value: string) =>
  column.valueEnumDescriptions?.[value]?.trim() || ''

export const getScenarioDesignColumnItems = (column: ScenarioDesignColumn): SelectMenuItem<string>[] =>
  (column.valueEnums ?? [])
    .filter(
      (value) => value !== SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value && value !== SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.label,
    )
    .map((value) => ({ value, label: value }))

const getScenarioDesignColumnValueLabel = (column: ScenarioDesignColumn, value: string) =>
  String(getScenarioDesignColumnItems(column).find((item) => item.value === value)?.label ?? value)

export const getScenarioDesignColumnDisplayValue = (column: ScenarioDesignColumn, row: DesignScenarioRow) => {
  const dimension = getScenarioDesignDimension(row, column.key)
  const selectedValue = getScenarioDesignDimensionSelectedValue(row, column.key)
  if (selectedValue === SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value) return SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.label
  if (selectedValue === '') return ''

  return String(dimension?.valueLabel?.trim() || getScenarioDesignColumnValueLabel(column, selectedValue))
}

export const getInitialScenarioDesignColumnValue = (
  initialRows: DesignScenarioRow[],
  row: DesignScenarioRow,
  column: ScenarioDesignColumn,
) => {
  const rowId = getScenarioDesignRowId(row)
  const initialRow = initialRows.find((item, index) => getScenarioDesignRowId(item, index + 1) === rowId)
  if (!initialRow) return ''

  return getScenarioDesignDimensionSelectedValue(initialRow, column.key)
}

export const updateScenarioDesignRowScenarioName = (row: DesignScenarioRow, scenarioName: string): DesignScenarioRow => ({
  ...row,
  scenarioName,
})

export const updateScenarioDesignRowDimension = (
  row: DesignScenarioRow,
  column: ScenarioDesignColumn,
  value: string,
): DesignScenarioRow => {
  const nextDimensions = [...(row.dimensions ?? [])]
  const dimensionIndex = nextDimensions.findIndex((dimension) => dimension.key === column.key)
  const isAgentValue = value === SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value
  const isEmptyValue = value === ''
  const nextDimension: ScenarioDimension = {
    key: column.key,
    label: column.label,
    value,
    valueLabel: isAgentValue || isEmptyValue ? null : getScenarioDesignColumnValueLabel(column, value),
    rationale: isAgentValue || isEmptyValue ? null : getScenarioDesignColumnValueDescription(column, value) || null,
  }

  if (dimensionIndex >= 0) {
    nextDimensions[dimensionIndex] = {
      ...nextDimensions[dimensionIndex],
      ...nextDimension,
    }
  } else {
    nextDimensions.push(nextDimension)
  }

  return {
    ...row,
    dimensions: nextDimensions,
  }
}

export const createScenarioDesignRow = (
  displayOrder: number,
  columns: ScenarioDesignColumn[],
  agentColumnKeys: Set<string> = new Set(),
): DesignScenarioRow => ({
  scenarioId: null,
  isNew: true,
  displayOrder,
  scenarioName: '',
  baseCase: false,
  dimensions: columns.map((column) => ({
    key: column.key,
    label: column.label,
    value: agentColumnKeys.has(column.key) ? SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value : '',
    valueLabel: null,
  })),
})

export const createScenarioDesignEditTable = (columns: ScenarioDesignColumn[], rows: DesignScenarioRow[]): DesignEditTable => ({
  dimensionColumns: columns.map((column) => ({
    key: column.key,
    label: column.label,
  })),
  scenarios: rows.map((row, index) => ({
    scenarioId: row.scenarioId ?? null,
    displayOrder: row.displayOrder ?? index + 1,
    scenarioName: row.scenarioName ?? '',
    dimensions: columns.map((column) => {
      const selectedValue = getScenarioDesignDimensionSelectedValue(row, column.key)
      const isAgentValue = selectedValue === SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value
      const isEmptyValue = selectedValue === ''

      return {
        key: column.key,
        label: column.label,
        value: isAgentValue ? null : selectedValue,
        valueLabel: isAgentValue || isEmptyValue ? null : getScenarioDesignColumnValueLabel(column, selectedValue),
      }
    }),
  })),
})

export const SCENARIO_DESIGN_SECTIONS = [
  { id: 'scenario-design-section-base-event', label: 'Base Event' },
  { id: 'scenario-design-section-rationale', label: '설계 근거' },
  { id: 'scenario-design-section-criteria', label: '분기 항목 및 분기 기준 검토' },
]
