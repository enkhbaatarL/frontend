import DOMPurify from 'dompurify'
import { CSSProperties, Fragment } from 'react'

import { EMAIL_FONT_FAMILY, msoLineHeightAltScaled, msoPaddingAltScaled } from '@/utils/email'

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
                    fontSize: '28px',
                    fontWeight: 700,
                    lineHeight: '39px',
                    ...({
                      msoAnsiFontSize: '13.5px',
                      msoFareastFontSize: '13.5px',
                      msoLineHeightAlt: msoLineHeightAltScaled(39, 28, 13.5),
                      msoLineHeightRule: 'exactly',
                    } as CSSProperties),
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
                      ...({
                        msoAnsiFontSize: '10px',
                        msoFareastFontSize: '10px',
                        msoLineHeightAlt: msoLineHeightAltScaled(22, 16, 10),
                        msoLineHeightRule: 'exactly',
                        msoPaddingAlt: msoPaddingAltScaled(4, 0, 0, 0, 16, 10),
                      } as CSSProperties),
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
