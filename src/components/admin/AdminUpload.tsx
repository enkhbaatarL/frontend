import { useEffect, DragEvent, ChangeEvent, useState, useRef, useCallback } from 'react'
import '@/styles/upload-field.scss'

export interface FileInfo {
  id?: string
  name: string
  size: number
  type: string
  url: string
}
interface FileItem {
  file?: File
  info: FileInfo
  preview: string
  starred?: boolean
  default?: boolean
}

interface UploadFieldProps {
  labelSub?: string
  required?: boolean
  maxSize?: number // in MB
  minWidth?: number // in pixels
  acceptedTypes?: string[]
  multiple?: boolean
  onChange?: (files: (File | FileInfo)[]) => void
  defaultFiles?: FileInfo[]
  disabled?: boolean
  isDone?: boolean
}

const UploadField = ({
  maxSize = 20, // Default 20MB
  minWidth = 700, // Default 700px
  acceptedTypes = ['image/jpeg', 'image/png'],
  multiple = false,
  onChange,
  disabled = false,
  defaultFiles = [],
}: UploadFieldProps) => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initializedRef = useRef(false)

  useEffect(() => {
    if (defaultFiles.length > 0 && !initializedRef.current) {
      const fileItems: FileItem[] = defaultFiles.map((fileInfo) => ({
        info: fileInfo,
        preview: fileInfo.url,
        default: true,
      }))

      setFiles(fileItems)
      initializedRef.current = true

      if (onChange) {
        onChange(defaultFiles)
      }
    }
  }, [defaultFiles, onChange])

  const handleFileValidation = useCallback(
    (file: File): Promise<string | null> =>
      new Promise((resolve) => {
        // Check file type
        if (!acceptedTypes.includes(file.type)) {
          resolve(
            `${file.name}은(는) 지원되지 않는 파일 형식입니다. ${acceptedTypes
              .map((type) => type.split('/')[1])
              .join(', ')} 파일만 허용됩니다.`,
          )

          return
        }

        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          resolve(`${file.name}의 크기가 너무 큽니다. 최대 ${maxSize}MB까지 허용됩니다.`)

          return
        }

        // Check image dimensions for image files
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
      }),
    [acceptedTypes, maxSize, minWidth],
  )

  const processFiles = useCallback(
    async (fileList: FileList) => {
      setError(null)
      const newFiles: FileItem[] = []
      const filesToAdd: (File | FileInfo)[] = []

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const validationResult = await handleFileValidation(file)

        if (validationResult) {
          setError(validationResult)
          continue
        }

        // Create preview for images
        let preview = ''

        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file)
        }

        // Tạo FileInfo từ File
        const fileInfo: FileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: preview,
        }

        newFiles.push({ file, info: fileInfo, preview, default: false })
        console.log('>>>>', newFiles)
        filesToAdd.push(file)
      }

      if (newFiles.length > 0) {
        if (!multiple) {
          // If not multiple, replace existing files
          setFiles(newFiles)
          if (onChange) onChange(filesToAdd)
        } else {
          // If multiple, add to existing files
          setFiles((prev) => [...newFiles, ...prev])
          if (onChange) {
            // Combine existing files with new files for onChange
            const allFiles = [...files.map((f) => (f.file ? f.file : f.info)), ...filesToAdd]

            onChange(allFiles)
          }
        }
      }
    },
    [handleFileValidation, multiple, onChange, files],
  )

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles],
  )

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
      }
    },
    [processFiles],
  )

  const handleRemoveFile = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const newFiles = [...prev]

        // Revoke object URL to prevent memory leaks
        if (newFiles[index].file && newFiles[index].preview) {
          URL.revokeObjectURL(newFiles[index].preview)
        }
        newFiles.splice(index, 1)

        // Call onChange with updated files
        if (onChange) {
          const remainingFiles = newFiles.map((item) => (item.file ? item.file : item.info))

          onChange(remainingFiles)
        }

        return newFiles
      })
    },
    [onChange],
  )

  const handleClickUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      )
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )
  }

  const getStarIcon = () => (
    <svg style={{ marginRight: 4 }} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM6.9675 12.2175L4.275 9.525C3.9825 9.2325 3.9825 8.76 4.275 8.4675C4.5675 8.175 5.04 8.175 5.3325 8.4675L7.5 10.6275L12.66 5.4675C12.9525 5.175 13.425 5.175 13.7175 5.4675C14.01 5.76 14.01 6.2325 13.7175 6.525L8.025 12.2175C7.74 12.51 7.26 12.51 6.9675 12.2175Z"
        fill="#0CA678"
      />
    </svg>
  )

  const getCloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M15.2501 4.7599C14.9251 4.4349 14.4001 4.4349 14.0751 4.7599L10.0001 8.82656L5.9251 4.75156C5.6001 4.42656 5.0751 4.42656 4.7501 4.75156C4.4251 5.07656 4.4251 5.60156 4.7501 5.92656L8.8251 10.0016L4.7501 14.0766C4.4251 14.4016 4.4251 14.9266 4.7501 15.2516C5.0751 15.5766 5.6001 15.5766 5.9251 15.2516L10.0001 11.1766L14.0751 15.2516C14.4001 15.5766 14.9251 15.5766 15.2501 15.2516C15.5751 14.9266 15.5751 14.4016 15.2501 14.0766L11.1751 10.0016L15.2501 5.92656C15.5668 5.6099 15.5668 5.07656 15.2501 4.7599Z"
        fill="#868E96"
      />
    </svg>
  )

  const getUploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M19.41 7.41L14.58 2.58C14.21 2.21 13.7 2 13.17 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8.83C20 8.3 19.79 7.79 19.41 7.41ZM14.8 15H13V18C13 18.55 12.55 19 12 19C11.45 19 11 18.55 11 18V15H9.21C8.76 15 8.54 14.46 8.86 14.15L11.66 11.36C11.86 11.17 12.17 11.17 12.37 11.36L15.16 14.15C15.46 14.46 15.24 15 14.8 15ZM14 9C13.45 9 13 8.55 13 8V3.5L18.5 9H14Z"
        fill="#868E96"
      />
    </svg>
  )

  return (
    <div className="upload-field-container">
      {!disabled && (
        <div
          className={`upload-field-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClickUpload}
        >
          <div className="upload-field-content">
            {getUploadIcon()}
            <div className="upload-field-text">파일을 드래그하여 업로드하거나 클릭하여 파일을 첨부하세요.</div>
            <div className="upload-field-size-limit">(최대 8MB)</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            multiple={multiple}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {error && <div className="upload-field-error">{error}</div>}

      {files.length > 0 && (
        <div style={{ marginTop: disabled ? 0 : 16 }} className="upload-field-file-list">
          {files.map((fileItem, index) => (
            <div key={index} className="upload-field-file-item">
              {fileItem.preview ? (
                <img src={fileItem.preview || '/placeholder.svg'} alt={fileItem.info.name} className="upload-field-file-preview" />
              ) : (
                <div className="upload-field-file-icon">{getFileIcon(fileItem.info.type)}</div>
              )}
              <div className="upload-field-file-info">
                <div className="upload-field-file-name">{fileItem.info.name} </div>
                <div className="upload-field-file-size">
                  {formatFileSize(fileItem.info.size)} {fileItem.default}
                </div>
              </div>

              <button type="button" className="upload-field-file-action">
                {getStarIcon()} 완료
              </button>

              {!disabled && (
                <button
                  type="button"
                  className="upload-field-file-action"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile(index)
                  }}
                >
                  {getCloseIcon()}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UploadField
