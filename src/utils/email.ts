import { v4 as uuid } from 'uuid'

/** 이메일 컨텐츠용 폰트 (Pretendard 없을 시 맑은고딕 fallback) */
export const EMAIL_FONT_FAMILY = 'Pretendard, \'맑은 고딕\', \'Malgun Gothic\', sans-serif'

/**
 * Outlook(Word 엔진) 전용: font-family 첫 항목이 없을 때 fallback을 무시하는 버그를 피하려면
 * Pretendard 없이 맑은 고딕만 지정해야 합니다. MSO 조건부 주석 안에서만 사용합니다.
 */
export const OUTLOOK_MSO_FONT_FAMILY = '\'Malgun Gothic\', \'맑은 고딕\', sans-serif'

/**
 * @react-email/render 가 style 속성의 작은따옴표를 &#x27; 로 출력하는데,
 * Outlook 등에서는 font-family가 무시될 수 있어 일반 따옴표로 되돌립니다.
 */
export const normalizeEmailFontEntities = (html: string): string =>
  html
    .replaceAll(/style="([^"]*)"/gi, (_, inner: string) => `style="${inner.replaceAll('&#x27;', '\'').replaceAll('&#39;', '\'')}"`)
    .replaceAll(/style='([^']*)'/gi, (_, inner: string) => `style='${inner.replaceAll('&#x27;', '\'').replaceAll('&#39;', '\'')}'`)

/**
 * render() 결과에서 DOCTYPE·react-email 마커를 제거해 <body> 안에 넣을 수 있는 조각만 남깁니다.
 */
export const extractEmailBodyFragment = (html: string): string => {
  let s = html.trim()
  s = s.replace(/^<!DOCTYPE[^>]*>\s*/i, '')
  s = s.replaceAll('<!--$-->', '').replaceAll('<!--/$-->', '')
  return s.trim()
}

export type WrapEmailHtmlDocumentOptions = {
  pageTitle?: string
  bodyPaddingTop?: number
  bodyPaddingBottom?: number
}

/**
 * 미리보기/메일 발송용 완전한 HTML 문서. <head>에 MSO 조건부 주석으로 맑은 고딕을 강제합니다.
 */
