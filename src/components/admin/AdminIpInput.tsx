import { Box, IconButton } from '@mui/material'

import AdminTextField from '@/components/admin/AdminTextField'
import AddIcon from '@/components/common/icons/AddIcon'
import TrashIcon from '@/components/common/icons/TrashIcon'

interface Props {
  ipList?: string[]
  onUpdate: (ipList: string[]) => void
}

interface AdditionalIpItemProps {
  ipIndex: number
  ip: string
  updateHandler: (index: number, ip: string) => void
  deleteHandler: (index: number) => void
}

const AdditionalIpItem = ({ ipIndex, ip, updateHandler, deleteHandler }: AdditionalIpItemProps) => (
  <Box display="flex" width="700px" mt={3} gap="8px">
    <AdminTextField
      sx={{
        '&[aria-readonly="true"] .MuiInputBase-input': {
          background: '#ffffff',
        },
      }}
      fullWidth
      value={ip}
      onChange={(e) => updateHandler(ipIndex, e.target.value)}
    />
    <IconButton
      type="button"
      onClick={() => deleteHandler(ipIndex)}
      style={{
        padding: '6px 10px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
      }}
      aria-label="Delete IP"
    >
      <TrashIcon />
    </IconButton>
  </Box>
)

const AdminIpInput = ({ ipList = [], onUpdate }: Props) => {
  const ipListLength = ipList?.length ?? 0

  const updateHandler = (index: number, ip: string) => {
    const updatedIpList = [...ipList]
    updatedIpList[index] = ip
    onUpdate(updatedIpList)
  }

  const addIpList = () => {
    const updatedIpList = [...ipList, '']
    onUpdate(updatedIpList)
  }

  const deleteHandler = (index: number) => {
    const updatedIpList = [...ipList]
    updatedIpList.splice(index, 1)
    onUpdate(updatedIpList)
  }

  return (
    <>
      <Box display="flex" width="700px" mt={3} gap="8px">
        <AdminTextField fullWidth value={ipList[0] ?? ''} onChange={(e) => updateHandler(0, e.target.value)} placeholder="입력하세요." />
        <IconButton onClick={addIpList}>
          <AddIcon />
        </IconButton>
      </Box>
      {Array.from({ length: ipListLength - 1 })
        .map((_, idx) => idx + 1)
        .map((ipIndex) => (
          <AdditionalIpItem
            key={ipIndex}
            ipIndex={ipIndex}
            ip={ipList[ipIndex] ?? ''}
            updateHandler={updateHandler}
            deleteHandler={deleteHandler}
          />
        ))}
    </>
  )
}

export default AdminIpInput
