import DOMPurify from 'dompurify'
import { CSSProperties, Fragment } from 'react'

import { IRelatedNewsEventItem } from '@/service/mi/newsletter'
import { EMAIL_FONT_FAMILY, msoLineHeightAltScaled, msoPaddingAltScaled } from '@/utils/email'

/** 본문(18px → Outlook 12px)과 동일 비율로 패딩 축소 */
const RN_BODY_DESIGN_FONT_PX = 18
const RN_BODY_OUTLOOK_FONT_PX = 12

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

/** 뉴스 줄 앞 불렛 (저장 데이터에 이미 붙어 있으면 중복 X) */
const CONTENT_LEAD_BULLET = '\u00B7'

const lineAlreadyHasLeadBullet = (line: string): boolean => line.trimStart().startsWith(CONTENT_LEAD_BULLET)

/** diff HTML 한 줄 구간에서 태그를 제외한 앞부분이 ·로 시작하는지(이미 불릿이 있는 저장본 대응) */
const diffSegmentVisibleStartsWithBullet = (htmlSegment: string): boolean => {
  const visible = htmlSegment
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', '\'')
    .trimStart()
  return visible.startsWith(CONTENT_LEAD_BULLET)
}

const withLeadBulletPlainLine = (line: string): string => {
  if (line.trim() === '' || lineAlreadyHasLeadBullet(line)) return line
  return `${CONTENT_LEAD_BULLET} ${line}`
}

/** `textDiffToHtml` 산출물(<br/> 구분)에 줄 단위 · 접두 */
const withLeadBulletDiffHtml = (sanitizedHtml: string): string => {
  const parts = sanitizedHtml.split(/<br\s*\/?>/gi)
  return parts
    .map((segment) => {
      if (segment.trim() === '' || diffSegmentVisibleStartsWithBullet(segment)) return segment
      return `${CONTENT_LEAD_BULLET} ${segment}`
    })
    .join('<br/>')
}

const RelatedNews = ({ item, titleDiffHtml, contentDiffHtml, visualRemoved }: RelatedNewsProps) => (
  <table
    width="800"
    cellPadding={0}
    cellSpacing={0}
    border={0}
    style={{
      borderCollapse: 'collapse',
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
              msoPaddingAlt: msoPaddingAltScaled(28, 0, 0, 0, RN_BODY_DESIGN_FONT_PX, RN_BODY_OUTLOOK_FONT_PX),
            } as CSSProperties),
          }}
        >
          <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td
                  style={{
                    color: '#495057',
                    fontFamily: EMAIL_FONT_FAMILY,
                    fontSize: '16px',
                    fontWeight: 600,
                    lineHeight: '22px',
                    paddingBottom: '4px',
                    ...({
                      msoAnsiFontSize: `${RN_META_OUTLOOK_FONT_PX}px`,
                      msoFareastFontSize: `${RN_META_OUTLOOK_FONT_PX}px`,
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
            fontSize: '20px',
            fontWeight: 600,
            lineHeight: '28px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: visualRemoved ? 'line-through' : undefined,
            ...({
              msoAnsiFontSize: '13.5px',
              msoFareastFontSize: '13.5px',
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
            paddingLeft: '4px',
            paddingBottom: '28px',
            color: '#495057',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: '27px',
            textDecoration: visualRemoved ? 'line-through' : undefined,
            ...({
              msoAnsiFontSize: '12px',
              msoFareastFontSize: '12px',
              msoLineHeightAlt: msoLineHeightAltScaled(27, 18, 12),
              msoLineHeightRule: 'exactly',
              msoPaddingAlt: msoPaddingAltScaled(0, 0, 28, 4, RN_BODY_DESIGN_FONT_PX, RN_BODY_OUTLOOK_FONT_PX),
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
                {idx > 0 && <br />}
                {content.split(String.raw`\n`).map((line, lineIdx) => (
                  <Fragment key={lineIdx}>
                    {lineIdx > 0 && <br />}
                    {withLeadBulletPlainLine(line)}
                  </Fragment>
                ))}
              </Fragment>
            ))
          )}
        </td>
      </tr>
    </tbody>
  </table>
)

export default RelatedNews
