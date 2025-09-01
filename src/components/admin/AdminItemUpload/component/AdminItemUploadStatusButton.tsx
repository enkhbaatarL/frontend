import { Typography } from '@mui/material'

import LoadingIcon from '@/components/common/icons/LoadingIcon'
import SuccessIconSm from '@/components/common/icons/SuccessIconSm'
import WarningIconRed from '@/components/common/icons/WarningIconRed'

const AdminItemUploadStatusButton = ({
  checkFile,
  progressValue,
  nameStatus,
}: {
  checkFile: 'uploading' | 'checking' | 'fail' | 'pass'
  progressValue?: number
  nameStatus?: string
}) => {
  const baseStyle = { marginLeft: 8, cursor: 'auto', width: 'auto', height: 'auto' }
  const label =
    nameStatus ??
    {
      uploading: '업로드 중',
      checking: '검수 중',
      fail: '검수 에러',
      pass: '성공',
    }[checkFile ?? 'uploading']

  return (
    <div style={baseStyle} className="upload-field-file-action">
      {checkFile === 'checking' && <LoadingIcon style={{ marginRight: 4, animation: 'spin 2.2s linear infinite' }} />}
      {checkFile === 'fail' && <WarningIconRed style={{ marginRight: 4 }} />}
      {checkFile === 'pass' && <SuccessIconSm style={{ marginRight: 4 }} />}
      {checkFile === 'uploading' && <Typography color="gray.60" variant="helperText">{`${progressValue}%`}</Typography>}
      {label}
    </div>
  )
}

export default AdminItemUploadStatusButton
