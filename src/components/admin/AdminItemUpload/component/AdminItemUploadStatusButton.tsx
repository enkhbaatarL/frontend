import { Typography } from '@mui/material'

import LoadingIcon from '@/components/common/icons/LoadingIcon'
import SuccessIconSm from '@/components/common/icons/SuccessIconSm'
import WarningIconRed from '@/components/common/icons/WarningIconRed'

const AdminItemUploadStatusButton = ({
  checkFile,
  progressValue,
  uploadError,
  nameStatus,
}: {
  checkFile: 'uploading' | 'checking' | 'fail' | 'pass'
  progressValue?: number
  uploadError: boolean
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

  switch (checkFile) {
    case 'checking':
      return (
        <button style={baseStyle} className="upload-field-file-action">
          <LoadingIcon style={{ marginRight: 4, animation: 'spin 2.2s linear infinite' }} />
          {label}
        </button>
      )
    case 'fail':
      return (
        <button style={baseStyle} className="upload-field-file-action">
          <WarningIconRed style={{ marginRight: 4 }} />
          {label}
        </button>
      )
    case 'pass':
      return (
        <button style={baseStyle} className="upload-field-file-action">
          <SuccessIconSm style={{ marginRight: 4 }} />
          {label}
        </button>
      )
    case 'uploading':
      return (
        <>
          {!uploadError && !!progressValue && <Typography color="gray.60" variant="helperText">{`${progressValue}%`}</Typography>}
          <button style={baseStyle} className="upload-field-file-action">
            {uploadError ? (
              <>
                <WarningIconRed style={{ marginRight: 4 }} />
                {label || '실패'}
              </>
            ) : (
              <>
                {progressValue && progressValue >= 100 && <SuccessIconSm style={{ marginRight: 4 }} />}
                {label || (progressValue && progressValue < 100 ? '업로드 중' : '완료')}
              </>
            )}
          </button>
        </>
      )
    default:
      return null
  }
}

export default AdminItemUploadStatusButton
