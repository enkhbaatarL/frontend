import DOMPurify from 'dompurify'
import { Fragment } from 'react'

import { EMAIL_FONT_FAMILY } from '@/utils/email'

interface ItemTitleProps {
  title: string
  subtitle?: string
  titleDiffHtml?: string
  subtitleDiffHtml?: string
}

const ItemTitle = ({ title, subtitle, titleDiffHtml, subtitleDiffHtml }: ItemTitleProps) => (
  <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
    <tbody>
      <tr>
        <td
          style={{
            borderLeft: '4px solid #343A40',
            paddingLeft: '20px',
          }}
        >
          <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td
                  style={{
                    color: '#212529',
                    fontFamily: EMAIL_FONT_FAMILY,
                    fontSize: '22px',
                    fontWeight: 600,
                    lineHeight: '31px',
                  }}
                  {...(titleDiffHtml ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(titleDiffHtml) } } : { children: title })}
                />
              </tr>
              {(subtitle || subtitleDiffHtml) && (
                <tr>
                  <td
                    style={{
                      paddingTop: '4px',
                      color: '#868E96',
                      fontFamily: EMAIL_FONT_FAMILY,
                      fontSize: '16px',
                      fontWeight: 600,
                      lineHeight: '22px',
                    }}
                    {...(subtitleDiffHtml
                      ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(subtitleDiffHtml) } }
                      : {
                        children: (subtitle ?? '').split(String.raw`\n`).map((line, idx) => (
                          <Fragment key={idx}>
                            {idx > 0 && <br />}
                            {line}
                          </Fragment>
                        )),
                      })}
                  />
                </tr>
              )}
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
)

export default ItemTitle
