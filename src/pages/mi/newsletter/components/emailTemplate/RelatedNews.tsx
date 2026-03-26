import DOMPurify from 'dompurify'
import { Fragment } from 'react'

import { IRelatedNewsEventItem } from '@/service/mi/newsletter'
import { EMAIL_FONT_FAMILY } from '@/utils/email'

const LINK_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADwSURBVHgBlZK9EcIwDEYlQUGZDWAFRmADRoAy0MRQQQpCAxXnLrSwAUzAMQFsQEYILcdFyL6E4++C85r4LL3oS2xc6vWMmSP4AAH3k5HfXehYA0PwWpP+ed1KCAlnvH0t1ol3+fIoPVciasqz96zbN4gUjocR/GCqBjtJdZYxBzNAprfMPsEfRGoZidHG7xT7VEWaKD+RfOkzqrska6T2DRspVZEMNah5kep/i2WS4c7302IVB29ipLVXJhUwsPcuKpVmcvBlUsHXzwlHfgAO2InmVrg02+/PwaWOL5zfBlcYsS9RscOc9ZwtoiRU/uYBTV+CnqciWgoAAAAASUVORK5CYII='

interface RelatedNewsProps {
  item: IRelatedNewsEventItem
  titleDiffHtml?: string
  contentDiffHtml?: string
  /** 리비전 뷰 등 — removed 항목 본문을 흐리게·취소선 */
  visualRemoved?: boolean
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
        <td style={{ paddingTop: '24px', paddingBottom: '0' }}>
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
                  }}
                >
                  {item.createdDate} {item.createTime}
                  {item.source && (
                    <>
                      &nbsp;&nbsp;
                      <span
                        style={{
                          display: 'inline-block',
                          width: '1px',
                          height: '12px',
                          backgroundColor: '#868E96',
                          verticalAlign: 'middle',
                          fontSize: '0',
                          overflow: 'hidden',
                        }}
                      >
                        &nbsp;
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
          }}
          {...(titleDiffHtml ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(titleDiffHtml) } } : { children: item.title })}
        />
      </tr>
      <tr>
        <td
          style={{
            paddingBottom: '24px',
            color: '#495057',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: '27px',
            textDecoration: visualRemoved ? 'line-through' : undefined,
          }}
        >
          {contentDiffHtml ? (
            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentDiffHtml) }} />
          ) : (
            item.content.map((content, idx) => (
              <Fragment key={idx}>
                {idx > 0 && <br />}
                {content.split(String.raw`\n`).map((line, lineIdx) => (
                  <Fragment key={lineIdx}>
                    {lineIdx > 0 && <br />}
                    {line}
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
