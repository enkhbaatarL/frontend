/**
 * 여러 컨텐츠(텍스트와 이미지)를 클립보드에 복사하는 함수
 * @param plain 텍스트 컨텐츠
 * @param html HTML 컨텐츠
 * @throws 클립보드 복사 실패 시 에러 발생
 */
export const multiContentsToClipboard = async (plain: string, html?: string): Promise<void> => {
  try {
    const clipboardItems: Record<string, Blob> = {}

    if (html) {
      const htmlContent = []
      const style = `
      <style>
        h1 {
          color: #212529;
          font-size: 32px;
          font-style: normal;
          font-weight: 500;
          line-height: 150%;
          letter-spacing: -0.32px;
          margin: 12px 0;
        }

        h2 {
          color: #212529;
          font-size: 18px;
          font-style: normal;
          font-weight: 700;
          line-height: 150%;
          letter-spacing: -0.18px;
        }

        h3 {
          color: #212529;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          line-height: 150%;
          letter-spacing: -0.18px;
        }

        p {
          color: #212529;
          font-size: 16px;
          font-style: normal;
          font-weight: 500;
          line-height: 150%;
          letter-spacing: -0.16px;
          margin: 14px 0;
        }

        ul {
          margin: 0;
          padding-left: 24px;
        }

        li {
          margin: 14px 0;
          color: #212529;
          font-size: 16px;
          font-style: normal;
          font-weight: 400;
          line-height: 150%;
          letter-spacing: -0.16px;
        }

        a {
          color: #212529;
          font-weight: 500;
        }

        hr {
          display: block;
          height: 1px;
          border: 0;
          border-top: 1px solid #ccc;
          padding: 0;
          margin: 24px 0;
        }

        table {
          width: 100%;
          border-spacing: 0;
          margin-bottom: 24px;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #DEE2E6;
          background-color: white;
        }

        thead tr {
          background: #F8F9FA;
        }

        th {
          border-bottom: 1px solid #CED4DA;
          text-align: left;
          color: #868E96;
          font-size: 13px;
          font-style: normal;
          font-weight: 600;
        }

        td {
          border-bottom: 1px solid #DEE2E6;
          overflow: hidden;
          color: #212529;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
        }

        tr:last-child td {
          border-bottom: none;
        }
      </style>
    `

      htmlContent.push(style)
      htmlContent.push(html)

      clipboardItems['text/html'] = new Blob([htmlContent.join('')], { type: 'text/html' })
    }

    clipboardItems['text/plain'] = new Blob([plain], { type: 'text/plain' })

    await navigator.clipboard.write([new ClipboardItem(clipboardItems)])
  } catch (error) {
    console.error('Failed to copy to clipboard.', error)
  }
}
