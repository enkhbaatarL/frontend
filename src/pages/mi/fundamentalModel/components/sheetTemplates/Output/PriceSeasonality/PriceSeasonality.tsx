import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import OutputSheetTable from '@/pages/mi/fundamentalModel/components/sheetTemplates/Output/OutputSheetTable'

const PriceSeasonality = (props: SheetTemplateProps) => (
  <OutputSheetTable {...props} firstColumn={1} lastColumn={14} firstRow={1} lastRow={4} />
)

export default PriceSeasonality
