import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { Box, Chip } from '@mui/material'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

import CancelIcon from '../common/icons/CancelIcon'

import '@/styles/upload-field.scss'
import AdminItemUpload from '@/components/admin/AdminItemUpload.tsx'

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

export interface UploadFieldRef {
  addPendingFile: () => void
  handleChange?: (files: FileItem[]) => void
}

interface UploadFieldProps {
  labelSub?: string
  required?: boolean
  maxSize?: number // in MB
  minWidth?: number // in pixels
  acceptedTypes?: string[]
  multiple?: boolean
  onChange?: (files: FileItem[]) => void
  onChangeName?: (value: string) => void
  onRemoveName?: (value: string) => void
  defaultFiles?: FileInfo[]
  disabled?: boolean
  isDone?: boolean
  isInput?: boolean
}

const UploadField = forwardRef<UploadFieldRef, UploadFieldProps>(
  (
    {
      maxSize = 20, // Default 20MB
      minWidth = 700, // Default 700px
      acceptedTypes = [
        'image/jpeg', // .jpg, .jpeg
        'image/png', // .png
        'application/pdf', // .pdf
        'text/csv', // .csv
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      ],
      multiple = false,
      onChange,
      onChangeName,
      onRemoveName,
      disabled = false,
      isInput = false,
      defaultFiles = [],
    },
    ref,
  ) => {
    const [files, setFiles] = useState<FileItem[]>([])
    const [fileName, setFileName] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)

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
          const fileItems: FileItem[] = defaultFiles.map((fileInfo) => ({
            info: fileInfo,
            preview: fileInfo.url,
            default: true,
          }))

          onChange(fileItems)
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
          } else if (file.type === 'application/pdf') {
            preview = '/src/assets/pdficon.svg'
          } else if (file.type === 'text/csv') {
            preview = '/src/assets/fileicon.svg'
          } else if (
            file.type === 'application/msword' ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ) {
            preview = '/src/assets/docicon.svg'
          } else {
            preview = '/src/assets/folder.svg' // fallback cho unknown types
          }

          const fileInfo: FileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            url: preview,
          }

          newFiles.push({ file, info: fileInfo, preview, default: false })

          filesToAdd.push(file)
        }

        if (isInput) return

        if (newFiles.length > 0) {
          if (!multiple) {
            // If not multiple, replace existing files
            setFiles(newFiles)

            if (onChange) {
              const fileItems: FileItem[] = filesToAdd.map((file) => {
                const info: FileInfo =
                  file instanceof File
                    ? {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
                    }
                    : file

                return {
                  file: file instanceof File ? file : undefined,
                  info,
                  preview: info.url,
                  default: !(file instanceof File),
                }
              })

              onChange(fileItems)
            }
          } else {
            // If multiple, add to existing files
            setFiles((prev) => [...newFiles, ...prev])
            if (onChange) {
              // Combine existing files with new files for onChange
              const allFiles = [...files.map((f) => (f.file ? f.file : f.info)), ...filesToAdd]

              if (onChange) {
                const fileItems: FileItem[] = allFiles.map((file) => {
                  const isRawFile = file instanceof File

                  const info: FileInfo = isRawFile
                    ? {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
                    }
                    : file

                  return {
                    file: isRawFile ? file : undefined,
                    info,
                    preview: info.url,
                    default: !isRawFile,
                  }
                })

                onChange(fileItems)
              }
            }
          }
        }
      },
      [handleFileValidation, multiple, onChange, files],
    )

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
    }, [])

    const handleDrop = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processFiles(e.dataTransfer.files)
        }
      },
      [processFiles],
    )

    const getUploadProgress = (file: File, onProgress: (percent: number) => void) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()

      formData.append('file', file)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)

          onProgress(percent)
        }
      }

      xhr.open('POST', '/upload') // URL upload server của bạn
      xhr.send(formData)
    }

    const handleFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          const selectedFile = e.target.files[0]

          getUploadProgress(selectedFile, (percent) => {
            console.log('Đang tải:', `${percent}%`)
            // ở đây bạn có thể setState để update % cho progress bar
          })

          processFiles(e.target.files)
          setPendingFile(selectedFile)
          setFileName(selectedFile.name)
          if (onChangeName) {
            onChangeName(selectedFile.name)
          }
        }
      },
      [processFiles, onChangeName],
    )

    const handleAddPendingFile = async () => {
      if (!pendingFile) return

      const validationResult = await handleFileValidation(pendingFile)

      if (validationResult) {
        setError(validationResult)

        return
      }

      let preview = ''

      if (pendingFile.type.startsWith('image/')) {
        preview = URL.createObjectURL(pendingFile)
      } else if (pendingFile.type === 'application/pdf') {
        preview = '/src/assets/pdficon.svg'
      } else if (pendingFile.type === 'text/csv') {
        preview = '/src/assets/fileicon.svg'
      } else if (
        pendingFile.type === 'application/msword' ||
        pendingFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        preview = '/src/assets/docicon.svg'
      } else {
        preview = '/src/assets/folder.svg' // fallback cho unknown types
      }

      const fileInfo: FileInfo = {
        name: pendingFile.name,
        size: pendingFile.size,
        type: pendingFile.type,
        url: preview,
      }

      const newFile: FileItem = {
        file: pendingFile,
        info: fileInfo,
        preview,
        default: false,
      }

      let updatedFiles: FileItem[]

      if (multiple) {
        updatedFiles = [newFile, ...files]
      } else {
        updatedFiles = [newFile]
      }

      setFiles(updatedFiles)

      if (onChange) {
        //const allFiles = updatedFiles.map((f) => f.info)
        // const allFiles: (FileInfo | File)[] = updatedFiles.map((f) => f.file ?? f.info)
        onChange(updatedFiles)
      }

      setPendingFile(null)
      setFileName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    useImperativeHandle(ref, () => ({
      addPendingFile: handleAddPendingFile,
      handleChange: (newFiles: FileItem[]) => {
        setFiles(newFiles)
        onChange?.(newFiles) // if onChange?: (files: FileItem[]) => void
      },
    }))

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
            //const remainingFiles = newFiles.map((item) => item.info)
            //onChange(remainingFiles)
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

    const getUploadIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M19.41 7.41L14.58 2.58C14.21 2.21 13.7 2 13.17 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8.83C20 8.3 19.79 7.79 19.41 7.41ZM14.8 15H13V18C13 18.55 12.55 19 12 19C11.45 19 11 18.55 11 18V15H9.21C8.76 15 8.54 14.46 8.86 14.15L11.66 11.36C11.86 11.17 12.17 11.17 12.37 11.36L15.16 14.15C15.46 14.46 15.24 15 14.8 15ZM14 9C13.45 9 13 8.55 13 8V3.5L18.5 9H14Z"
          fill="#868E96"
        />
      </svg>
    )

    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]

      if (file) {
        setFileName(file.name)
      }
    }

    const handleRemoveFileName = () => {
      setFileName(null)
      setError(null)
      if (pendingFile?.name && typeof onRemoveName === 'function') {
        onRemoveName(pendingFile.name)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    return (
      <div className="upload-field-container" style={{ marginBottom: isInput ? 0 : 20 }}>
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            multiple={multiple}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          {!isInput ? (
            <>
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
                </div>
              )}
            </>
          ) : (
            <div className={disabled ? 'disabled-input' : ''}>
              <Box className="InputUploadBox" display="flex" alignItems="center" gap={2}>
                <input type="file" ref={inputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                {!fileName ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()}>
                    <FolderOpenIcon fontSize="small" />
                    파일을 등록하세요.
                  </button>
                ) : (
                  <Chip
                    icon={<FolderOpenIcon fontSize="small" />}
                    label={fileName}
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
            </div>
          )}
        </>

        {error && <div className="upload-field-error">{error}</div>}

        {!isInput && (
          <>
            {files.length > 0 && (
              <div style={{ marginTop: disabled ? 0 : 16 }} className="upload-field-file-list">
                {files.map((fileItem, index) => (
                  <AdminItemUpload
                    checkFile="pass"
                    hideClose={disabled}
                    key={index}
                    file={fileItem.info}
                    onDelete={() => handleRemoveFile(index)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  },
)

UploadField.displayName = 'UploadField'
export default UploadField
