import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { Box, Chip } from '@mui/material'
import { ChangeEvent, useCallback, useRef, useState } from 'react'

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
  disabled?: boolean
  isDone?: boolean
}

const AdminUpload = ({
  maxSize = 20, // Default 20MB
  minWidth = 700, // Default 700px
  acceptedTypes = ['*'],
  multiple = false,
  disabled,
  onUploadAction,
}: UploadFieldProps) => {
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  /** 파일 선택 이벤트 */
  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target?.files?.[0]) {
      const selectedFile = e.target.files[0]
      const errorMsg = await handleFileValidation(selectedFile)
      if (errorMsg) {
        showSnackbar(errorMsg, { variant: 'error' })
        return
      }
      bufferFile.current = selectedFile
      setFileInfo({ name: selectedFile.name, size: selectedFile.size })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /** 선택 파일 업로드 */
  const handleUpload = () => {
    if (!bufferFile.current) return
    setFileInfo(null)
    onUploadAction(bufferFile.current)
    bufferFile.current = null
  }

  const handleRemoveFileName = () => {
    setFileInfo(null)
    setError(null)
    bufferFile.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="upload-field-container">
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        <div className={disabled ? 'disabled-input' : ''}>
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
        </div>
      </>

      {error && <div className="upload-field-error">{error}</div>}
    </div>
  )
}

export default AdminUpload
