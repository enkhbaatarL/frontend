import dayjs from 'dayjs'
import { ButtonHTMLAttributes } from 'react'
import * as XLSX from 'xlsx-js-style'

import MIButton from '@/components/common/button/MIButton'
import { IConversation } from '@/hooks/useMIAgent'
import { StreamEventType } from '@/service/mi/agent'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'data-table-id'?: string
}

interface TableDownloadButtonProps extends ButtonProps {
  tables: NonNullable<IConversation['answer']>[StreamEventType.TABLE]
  chatRoomTitle?: string
}

export const MIAgentTableDownloadButton = ({ tables, chatRoomTitle, ...props }: TableDownloadButtonProps) => {
  const table = tables.find((table) => table.tableId === props['data-table-id'])

  if (!table) return null

  const handleDownload = () => {
    const headers = table.headers.map((header) => header.name)
    const rows = table.rows.map((row) => row.cells)

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
