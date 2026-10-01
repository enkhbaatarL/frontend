import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import OutputSheetTable from '@/pages/mi/fundamentalModel/components/sheetTemplates/Output/OutputSheetTable'

const AnnualPriceCalcSpread = (props: SheetTemplateProps) => (
  <OutputSheetTable
    {...props}
    firstColumn={5}
    lastColumn={6}
    firstRow={49}
    lastRow={49}
    headers={['East Asia Spot–TTF spread', 'TTF–East Asia Spot spread']}
  />
)

export default AnnualPriceCalcSpread
