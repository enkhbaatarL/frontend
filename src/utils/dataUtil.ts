/**
 * 바이트 단위의 숫자를 다른 단위로 변환
 * @param bytes 바이트 숫자
 * @param type 출력 단위 ('mb' 또는 'gb')
 */
export const formatSize = (bytes: number, type: 'mb' | 'gb' = 'mb'): string => {
  if (type === 'mb') {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }
  if (type === 'gb') {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  }
  return `${bytes} B`
}
