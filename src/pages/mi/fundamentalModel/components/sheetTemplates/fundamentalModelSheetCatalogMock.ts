import type {
  SheetCatalog,
  SheetTemplate,
  FundamentalModelInputKind,
} from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import { sheetTableOrder } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTableOrder'
import { summaryTemplateCoordinates } from '@/pages/mi/fundamentalModel/components/sheetTemplates/summaryTemplateCoordinates'
import { summaryTemplateDefinitions } from '@/pages/mi/fundamentalModel/components/sheetTemplates/summaryTemplateDefinitions'

// Temporary catalog response. The array order is the sheet and table display order.
export const getFundamentalModelSheetCatalog = async (): Promise<SheetCatalog> => ({
  tables: Object.entries(sheetTableOrder).flatMap(([sheetKey, tableNames]) => {
    const [kind, sheetName] = sheetKey.split('/') as [FundamentalModelInputKind, string]
    return tableNames.map((name): SheetTemplate => {
      const id = `${sheetKey}/${name}`
      const definition = summaryTemplateDefinitions[id]
      if (!definition) throw new Error(`시트 테이블 정의가 없습니다: ${id}`)
      return {
        id,
        kind,
        sheetName,
        ...definition,
        coordinates: summaryTemplateCoordinates[id],
      }
    })
  }),
})
