import '@/styles/upload-field.scss'
import { Typography } from '@mui/material'
import LinearProgress from '@mui/material/LinearProgress'

import Flex from '@/components/common/display/Flex'
import CloseIcon from '@/components/common/icons/CloseIcon'
import LoadingIcon from '@/components/common/icons/LoadingIcon'
import SuccessIconSm from '@/components/common/icons/SuccessIconSm'
import WarningIconRed from '@/components/common/icons/WarningIconRed'

export interface FileInfo {
  id?: string
  name: string
  size: number
  type: string
  url?: string
}

interface UploadStatus {
  progressValue?: number
  uploadError?: boolean
  checkFile?: 'uploading' | 'checking' | 'fail' | 'pass'
  file?: FileInfo
  nameStatus?: string
  hideStatus?: boolean
  hideClose?: boolean
  widthItem?: string | number
  onDelete?: () => void
}

const AdminItemUpload = ({
  progressValue,
  uploadError = false,
  checkFile = 'uploading',
  file,
  nameStatus,
  hideStatus = false,
  hideClose = false,
  widthItem = '100%',
  onDelete,
}: UploadStatus) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="upload-field-file-item" style={{ width: widthItem }}>
      {file && file.url && <img src={file.url} alt={file?.name} className="upload-field-file-preview" />}

      <div className="flex-grow-1">
        <Flex>
          <div className="upload-field-file-info">
            <div className="upload-field-file-name">{file?.name} </div>
            {!uploadError && <div className="upload-field-file-size">{formatFileSize(file?.size as number)}</div>}
          </div>

          <>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>

            {!hideStatus && (
              <>
                {checkFile === 'checking' && !uploadError && (
                  <button
                    type="button"
                    style={{ marginLeft: 8, cursor: 'auto', width: 'auto', height: 'auto' }}
                    className="upload-field-file-action"
                  >
                    <LoadingIcon style={{ marginRight: 4, animation: 'spin 2.2s linear infinite' }} /> {nameStatus ?? '검수 중'}
                  </button>
                )}

                {checkFile === 'fail' && (
                  <button
                    type="button"
                    style={{ marginLeft: 8, cursor: 'auto', width: 'auto', height: 'auto' }}
                    className="upload-field-file-action"
                  >
                    <WarningIconRed style={{ marginRight: 4 }} /> {nameStatus ?? '검수 에러'}
                  </button>
                )}

                {checkFile === 'pass' && (
                  <button
                    type="button"
                    style={{ marginLeft: 8, cursor: 'auto', width: 'auto', height: 'auto' }}
                    className="upload-field-file-action"
                  >
                    <SuccessIconSm style={{ marginRight: 4 }} /> {nameStatus ?? '성공'}
                  </button>
                )}

                {checkFile === 'uploading' && (
                  <>
                    {!uploadError && !!progressValue && (
                      <Typography color="gray.60" variant="helperText">
                        {progressValue}%
                      </Typography>
                    )}
                    <button
                      type="button"
                      style={{ marginLeft: 8, cursor: 'auto', width: 'auto', height: 'auto' }}
                      className="upload-field-file-action"
                    >
                      {uploadError ? (
                        <>
                          <WarningIconRed style={{ marginRight: 4 }} /> {nameStatus ?? '실패'}
                        </>
                      ) : (
                        <>
                          {progressValue && progressValue >= 100 && <SuccessIconSm style={{ marginRight: 4 }} />}
                          {progressValue && progressValue < 100 ? (nameStatus ?? '업로드 중') : (nameStatus ?? '완료')}
                        </>
                      )}
                    </button>
                  </>
                )}
              </>
            )}
          </>

          {!hideClose && (
            <button type="button" className="upload-field-file-action" onClick={onDelete}>
              <CloseIcon />
            </button>
          )}
        </Flex>
        {progressValue && checkFile === 'uploading' && (
          <LinearProgress color={uploadError ? 'error' : 'primary'} sx={{ marginTop: 1 }} variant="determinate" value={progressValue} />
        )}
      </div>
    </div>
  )
}

export default AdminItemUpload
