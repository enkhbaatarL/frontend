import '@/styles/upload-field.scss'
import LinearProgress from '@mui/material/LinearProgress'
import { useMemo } from 'react'

import AdminItemUploadStatusButton from './component/AdminItemUploadStatusButton'

import Flex from '@/components/common/display/Flex'
import CloseIcon from '@/components/common/icons/CloseIcon'

export type FileType =
  | 'application/pdf'
  | 'text/csv'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-powerpoint'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'image/jpeg'

export interface FileInfo {
  fileNo: number
  componentTypeId?: string
  fileNm: string
  fileSize: number
  url?: string
  type: FileType
}

interface UploadStatus {
  progressValue?: number
  uploadError?: boolean
  checkFile?: 'uploading' | 'checking' | 'fail' | 'pass'
  nameStatus?: string
  hideStatus?: boolean
  hideClose?: boolean
  widthItem?: string | number
  onDelete?: () => void
  fileItem: FileInfo
}

const fileTypeIconMapper = (type: FileType, url?: string) => {
  if (url) return url
  const icons: Record<FileType, string> = {
    'application/pdf': '/src/assets/pdficon.svg',
    'text/csv': '/src/assets/fileicon.svg',
    'application/msword': '/src/assets/docicon.svg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '/src/assets/docicon.svg',
    'image/jpeg': '/src/assets/folder.svg',
    'application/vnd.ms-excel': '/src/assets/docicon.svg',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '/src/assets/docicon.svg',
    'application/vnd.ms-powerpoint': '/src/assets/docicon.svg',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '/src/assets/docicon.svg',
  }
  return icons[type] || '/src/assets/folder.svg'
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const AdminItemUpload = ({
  progressValue = 0,
  uploadError = false,
  checkFile = 'uploading',
  nameStatus,
  hideStatus = false,
  hideClose = false,
  widthItem = '100%',
  onDelete,
  fileItem,
}: UploadStatus) => {
  const statusLabel = useMemo(() => {
    if (checkFile === 'uploading' && progressValue === 100) return 'checking'
    return checkFile
  }, [progressValue, checkFile])

  const iconSrc = useMemo(() => fileTypeIconMapper(fileItem.type, fileItem.url), [fileItem.type, fileItem.url])
  return (
    <div className="upload-field-file-item" style={{ width: widthItem }}>
      <img src={iconSrc} className="upload-field-file-preview" />

      <div className="flex-grow-1">
        <Flex>
          <div className="upload-field-file-info">
            <div className="upload-field-file-name">{fileItem.fileNm}</div>
            {!uploadError && <div className="upload-field-file-size">{formatFileSize(fileItem.fileSize)}</div>}
          </div>
          {!hideStatus && (
            <AdminItemUploadStatusButton
              checkFile={statusLabel}
              progressValue={progressValue}
              uploadError={uploadError}
              nameStatus={nameStatus}
            />
          )}
          {!hideClose && (
            <button type="button" className="upload-field-file-action upload-field-file-action-del" onClick={onDelete}>
              <CloseIcon width={20} height={20} />
            </button>
          )}
        </Flex>
        {progressValue !== 0 && statusLabel === 'uploading' && (
          <LinearProgress color={uploadError ? 'error' : 'primary'} sx={{ marginTop: 1 }} variant="determinate" value={progressValue} />
        )}
      </div>
    </div>
  )
}

export default AdminItemUpload
