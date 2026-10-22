// 접수 응답을 잃은 경우 같은 파일·requestId로 재확인할 수 있도록 원본을 보관한다.
const modelInputUploadFileStorage = (requestId: string, action: 'get' | 'put' | 'delete', file?: File): Promise<File | undefined> =>
  new Promise((resolve, reject) => {
    const opening = indexedDB.open('model-input-upload-recovery', 1)
    opening.onupgradeneeded = () => opening.result.createObjectStore('files')
    opening.onerror = () => reject(new Error('파일 업로드가 실패했습니다.'))
    opening.onblocked = () => reject(new Error('파일 업로드가 실패했습니다.'))
    opening.onsuccess = () => {
      const database = opening.result
      const transaction = database.transaction('files', action === 'get' ? 'readonly' : 'readwrite')
      const files = transaction.objectStore('files')
      const request = action === 'get' ? files.get(requestId) : action === 'put' ? files.put(file, requestId) : files.delete(requestId)
      transaction.oncomplete = () => {
        database.close()
        resolve(action === 'get' && request.result instanceof File ? request.result : undefined)
      }
      transaction.onerror = transaction.onabort = () => {
        database.close()
        reject(new Error('파일 업로드가 실패했습니다.'))
      }
    }
  })

export default modelInputUploadFileStorage
