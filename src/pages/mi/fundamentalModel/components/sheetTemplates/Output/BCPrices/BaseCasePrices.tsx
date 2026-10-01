import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import OutputSheetTable from '@/pages/mi/fundamentalModel/components/sheetTemplates/Output/OutputSheetTable'

const BaseCasePrices = (props: SheetTemplateProps) => (
  <OutputSheetTable {...props} firstColumn={1} lastColumn={4} firstRow={7} lastRow={21} />
)

export default BaseCasePrices
