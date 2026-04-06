import DOMPurify from 'dompurify'
import { CSSProperties, Fragment } from 'react'

import { EMAIL_FONT_FAMILY, msoLineHeightAltScaled, msoPaddingAltScaled, outlookMsoFontSize } from '@/utils/email'

interface SummaryProps {
  summary: string
  summaryDiffHtml?: string
}

const cellStyle = {
  color: '#212529',
  fontFamily: EMAIL_FONT_FAMILY,
  fontSize: '18px',
  fontWeight: 500,
  lineHeight: '29px',
  ...({
    msoAnsiFontSize: outlookMsoFontSize(12),
    msoFareastFontSize: outlookMsoFontSize(12),
    msoLineHeightAlt: msoLineHeightAltScaled(29, 18, 12),
    msoLineHeightRule: 'exactly',
  } as CSSProperties),
}

const Summary = ({ summary, summaryDiffHtml }: SummaryProps) => (
  <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
    <tbody>
      <tr>
        <td style={{ paddingTop: '12px', ...({ msoPaddingAlt: '6px 0 0 0' } as CSSProperties) }}>
          <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td
                  style={{
                    paddingBottom: '10px',
                    color: '#212529',
                    fontFamily: EMAIL_FONT_FAMILY,
                    fontSize: '20px',
                    fontWeight: 700,
                    lineHeight: '28px',
                    ...({
                      msoAnsiFontSize: outlookMsoFontSize(13.5),
                      msoFareastFontSize: outlookMsoFontSize(13.5),
                      msoLineHeightAlt: msoLineHeightAltScaled(28, 20, 13.5),
                      msoLineHeightRule: 'exactly',
                      msoPaddingAlt: msoPaddingAltScaled(0, 0, 10, 0, 20, 13.5),
                    } as CSSProperties),
                  }}
                >
                  핵심 요약
                </td>
              </tr>
              <tr>
                {summaryDiffHtml ? (
                  <td style={cellStyle} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(summaryDiffHtml) }} />
                ) : (
                  <td style={cellStyle}>
                    {summary.split(String.raw`\n`).map((line, idx) => (
                      <Fragment key={idx}>
                        {idx > 0 && <br />}
                        {line}
                      </Fragment>
                    ))}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
)

export default Summary
