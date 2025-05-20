import '@/styles/upload-field.scss'
import LinearProgress from '@mui/material/LinearProgress'
import { useMemo } from 'react'

import AdminItemUploadStatusButton from './component/AdminItemUploadStatusButton'

import docIcon from '@/assets/docicon.svg'
import fileIcon from '@/assets/fileicon.svg'
import folderIcon from '@/assets/folder.svg'
import pdfIcon from '@/assets/pdficon.svg'
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
  | 'image/*'

export interface FileInfo {
  fileNo: number
  componentTypeId?: string
  fileNm: string
  fileSize: number
  fileUrl?: string
  type: FileType
}

interface UploadStatus {
  progressValue?: number
  checkFile?: 'uploading' | 'checking' | 'fail' | 'pass'
  nameStatus?: string
  showChecking?: boolean // 검수중 표기여부
  widthItem?: string | number
  onDelete?: () => void
  fileItem: FileInfo
  readonly?: boolean
}

const fileTypeIconMapper = (type: FileType, url?: string) => {
  if (url) return url
  const icons: Record<FileType, string> = {
    'application/pdf': pdfIcon,
    'text/csv': fileIcon,
    'application/msword': docIcon,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': docIcon,
    'image/*': folderIcon,
    'application/vnd.ms-excel': docIcon,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': docIcon,
    'application/vnd.ms-powerpoint': docIcon,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': docIcon,
  }
  return icons[type] || folderIcon
}

const AdminItemUpload = ({
  progressValue = 0,
  showChecking = false,
  checkFile = 'uploading',
  nameStatus,
  widthItem = '100%',
  onDelete,
  fileItem,
  readonly,
}: UploadStatus) => {
  const statusLabel = useMemo(() => {
    if (showChecking && checkFile === 'uploading' && progressValue === 100) return 'checking'
    return checkFile
  }, [showChecking, checkFile, progressValue])

  const iconSrc = useMemo(() => fileTypeIconMapper(fileItem.type, fileItem.fileUrl), [fileItem.type, fileItem.fileUrl])
  return (
    <div className="upload-field-file-item" style={{ width: widthItem }}>
      <img src={iconSrc} className="upload-field-file-preview" />
      <div className="flex-grow-1">
        <Flex style={{ alignItems: 'center' }}>
          <div className="upload-field-file-info">
            <div className="upload-field-file-name">{fileItem.fileNm}</div>
          </div>
          <AdminItemUploadStatusButton checkFile={statusLabel} progressValue={progressValue} nameStatus={nameStatus} />
          {!readonly && (
            <button type="button" className="upload-field-file-action upload-field-file-action-del" onClick={onDelete}>
              <CloseIcon width={20} height={20} />
            </button>
          )}
        </Flex>
        {progressValue !== 0 && statusLabel === 'uploading' && (
          <LinearProgress color={'primary'} sx={{ marginTop: 1 }} variant="determinate" value={progressValue} />
        )}
      </div>
    </div>
  )
}

export default AdminItemUpload
