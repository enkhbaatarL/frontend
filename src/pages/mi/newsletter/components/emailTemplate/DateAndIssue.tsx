import DOMPurify from 'dompurify'

import { formatDate } from '@/utils/date'
import { EMAIL_FONT_FAMILY } from '@/utils/email'

const EMAIL_DATE_DISPLAY_FORMAT = 'YYYY년 M월 D일'

interface DateAndIssueProps {
  issueNo: string
  date: string
  issueNoDiffHtml?: string
  dateDiffHtml?: string
}

const DateAndIssue = ({ issueNo, date, issueNoDiffHtml, dateDiffHtml }: DateAndIssueProps) => (
  <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
    <tbody>
      <tr>
        <td
          style={{
            color: '#495057',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: '16px',
            fontWeight: 600,
            lineHeight: '22px',
          }}
        >
          Issue{' '}
          {issueNoDiffHtml ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(issueNoDiffHtml) }} /> : issueNo.padStart(3, '0')}{' '}
          |{' '}
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
