import DOMPurify from 'dompurify'
import { CSSProperties, Fragment } from 'react'

import { IRelatedNewsEventItem } from '@/service/mi/newsletter'
import { EMAIL_FONT_FAMILY, OUTLOOK_MSO_FONT_FAMILY, msoLineHeightAltScaled, msoPaddingAltScaled, outlookMsoFontSize } from '@/utils/email'

/** 제목(2·3번째 글자 정렬 기준) */
const RN_TITLE_FONT_PX = 20
/** 본문 디자인 / Outlook 발송 시 시각적 12px 목표 */
const RN_BODY_FONT_PX = 16
const RN_BODY_OUTLOOK_FONT_PX = 12
/** 동일 글머리 항목 안 줄바꿈(랩) 행간 — 예전처럼 타이트 */
const RN_BODY_LINE_HEIGHT_INTRA_PX = 24
/** 불릿 열과 본문 열 사이 — 메일 본문 12px 기준 글자 약 1.5개분 */
const RN_BULLET_TO_TEXT_GAP_PX = Math.round(RN_BODY_OUTLOOK_FONT_PX * 1.7)
/** 서로 다른 글머리 행 사이 여백 — 본문 항목을 연속해서 표시 */
const RN_BULLET_PARAGRAPH_GAP_PX = 0
/** 글머리 블록(기호) 시작 — 왼쪽 들여쓰기 */
const RN_BULLET_INDENT_LEFT_PX = 30

/** 날짜·시간 줄 (원문 링크와 동일 12px 계열) */
const RN_META_DESIGN_FONT_PX = 12
const RN_META_DESIGN_LINE_PX = 18
const RN_META_OUTLOOK_FONT_PX = 12

const LINK_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADwSURBVHgBlZK9EcIwDEYlQUGZDWAFRmADRoAy0MRQQQpCAxXnLrSwAUzAMQFsQEYILcdFyL6E4++C85r4LL3oS2xc6vWMmSP4AAH3k5HfXehYA0PwWpP+ed1KCAlnvH0t1ol3+fIoPVciasqz96zbN4gUjocR/GCqBjtJdZYxBzNAprfMPsEfRGoZidHG7xT7VEWaKD+RfOkzqrska6T2DRspVZEMNah5kep/i2WS4c7302IVB29ipLVXJhUwsPcuKpVmcvBlUsHXzwlHfgAO2InmVrg02+/PwaWOL5zfBlcYsS9RscOc9ZwtoiRU/uYBTV+CnqciWgoAAAAASUVORK5CYII='

interface RelatedNewsProps {
  item: IRelatedNewsEventItem
  titleDiffHtml?: string
  contentDiffHtml?: string
  /** 리비전 뷰 등 — removed 항목 본문을 흐리게·취소선 */
  visualRemoved?: boolean
}

/** 구버전 저장본에 삽입된 문자 불릿 — CSS list-style 사용 시 본문에서 제거 */
const CONTENT_LEAD_BULLET = '\u25AA'
const LEGACY_LEAD_BULLET = '\u00B7'

const STORED_LEAD_BULLETS = [CONTENT_LEAD_BULLET, LEGACY_LEAD_BULLET] as const

const lineAlreadyHasLeadBullet = (line: string): boolean => {
  const t = line.trimStart()
  return STORED_LEAD_BULLETS.some((b) => t.startsWith(b))
}

/** diff HTML 한 줄 구간에서 태그를 제외한 앞부분이 저장 불릿으로 시작하는지 */
const diffSegmentVisibleStartsWithBullet = (htmlSegment: string): boolean => {
  const visible = htmlSegment
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', '\'')
    .trimStart()
  return STORED_LEAD_BULLETS.some((b) => visible.startsWith(b))
}

/** 실제 개행 기준 행 분리 + 저장 문자열 `\\n` 호환 */
const splitRelatedNewsBodyLines = (content: string): string[] => content.replace(/\\n/g, '\n').split(/\r?\n/)

const stripLeadingBulletFromPlainLine = (line: string): string => {
  const t = line.trimStart()
  for (const b of STORED_LEAD_BULLETS) {
    if (t.startsWith(b)) {
      const without = t.slice(b.length).trimStart()
      return without === '' ? '\u00A0' : without
    }
  }
  return line
}

