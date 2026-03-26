import { v4 as uuid } from 'uuid'

import type { IChartData, IReferenceTableData } from '@/service/mi/newsletter'

/**
 * 과거 레거시 Reference 데이터 구조를 `items[]` 구조로 정규화하기 위한 최소 타입.
 * 서비스 타입에서 별도 export 되지 않으므로 유틸 내부 타입으로 유지합니다.
 */
export type IReferenceBlockItem = {
  blockId: string
  type: 'CHART' | 'TABLE' | 'TEXT'
  chartData?: IChartData | null
  tableData?: IReferenceTableData | null
}

export type IReferenceDataItem = {
  refId?: string
  title?: string
  description?: string
  /** 레거시: items가 없고 chartData/tableData만 존재할 수 있음 */
  items?: IReferenceBlockItem[]
  chartData?: IChartData | null
  tableData?: IReferenceTableData | null
}

/** 레거시 flat reference(items 없음)용. IReferenceDataItem.type deprecated 대체 */
export const inferLegacyReferenceBlockType = (
  chartData?: IChartData | null,
  tableData?: IReferenceDataItem['tableData'] | null,
): IReferenceBlockItem['type'] => {
  const hasChart = (chartData?.series?.length ?? 0) > 0 || (chartData?.timestamps?.length ?? 0) > 0
  const hasTable = (tableData?.rows?.length ?? 0) > 0
  if (hasChart && !hasTable) return 'CHART'
  if (hasTable && !hasChart) return 'TABLE'
  if (hasChart && hasTable) return 'CHART'
  return 'TEXT'
}

/** 레거시 references(items 없음)를 items 구조로 정규화. refId 없으면 생성 */
export const normalizeReference = (ref: IReferenceDataItem | Record<string, unknown>): IReferenceDataItem => {
  const r = ref as IReferenceDataItem
  const base =
    r.items && r.items.length > 0
      ? r
      : (() => {
        const type = inferLegacyReferenceBlockType(r.chartData, r.tableData)
        const chartData = r.chartData ?? { timestamps: [], series: [] }
        const tableData = r.tableData ?? {
          tableId: uuid(),
          headers: [],
          rows: [],
        }
        return {
          title: r.title ?? '',
          description: r.description ?? '',
          items: [{ blockId: uuid(), type, chartData, tableData }],
        }
      })()
  return { ...base, refId: ('refId' in base ? base.refId : undefined) ?? uuid() }
}
