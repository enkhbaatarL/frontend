/// <reference types="vite/client" />

declare global {
  /** 뉴스레터 렌더 캡처 페이지에서 세팅 — 백엔드: Read 후 메일 발송에 사용 */
  var __mailContents:
    | {
        htmlBody: string
        images: Array<{ cid: string; data: string; contentType: string }>
      }
    | undefined
}

export {}