const bulletGlyphTdBase = (paddingBottom: number): CSSProperties => ({
  verticalAlign: 'top',
  width: 12,
  paddingRight: RN_BULLET_TO_TEXT_GAP_PX,
  paddingBottom,
  color: '#343A40',
  fontFamily: OUTLOOK_MSO_FONT_FAMILY,
  fontSize: 9,
  lineHeight: `${RN_BODY_LINE_HEIGHT_INTRA_PX}px`,
  whiteSpace: 'nowrap',
  ...({
    msoAnsiFontSize: outlookMsoFontSize(RN_BODY_OUTLOOK_FONT_PX),
    msoFareastFontSize: outlookMsoFontSize(RN_BODY_OUTLOOK_FONT_PX),
    msoLineHeightAlt: msoLineHeightAltScaled(RN_BODY_LINE_HEIGHT_INTRA_PX, RN_BODY_FONT_PX, RN_BODY_OUTLOOK_FONT_PX),
    msoLineHeightRule: 'exactly',
  } as CSSProperties),
})

const bulletTextTdBase = (paddingBottom: number, textDecoration?: string): CSSProperties => ({
  verticalAlign: 'top',
  width: '100%',
  paddingBottom,
  color: '#343A40',
  fontFamily: OUTLOOK_MSO_FONT_FAMILY,
  fontSize: `${RN_BODY_FONT_PX}px`,
  fontWeight: 400,
  lineHeight: `${RN_BODY_LINE_HEIGHT_INTRA_PX}px`,
  overflowWrap: 'break-word',
  wordBreak: 'keep-all',
  textDecoration: textDecoration as CSSProperties['textDecoration'],
  ...({
    msoAnsiFontSize: outlookMsoFontSize(RN_BODY_OUTLOOK_FONT_PX),
    msoFareastFontSize: outlookMsoFontSize(RN_BODY_OUTLOOK_FONT_PX),
    msoLineHeightAlt: msoLineHeightAltScaled(RN_BODY_LINE_HEIGHT_INTRA_PX, RN_BODY_FONT_PX, RN_BODY_OUTLOOK_FONT_PX),
    msoLineHeightRule: 'exactly',
  } as CSSProperties),
})

