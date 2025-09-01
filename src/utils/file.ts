export const downloadFile = (data: BlobPart, fileName?: string) => {
  const blob = new Blob([data])
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  if (fileName) {
    link.download = fileName
  }
  document.body.appendChild(link)
  link.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(link)
}