export const wrapEmailHtmlDocument = (innerBodyHtml: string, options?: WrapEmailHtmlDocumentOptions): string => {
  const title = options?.pageTitle ?? ''
  const pt = options?.bodyPaddingTop ?? 32
  const pb = options?.bodyPaddingBottom ?? 24
  // 긴 HTML 템플릿 안에 padding:${n}px 를 두면 IDE 임베디드 CSS 검사기가 length-percentage와 불일치로 표시함 → 속성값만 별도 조합
  const outerWrapperCellStyle = ['padding:', pt, 'px 0 ', pb, 'px 0;'].join('')
  // 동적 padding 규칙은 TS에서만 조합. <style> 안에 정적 CSS와 ${…}를 섞으면 임베디드 CSS 검사기가 쉼표/구문 오류로 본다
  const documentStyleCss = [
    'html, body { margin: 0; padding: 0; background-color: #F4F5F7; }',
    'table { mso-table-lspace: 0; mso-table-rspace: 0; }',
    'p { margin: 0; }',
    'img { border: 0; outline: 0; text-decoration: none; }',
  ].join('\n  ')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  ${title ? `<title>${title}</title>` : ''}
  <!--[if mso]>
  <style>
  body, table, td, th, p, span, a, li { font-family: ${OUTLOOK_MSO_FONT_FAMILY} !important; }
  table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  td, th, p, div, span, a, li { mso-line-height-rule: exactly; }
  p { margin: 0; mso-margin-top-alt: 0; mso-margin-bottom-alt: 0; }
  div { margin: 0; mso-margin-top-alt: 0; mso-margin-bottom-alt: 0; }
  td { mso-margin-top-alt: 0; mso-margin-bottom-alt: 0; mso-para-margin: 0; }
  img { -ms-interpolation-mode: bicubic; display: block; }
  a img { border: 0; }
  </style>
  <![endif]-->
  <style>
  ${documentStyleCss}
  </style>
</head>
<body bgcolor="#F4F5F7">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F5F7" style="background-color:#F4F5F7;">
  <tr>
    <td align="center" style="${outerWrapperCellStyle}">
      <table width="872" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid #DEE2E6;width:872px;max-width:872px;">
        <tr>
          <td style="padding:36px 36px 0 36px;mso-padding-alt:36px 36px 0 36px;">
${innerBodyHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

/**
 * `mso-ansi-font-size`로 글자만 줄어들 때, 동일 비율로 패딩을 줄여 Outlook에서 여백이 어색하지 않게 맞춥니다.
 * (일반 클라이언트는 `padding` 그대로, Outlook은 `mso-padding-alt`가 적용됩니다.)
 */
export const msoPaddingAltScaled = (
  topPx: number,
  rightPx: number,
  bottomPx: number,
  leftPx: number,
  designFontSizePx: number,
  msoFontSizePx: number,
): string => {
  const s = msoFontSizePx / designFontSizePx
  const r = (n: number) => `${Math.max(0, Math.round(n * s))}px`
  return `${r(topPx)} ${r(rightPx)} ${r(bottomPx)} ${r(leftPx)}`
}

/**
 * Outlook 전용 `mso-line-height-alt`(px). 디자인 `line-height`를 `mso-ansi-font-size` / `font-size`와 같은 비율로 줄여,
 * Word 엔진에서 글자만 작아질 때 행간이 과하게 넓어지지 않게 합니다.
 * `mso-line-height-rule: exactly`와 함께 쓰는 것을 권장합니다.
 */
export const msoLineHeightAltScaled = (designLineHeightPx: number, designFontSizePx: number, msoFontSizePx: number): string => {
  const s = msoFontSizePx / designFontSizePx
  return `${Math.max(1, Math.round(designLineHeightPx * s))}px`
}

/**
 * `<td>` 인라인 스타일에서 padding 값을 파싱하여 `mso-padding-alt` 축약값을 반환합니다.
 * 이미 `mso-padding-alt`가 있거나 padding 속성이 없는 경우 null을 반환합니다.
 */
const extractMsoPaddingAlt = (style: string): string | null => {
  if (/mso-padding-alt/.test(style)) return null

  const shorthand = style.match(/(?:^|;)\s*padding\s*:\s*([^;]+)/)
  if (shorthand) {
    const parts = shorthand[1].trim().split(/\s+/)
    switch (parts.length) {
      case 1:
        return `${parts[0]} ${parts[0]} ${parts[0]} ${parts[0]}`
      case 2:
        return `${parts[0]} ${parts[1]} ${parts[0]} ${parts[1]}`
      case 3:
        return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[1]}`
      default:
        return parts.slice(0, 4).join(' ')
    }
  }

  const get = (p: string) => style.match(new RegExp(`${p}:\\s*([^;]+)`))?.[1]?.trim()
  const t = get('padding-top')
  const r = get('padding-right')
  const b = get('padding-bottom')
  const l = get('padding-left')
  if (!t && !r && !b && !l) return null
  return `${t ?? '0'} ${r ?? '0'} ${b ?? '0'} ${l ?? '0'}`
}

/** 모든 `<td>`의 padding을 `mso-padding-alt`로 미러링하여 Outlook에서 동일하게 표시 */
const injectMsoPaddingAltForAllTds = (html: string): string =>
  html.replaceAll(/<td\b[^>]*\bstyle="([^"]*)"[^>]*>/g, (fullTag, style: string) => {
    const msoPad = extractMsoPaddingAlt(style)
    if (!msoPad) return fullTag
    return fullTag.replace(`style="${style}"`, `style="${style};mso-padding-alt:${msoPad}"`)
  })

/** render 조각 → 엔티티 정규화 → mso-padding-alt 주입 → 아웃룩용 전체 HTML 문서 */
export const prepareNewsletterEmailHtml = (reactEmailHtmlFragment: string, options?: WrapEmailHtmlDocumentOptions): string => {
  const inner = extractEmailBodyFragment(reactEmailHtmlFragment)
  const normalized = normalizeEmailFontEntities(inner)
  const withMsoPadding = injectMsoPaddingAltForAllTds(normalized)
  return wrapEmailHtmlDocument(withMsoPadding, options)
}

/**
 * HTML 내 base64 이미지를 CID(Content-ID) 참조로 변환합니다.
 * 이메일 클라이언트에서 인라인 이미지를 올바르게 표시하려면
 * base64 대신 multipart/related의 inline attachment(CID)를 사용해야 합니다.
 *
 * 동일한 base64 데이터가 여러 번 등장해도 하나의 CID와 첨부파일로 처리합니다.
 * CID는 UUID로 생성되며, 파일명에 cid를 사용하므로 별도 cids 배열이 불필요합니다.
 * 백엔드에서는 파일명(확장자 제외)을 Content-ID로 사용합니다.
 *
 * @param htmlContent - base64 data URL이 포함된 HTML 문자열
 * @returns 변환된 HTML, File 배열 (파일명 = {cid}.{extension})
 */
export const convertBase64ImagesToCid = (
  htmlContent: string,
): {
  htmlContent: string
  images: File[]
} => {
  const BASE64_IMAGE_REGEX = /data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g
  const images: File[] = []

  // 동일한 base64 데이터에 대해 동일한 CID를 재사용하기 위한 캐시 (base64Data → cid)
  const cidCache = new Map<string, string>()

  const htmlWithCid = htmlContent.replaceAll(BASE64_IMAGE_REGEX, (match, mimeSubtype, base64Data) => {
    try {
      if (cidCache.has(base64Data)) {
        return `cid:${cidCache.get(base64Data)}`
      }

      const cid = uuid()
      const mimeType = `image/${mimeSubtype}`
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Uint8Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.codePointAt(i) ?? 0
      }
      const blob = new Blob([byteNumbers], { type: mimeType })
      const extension = mimeSubtype === 'jpeg' || mimeSubtype === 'jpg' ? 'jpg' : mimeSubtype
      const file = new File([blob], `${cid}.${extension}`, { type: mimeType })

      cidCache.set(base64Data, cid)
      images.push(file)

      return `cid:${cid}`
    } catch {
      // 변환 실패 시 원본 유지
      return match
    }
  })

  return { htmlContent: htmlWithCid, images }
}

export type MailCaptureImagePart = { cid: string; data: string; contentType: string }

/**
 * {@link convertBase64ImagesToCid}와 동일하게 CID로 치환하되,
 * 첨부용으로 raw base64·MIME 타입 객체 배열을 반환합니다 (백엔드 Puppeteer 등에서 사용).
 */
export const convertBase64ImagesToMailCapturePayload = (
  htmlContent: string,
): {
  htmlContent: string
  images: MailCaptureImagePart[]
} => {
  const BASE64_IMAGE_REGEX = /data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g
  const images: MailCaptureImagePart[] = []
  const cidCache = new Map<string, string>()

  const htmlWithCid = htmlContent.replaceAll(BASE64_IMAGE_REGEX, (_match, mimeSubtype: string, base64Data: string) => {
    try {
      if (cidCache.has(base64Data)) {
        return `cid:${cidCache.get(base64Data)}`
      }

      const cid = uuid()
      const contentType = `image/${mimeSubtype}`
      cidCache.set(base64Data, cid)
      images.push({ cid, data: base64Data, contentType })

      return `cid:${cid}`
    } catch {
      return _match
    }
  })

  return { htmlContent: htmlWithCid, images }
}