/** `textDiffToHtml` 산출물 — Outlook 호환 2열 표(랩은 오른쪽 열만 → 첫 글자와 맞춤) */
const withLeadBulletDiffHtml = (sanitizedHtml: string): string => {
  const gap = RN_BULLET_PARAGRAPH_GAP_PX
  const lh = RN_BODY_LINE_HEIGHT_INTRA_PX
  const fs = RN_BODY_FONT_PX
  const indent = RN_BULLET_INDENT_LEFT_PX
  const gapPx = RN_BULLET_TO_TEXT_GAP_PX
  const parts = sanitizedHtml.split(/<br\s*\/?>/gi)
  const lastNonEmptyIdx = (() => {
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].trim() !== '') return i
    }
    return -1
  })()
  const msoFs = outlookMsoFontSize(RN_BODY_OUTLOOK_FONT_PX)
  const bulletTdStatic = `vertical-align:top;width:12px;padding-right:${gapPx}px;color:#343A40;font-family:${OUTLOOK_MSO_FONT_FAMILY};font-size:9px;line-height:${lh}px;white-space:nowrap;mso-line-height-rule:exactly;mso-ansi-font-size:${msoFs};mso-fareast-font-size:${msoFs};`
  const textTdStatic = `vertical-align:top;color:#343A40;font-family:${OUTLOOK_MSO_FONT_FAMILY};font-size:${fs}px;font-weight:400;line-height:${lh}px;overflow-wrap:break-word;word-break:keep-all;width:100%;mso-line-height-rule:exactly;mso-ansi-font-size:${outlookMsoFontSize(RN_BODY_OUTLOOK_FONT_PX)};mso-fareast-font-size:${outlookMsoFontSize(RN_BODY_OUTLOOK_FONT_PX)};`
  const rows = parts
    .map((segment, idx) => {
      if (segment.trim() === '') {
        return '<tr><td colspan="2" style="height:10px;line-height:10px;font-size:1px;">&nbsp;</td></tr>'
      }
      const hasStored = diffSegmentVisibleStartsWithBullet(segment)
      const bulletInner = hasStored ? '&nbsp;' : CONTENT_LEAD_BULLET
      const isLastBullet = idx === lastNonEmptyIdx
      const pb = isLastBullet ? 0 : gap
      return `<tr><td style="${bulletTdStatic}padding-bottom:${pb}px;">${bulletInner}</td><td style="${textTdStatic}padding-bottom:${pb}px;">${segment}</td></tr>`
    })
    .join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;table-layout:fixed;"><tbody><tr><td style="padding-left:${indent}px;vertical-align:top;"><table class="rn-bullet-body" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;table-layout:fixed;"><tbody>${rows}</tbody></table></td></tr></tbody></table>`
}

const RelatedNewsContentBlock = ({ content, visualRemoved }: { content: string; visualRemoved: boolean }) => {
  const dec = visualRemoved ? ('line-through' as const) : undefined
  const lines = splitRelatedNewsBodyLines(content)
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ paddingLeft: RN_BULLET_INDENT_LEFT_PX, verticalAlign: 'top' }}>
            <table
              className="rn-bullet-body"
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              style={{ borderCollapse: 'collapse', tableLayout: 'fixed' as const }}
            >
              <tbody>
                {lines.map((line, lineIdx) => {
                  const empty = line.trim() === ''
                  const hasStoredBullet = !empty && lineAlreadyHasLeadBullet(line)
                  const bodyText = empty ? '\u00A0' : hasStoredBullet ? stripLeadingBulletFromPlainLine(line) : line
                  const gapAfterRow = lineIdx < lines.length - 1 ? RN_BULLET_PARAGRAPH_GAP_PX : 0
                  return (
                    <tr key={lineIdx}>
                      <td style={{ ...bulletGlyphTdBase(gapAfterRow), textDecoration: dec }}>{empty ? null : CONTENT_LEAD_BULLET}</td>
                      <td style={bulletTextTdBase(gapAfterRow, dec)}>{bodyText}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

const RelatedNews = ({ item, titleDiffHtml, contentDiffHtml, visualRemoved }: RelatedNewsProps) => (
  <table
    width="800"
    cellPadding={0}
    cellSpacing={0}
    border={0}
    style={{
      borderCollapse: 'collapse',
      tableLayout: 'fixed',
      opacity: visualRemoved ? 0.72 : undefined,
    }}
  >
    <tbody>
      <tr>
        <td
          className="rn-date-wrap"
          style={{
            paddingTop: '28px',
            paddingBottom: 0,
            ...({
              msoPaddingAlt: msoPaddingAltScaled(28, 0, 0, 0, RN_BODY_FONT_PX, RN_BODY_OUTLOOK_FONT_PX),
            } as CSSProperties),
          }}
        >
          <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td
                  className="rn-date-meta"
                  style={{
                    color: '#495057',
                    fontFamily: 'Tahoma, Geneva, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    lineHeight: '22px',
                    paddingBottom: '4px',
                    ...({
                      msoAnsiFontSize: outlookMsoFontSize(RN_META_OUTLOOK_FONT_PX),
                      msoFareastFontSize: outlookMsoFontSize(RN_META_OUTLOOK_FONT_PX),
                      msoLineHeightAlt: msoLineHeightAltScaled(RN_META_DESIGN_LINE_PX, RN_META_DESIGN_FONT_PX, RN_META_OUTLOOK_FONT_PX),
                      msoLineHeightRule: 'exactly',
                      msoPaddingAlt: msoPaddingAltScaled(0, 0, 4, 0, RN_META_DESIGN_FONT_PX, RN_META_OUTLOOK_FONT_PX),
                    } as CSSProperties),
                  }}
                >
                  {item.createdDate} {item.createTime}
                  {item.source && (
                    <>
                      &nbsp;&nbsp;
                      <span
                        style={{
                          color: '#868E96',
                          fontSize: `${RN_META_DESIGN_FONT_PX}px`,
                          lineHeight: `${RN_META_DESIGN_LINE_PX}px`,
                          verticalAlign: 'middle',
                        }}
                      >
                        |
                      </span>
                      &nbsp;&nbsp;
                      <span style={{ fontWeight: 500 }}>{item.source}</span>
                    </>
                  )}
                </td>
                <td
                  align="right"
                  style={{
                    whiteSpace: 'nowrap',
                    paddingBottom: '4px',
                    ...({
                      msoPaddingAlt: msoPaddingAltScaled(0, 0, 4, 0, RN_META_DESIGN_FONT_PX, RN_META_OUTLOOK_FONT_PX),
                    } as CSSProperties),
                  }}
                >
                  {item.originalLink && (
                    <a
                      href={item.originalLink}
                      style={{
                        color: '#868E96',
                        fontFamily: EMAIL_FONT_FAMILY,
                        fontSize: '12px',
                        fontWeight: 400,
                        lineHeight: '19px',
                        textDecoration: 'underline',
                      }}
                    >
                      <img
                        src={LINK_ICON_BASE64}
                        alt=""
                        width={12}
                        height={12}
                        style={{
                          display: 'inline',
                          verticalAlign: 'middle',
                          marginRight: '4px',
                          border: 0,
                        }}
                      />
                      원문 링크
                    </a>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td
          className="rn-title"
          style={{
            paddingBottom: '10px',
            color: '#212529',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: `${RN_TITLE_FONT_PX}px`,
            fontWeight: 600,
            lineHeight: '28px',
            wordBreak: 'keep-all',
            overflowWrap: 'break-word',
            textDecoration: visualRemoved ? 'line-through' : undefined,
            ...({
              msoAnsiFontSize: outlookMsoFontSize(13.5),
              msoFareastFontSize: outlookMsoFontSize(13.5),
              msoLineHeightAlt: msoLineHeightAltScaled(28, 20, 13.5),
              msoLineHeightRule: 'exactly',
              msoPaddingAlt: msoPaddingAltScaled(0, 0, 10, 0, 20, 13.5),
            } as CSSProperties),
          }}
          {...(titleDiffHtml ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(titleDiffHtml) } } : { children: item.title })}
        />
      </tr>
      <tr>
        <td
          className="rn-content"
          style={{
            paddingLeft: 0,
            paddingBottom: '28px',
            color: '#343A40',
            fontFamily: OUTLOOK_MSO_FONT_FAMILY,
            fontSize: `${RN_BODY_FONT_PX}px`,
            fontWeight: 400,
            lineHeight: `${RN_BODY_LINE_HEIGHT_INTRA_PX}px`,
            textDecoration: visualRemoved ? 'line-through' : undefined,
            ...({
              msoAnsiFontSize: outlookMsoFontSize(RN_BODY_OUTLOOK_FONT_PX),
              msoFareastFontSize: outlookMsoFontSize(RN_BODY_OUTLOOK_FONT_PX),
              msoLineHeightAlt: msoLineHeightAltScaled(RN_BODY_LINE_HEIGHT_INTRA_PX, RN_BODY_FONT_PX, RN_BODY_OUTLOOK_FONT_PX),
              msoLineHeightRule: 'exactly',
              msoPaddingAlt: msoPaddingAltScaled(0, 0, 28, 0, RN_BODY_FONT_PX, RN_BODY_OUTLOOK_FONT_PX),
            } as CSSProperties),
          }}
        >
          {contentDiffHtml ? (
            <span
              dangerouslySetInnerHTML={{
                __html: withLeadBulletDiffHtml(DOMPurify.sanitize(contentDiffHtml)),
              }}
            />
          ) : (
            item.content.map((content, idx) => (
              <Fragment key={idx}>
                {idx > 0 ? (
                  <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            height: RN_BULLET_PARAGRAPH_GAP_PX,
                            fontSize: 1,
                            lineHeight: `${RN_BULLET_PARAGRAPH_GAP_PX}px`,
                          }}
                        >
                          &nbsp;
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : null}
                <RelatedNewsContentBlock content={content} visualRemoved={!!visualRemoved} />
              </Fragment>
            ))
          )}
        </td>
      </tr>
    </tbody>
  </table>
)

export default RelatedNews
