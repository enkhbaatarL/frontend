import { DatePicker } from '@mui/x-date-pickers'
import { useState } from 'react'

import api from '@/lib/axios'

const TestPage = () => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleUpload = () => {
    if (!selectedFile) return

    const formData = new FormData()

    formData.append('file', selectedFile)

    const controller = new AbortController()

    setAbortController(controller)

    setIsUploading(true)
    api
      .post('http://localhost:3001/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)

            setUploadProgress(percentCompleted)
          }
        },
        signal: controller.signal,
      })
      .then(() => {
        setIsUploading(false)
        setUploadProgress(0)
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log('Upload canceled')
        } else {
          console.error('Upload failed', error)
        }
        setIsUploading(false)
        setUploadProgress(0)
      })
  }

  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div>
      <input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={!selectedFile || isUploading}>
        Upload
      </button>
      {isUploading && (
        <div>
          <p>Upload Progress: {uploadProgress}%</p>
          <button onClick={handleCancel}>Cancel Upload</button>
        </div>
      )}
      <DatePicker format="YYYY-MM-DD" />
    </div>
  )
}

export default TestPage
