import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { Box, Chip } from '@mui/material'
import { useCallback, useRef, useState } from 'react'

import '@/styles/upload-field.scss'
import MIButton from '@/components/common/button/MIButton'
import Flex from '@/components/common/display/Flex'
import CancelIcon from '@/components/common/icons/CancelIcon'
import UploadIcon from '@/components/common/icons/UploadIcon'
import useSnackbar from '@/hooks/useSnackbar'

export interface FileInfo {
  id?: string
  name: string
  size: number
  type: string
  url: string
}
interface UploadFieldProps {
  labelSub?: string
  required?: boolean
  maxSize?: number // in MB
  minWidth?: number // in pixels
  acceptedTypes?: string[]
  multiple?: boolean
  onUploadAction: (file: File) => void
  defaultFiles?: FileInfo[]
  draggable?: boolean
  disabled?: boolean
  isDone?: boolean
}

const getUploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M19.41 7.41L14.58 2.58C14.21 2.21 13.7 2 13.17 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8.83C20 8.3 19.79 7.79 19.41 7.41ZM14.8 15H13V18C13 18.55 12.55 19 12 19C11.45 19 11 18.55 11 18V15H9.21C8.76 15 8.54 14.46 8.86 14.15L11.66 11.36C11.86 11.17 12.17 11.17 12.37 11.36L15.16 14.15C15.46 14.46 15.24 15 14.8 15ZM14 9C13.45 9 13 8.55 13 8V3.5L18.5 9H14Z"
      fill="#868E96"
    />
  </svg>
)

const AdminUpload = ({
  maxSize = 20, // Default 20MB
  minWidth = 700, // Default 700px
  acceptedTypes = ['*'],
  draggable,
  multiple = false,
  disabled,
  onUploadAction,
}: UploadFieldProps) => {
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { showSnackbar } = useSnackbar()
  const handleFileValidation = useCallback(
    (file: File): Promise<string | null> =>
      new Promise((resolve) => {
        if (!acceptedTypes.includes(file.type)) {
          resolve(
            `${file.name}은(는) 지원되지 않는 파일 형식입니다. ${acceptedTypes
              .map((type) => type.split('/')[1])
              .join(', ')} 파일만 허용됩니다.`,
          )
          return
        }
        if (file.size > maxSize * 1024 * 1024) {
          resolve(`${file.name}의 크기가 너무 큽니다. 최대 ${maxSize}MB까지 허용됩니다.`)
          return
        }
        if (file.type.startsWith('image/')) {
          const img = new Image()

          img.onload = () => {
            URL.revokeObjectURL(img.src)
            if (img.width < minWidth) {
              resolve(`${file.name}의 너비가 너무 작습니다. 최소 ${minWidth}px 이상이어야 합니다.`)
            } else {
              resolve(null)
            }
          }
          img.onerror = () => {
            URL.revokeObjectURL(img.src)
            resolve('이미지를 로드하는 중 오류가 발생했습니다.')
          }
          img.src = URL.createObjectURL(file)
        } else {
          resolve(null)
        }
        resolve(null)
      }),
    [acceptedTypes, maxSize, minWidth],
  )
  /** 파일 업로드 전 임시 대기 변수 */
  const bufferFile = useRef<File | null>(null)

  /** 선택 파일 업로드 */
  const handleUpload = () => {
    if (!bufferFile.current) return
    setFileInfo(null)
    onUploadAction(bufferFile.current)
    bufferFile.current = null
  }

  /** 파일 선택 이벤트 */
  const handleFileInputChange = async (files: FileList | null) => {
    if (files?.[0]) {
      const selectedFile = files[0]
      const errorMsg = await handleFileValidation(selectedFile)
      if (errorMsg) {
        showSnackbar(errorMsg, { variant: 'error' })
        return
      }
      bufferFile.current = selectedFile
      setFileInfo({ name: selectedFile.name, size: selectedFile.size })
      if (draggable) handleUpload()
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveFileName = () => {
    setFileInfo(null)
    setError(null)
    bufferFile.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileInputChange(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  return (
    <div className="upload-field-container">
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={(e) => handleFileInputChange(e.target?.files)}
          style={{ display: 'none' }}
        />

        <div className={disabled ? 'disabled-input' : ''}>
          {draggable && (
            <div
              className={`upload-field-dropzone ${isDragging ? 'dragging' : ''}`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={() => setIsDragging(false)}
              onClick={(e) => {
                e.preventDefault()
                fileInputRef.current?.click()
              }}
            >
              <div className="upload-field-content">
                {getUploadIcon()}
                <div className="upload-field-text">파일을 드래그하여 업로드하거나 클릭하여 파일을 첨부하세요.</div>
                <div className="upload-field-size-limit">(최대 8MB)</div>
              </div>
            </div>
          )}
          {!draggable && (
            <Flex direction="row" align="start" gap={2}>
              <Box className="InputUploadBox" display="flex" alignItems="center" gap={2} width={'100%'}>
                {!fileInfo && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}>
                    <FolderOpenIcon fontSize="small" />
                    파일을 등록하세요.
                  </button>
                )}
                {fileInfo && (
                  <Chip
                    icon={<FolderOpenIcon fontSize="small" />}
                    label={fileInfo.name}
                    onDelete={handleRemoveFileName}
                    deleteIcon={<CancelIcon style={{ marginLeft: '8px', marginRight: 0, color: '#868E96' }} />}
                    sx={{
                      paddingRight: '4px',
                      color: '#495057',
                      fontSize: 14,
                      fontWeight: '400',
                      padding: '6px 11px',
                      height: 'auto',
                      width: '100%',
                      justifyContent: 'space-between',
                      backgroundColor: 'transparent',
                      '.MuiChip-label': {
                        paddingRight: '4px',
                        maxWidth: '220px',
                        marginRight: 'auto',
                      },
                      '.MuiSvgIcon-root': {
                        marginLeft: 0,
                        color: '#868E96',
                      },
                      '.MuiChip-deleteIcon': {
                        marginLeft: 'auto',
                      },
                    }}
                  />
                )}
              </Box>
              <Box width={34}>
                <MIButton
                  disabled={!fileInfo}
                  onClick={(e) => {
                    e.preventDefault()
                    handleUpload()
                  }}
                  startIcon={<UploadIcon style={{ color: '#CED4DA' }} fontSize="small" />}
                  contentType={'icon'}
                  type="outlined"
                />
              </Box>
            </Flex>
          )}
        </div>
      </>

      {error && <div className="upload-field-error">{error}</div>}
    </div>
  )
}

export default AdminUpload
