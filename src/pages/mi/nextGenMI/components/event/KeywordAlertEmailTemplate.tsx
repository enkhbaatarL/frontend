import logoImg from '@/assets/logo.svg'
import { type KeywordAlertHistoryItem } from '@/pages/mi/nextGenMI/utils/keywordAlertStore'
import { EMAIL_FONT_FAMILY } from '@/utils/email'

interface KeywordAlertEmailTemplateProps {
  item: KeywordAlertHistoryItem
  detailHref: string
  onDetailClick?: () => void
}

const KeywordAlertEmailTemplate = ({ item, detailHref, onDetailClick }: KeywordAlertEmailTemplateProps) => (
  <table
    width="600"
    cellPadding={0}
    cellSpacing={0}
    border={0}
    style={{ width: '600px', maxWidth: '100%', backgroundColor: '#FFFFFF', borderCollapse: 'collapse' }}
  >
    <tbody>
      <tr>
        <td align="center" style={{ paddingBottom: '30px' }}>
          <img src={logoImg} alt="AI Market Insights" width={201} height={30} style={{ display: 'block', border: 0 }} />
        </td>
      </tr>
      <tr>
        <td
          align="center"
          style={{
            paddingBottom: '20px',
            color: '#212529',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: '24px',
            fontWeight: 700,
            lineHeight: 'normal',
          }}
        >
          키워드 알람 발생
        </td>
      </tr>
      <tr>
        <td
          align="center"
          style={{
            paddingBottom: '30px',
            color: '#495057',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          등록된 키워드가 포함된 이벤트가 발생하였습니다.
        </td>
      </tr>
      <tr>
        <td align="center" style={{ paddingBottom: '30px' }}>
          <table
            width="410"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            style={{
              width: '410px',
              maxWidth: '100%',
              backgroundColor: '#F8F9FA',
              border: '1px solid #F1F3F5',
              borderRadius: '6px',
              borderCollapse: 'separate',
            }}
          >
            <tbody>
              <tr>
                <td
                  align="center"
                  style={{
                    padding: '20px 20px 4px',
                    color: '#2E3F5E',
                    fontFamily: EMAIL_FONT_FAMILY,
                    fontSize: '16px',
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  {`${item.statusLabel} · ${item.categoryLabel} · ${item.occurredAt}`}
                </td>
              </tr>
              <tr>
                <td
                  align="center"
                  style={{
                    padding: '0 20px',
                    color: '#495057',
                    fontFamily: EMAIL_FONT_FAMILY,
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {item.eventName}
                </td>
              </tr>
              <tr>
                <td align="center" style={{ padding: '12px 20px 20px' }}>
                  <table
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{ borderCollapse: 'collapse', backgroundColor: '#FFFFFF', borderRadius: '4px' }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ padding: '4px 8px', fontFamily: EMAIL_FONT_FAMILY, fontSize: '16px', lineHeight: 1.4 }}>
                          <span style={{ color: '#495057', fontWeight: 600 }}>키워드 </span>
                          <span style={{ color: '#5191F5', fontWeight: 700 }}>{item.keyword}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style={{ paddingBottom: '60px' }}>
          <a
            href={detailHref}
            onClick={(event) => {
              if (!onDetailClick) return
              event.preventDefault()
              onDetailClick()
            }}
            style={{
              display: 'inline-block',
              width: '260px',
              boxSizing: 'border-box',
              padding: '10px 16px',
              borderRadius: '4px',
              backgroundColor: '#2E3F5E',
              color: '#FFFFFF',
              fontFamily: EMAIL_FONT_FAMILY,
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: 1.4,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            이벤트 상세보기
          </a>
        </td>
      </tr>
      <tr>
        <td
          align="center"
          style={{
            borderTop: '1px solid #DCE1E5',
            paddingTop: '20px',
            color: '#9199A1',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: '10px',
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          *본 메일은 발신전용 메일이며 회신처리되지 않습니다. 기타 문의사항은 서비스 관리자에게 문의하세요
          <br />ⓒ 2025 SKT Co.,ltd. All right reserved.
        </td>
      </tr>
    </tbody>
  </table>
)

export default KeywordAlertEmailTemplate
