import DOMPurify from 'dompurify'
import { CSSProperties } from 'react'

import { formatDate } from '@/utils/date'
import { EMAIL_FONT_FAMILY, msoLineHeightAltScaled, outlookMsoFontSize } from '@/utils/email'

const EMAIL_DATE_DISPLAY_FORMAT = 'YYYY년 M월 D일'

/** 웹은 원본 16px 유지, Outlook(Word)만 핵심요약 헤더와 비슷한 13.5px로 축소 */
const EMAIL_DATE_DESIGN_FONT_PX = 16
const EMAIL_DATE_DESIGN_LINE_HEIGHT_PX = 22
const EMAIL_DATE_OUTLOOK_FONT_PX = 13.5

interface DateAndIssueProps {
  date: string
  dateDiffHtml?: string
}

const DateAndIssue = ({ date, dateDiffHtml }: DateAndIssueProps) => (
  <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
    <tbody>
      <tr>
        <td
          style={{
            color: '#495057',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: `${EMAIL_DATE_DESIGN_FONT_PX}px`,
            fontWeight: 600,
            lineHeight: `${EMAIL_DATE_DESIGN_LINE_HEIGHT_PX}px`,
            ...({
              msoAnsiFontSize: outlookMsoFontSize(EMAIL_DATE_OUTLOOK_FONT_PX),
              msoFareastFontSize: outlookMsoFontSize(EMAIL_DATE_OUTLOOK_FONT_PX),
              msoLineHeightAlt: msoLineHeightAltScaled(
                EMAIL_DATE_DESIGN_LINE_HEIGHT_PX,
                EMAIL_DATE_DESIGN_FONT_PX,
                EMAIL_DATE_OUTLOOK_FONT_PX,
              ),
              msoLineHeightRule: 'exactly',
            } as CSSProperties),
          }}
        >
          {dateDiffHtml ? (
            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(dateDiffHtml) }} />
          ) : (
            formatDate(date, EMAIL_DATE_DISPLAY_FORMAT) || date
          )}
        </td>
      </tr>
    </tbody>
  </table>
)

export default DateAndIssue
