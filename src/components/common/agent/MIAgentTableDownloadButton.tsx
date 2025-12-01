import dayjs from 'dayjs'
import { ButtonHTMLAttributes } from 'react'
import * as XLSX from 'xlsx-js-style'

import MIButton from '@/components/common/button/MIButton'
import { ParsedTable } from '@/utils/agentMarkdownExtractor'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'data-table-id'?: string
}

interface TableDownloadButtonProps extends ButtonProps {
  markdownTables?: ParsedTable[]
  chatRoomTitle?: string
}

export const MIAgentTableDownloadButton = ({ markdownTables, chatRoomTitle, ...props }: TableDownloadButtonProps) => {
  const markdownTable = markdownTables?.find((t) => t.tableId === props['data-table-id'])

  if (!markdownTable) return null

  const handleDownload = () => {
    const headers = markdownTable.headers
    const rows = markdownTable.rows

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

    XLSX.utils.book_append_sheet(wb, ws, 'Table Data')

    const titlePrefix = chatRoomTitle ? `${chatRoomTitle}_` : ''
    const fileName = `${titlePrefix}Table_${dayjs().format('YYYY-MM-DD')}.xlsx`

    XLSX.writeFile(wb, fileName)
  }

  return (
    <MIButton
      placement="right"
      type="ghost"
      color="gray"
      contentType="icon"
      toolTip="Download"
      toolTipProps={{ disableInteractive: true }}
      onClick={handleDownload}
    >
      {props.children}
    </MIButton>
  )
}
