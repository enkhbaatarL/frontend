import { createElement, type ComponentType } from 'react'

import type {
  FundamentalModelSheetData,
  FundamentalModelSheetDataRow,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'
import type { SummaryTemplateCoordinates } from '@/pages/mi/fundamentalModel/components/sheetTemplates/summaryTemplateCoordinates'
import type { MonthlyColumn } from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/LiqUtilAdjustment/monthlyLNGTrainUtilizationLayout'
import type { RegasYearField } from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/regasRowLink'

export type FundamentalModelInputKind = 'DEMAND' | 'SUPPLY' | 'TRADE' | 'OUTPUT'

export interface SheetTemplateDraft {
  monthlyColumns?: MonthlyColumn[]
  rows: FundamentalModelSheetDataRow[]
  headerRows?: FundamentalModelSheetDataRow[]
  addedColumns?: Array<{ field: string; label: string; year?: string; month?: string; period?: string }>
  addedRowIds?: number[]
  annualYearFields?: RegasYearField[]
}

export interface SheetTemplateProps {
  data: FundamentalModelSheetData
  restrictColumnChangesToEnd?: boolean
  draft?: SheetTemplateDraft
  linkedSourceDraft?: SheetTemplateDraft
  linkedSourceData?: FundamentalModelSheetData
  onDraftChange?: (draft: SheetTemplateDraft) => void
}

// Matches the proposed SheetTable schema in docs/ko/fundamental-model-sheet-api.openapi.yaml.
export interface SheetTemplate {
  id: string
  kind: FundamentalModelInputKind
  sheetName: string
  name: string
  description: string
  location: string
  rowPolicy: string
  columnPolicy: string
  coordinates?: SummaryTemplateCoordinates
}

export interface SheetCatalog {
  tables: SheetTemplate[]
}

export const getSheetTemplates = (catalog: SheetCatalog, kind: FundamentalModelInputKind) =>
  catalog.tables.filter((template) => template.kind === kind)

export const getTemplateSheetNames = (catalog: SheetCatalog, kind: FundamentalModelInputKind) => [
  ...new Set(getSheetTemplates(catalog, kind).map((template) => template.sheetName)),
]

export const getSheetTableTemplates = (catalog: SheetCatalog, kind: FundamentalModelInputKind, sheetName: string) =>
  getSheetTemplates(catalog, kind).filter((template) => template.sheetName === sheetName)

export const loadSheetTemplate = async (template: SheetTemplate): Promise<{ default: ComponentType<SheetTemplateProps> }> => {
  if (template.id === 'SUPPLY/LiqUtilAdjustment/Monthly LNG Train Utilization')
    return import('@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/LiqUtilAdjustment/MonthlyLNGTrainUtilization')
  if (template.id === 'SUPPLY/BCRegasification/Annual Regas Capacity Baseline')
    return import('@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/BCRegasification/AnnualRegasCapacityBaseline')
  if (template.id === 'SUPPLY/RegasAdjustment/Monthly Regas Capacity Adjustment')
    return import('@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/RegasAdjustment/MonthlyRegasCapacityAdjustment')

  const { default: SummarySheetTemplate } = await import('@/pages/mi/fundamentalModel/components/sheetTemplates/SummarySheetTemplate')
  return { default: (props: SheetTemplateProps) => createElement(SummarySheetTemplate, { ...props, template }) }
}
