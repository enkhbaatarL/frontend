import { useState, useEffect } from 'react'

import logoImg from '@/assets/logo.png'
import { NewsletterDetailPageMode } from '@/service/mi/newsletter'
import { convertImageToBase64 } from '@/utils/image'

interface Props {
  mode: NewsletterDetailPageMode
}

const Disclaimer = ({ mode }: Props) => {
  const disclaimerText = {
    [NewsletterDetailPageMode.VIEW]:
      '이 메일은 귀하가 AI Market Insights 플랫폼의 구독·알림 페이지 또는 원클릭 가입 링크를 통해 신청하였기에 발송되었습니다. 본 메일은 SK텔레콤㈜에서 발송되었습니다. 본 뉴스레터는 AI Market Insights의 AI 에이전트 MARI를 통해 구성되었으며, 다양한 신뢰할 수 있는 소스를 기반으로 재구성되었습니다. AI가 생성한 콘텐츠에는 일부 부정확한 정보가 포함될 수 있으므로 중요한 내용은 반드시 원문을 통해 재확인하시기 바랍니다.',
    [NewsletterDetailPageMode.EDIT]:
      '본 뉴스레터는 AI Market Insights의 AI 에이전트 MARI가 다양한 신뢰할 수 있는 소스를 기반으로 생성한 콘텐츠를 사용자가 직접 편집·보강하여 최종 발송한 것입니다. 따라서 원문과 일부 차이가 있을 수 있으며, 중요한 사항은 반드시 원문을 통해 재확인하시기 바랍니다.',
  }

  const [base64LogImg, setBase64LogImg] = useState<string>('')

  useEffect(() => {
    const loadBase64Image = async () => {
      setBase64LogImg(await convertImageToBase64(logoImg))
    }

    loadBase64Image().then()
  }, [])

  return (
    <table
      style={{
        width: '800px',
        backgroundColor: '#F1F3F5',
      }}
    >
      <tbody>
        <tr>
          <td style={{ verticalAlign: 'top' }}>
            <table>
              <tbody>
                <tr>
                  <td style={{ padding: '16px 12px 16px 20px', verticalAlign: 'top' }}>
                    {base64LogImg && <img src={base64LogImg} alt="AI Market Insights" />}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
          <td style={{ verticalAlign: 'top' }}>
            <table>
              <tbody>
                <tr>
                  <td style={{ padding: '16px 24px 16px 12px', verticalAlign: 'top', color: '#495057', fontWeight: 400, fontSize: '12px' }}>
                    {mode === NewsletterDetailPageMode.VIEW
                      ? disclaimerText[NewsletterDetailPageMode.VIEW]
                      : disclaimerText[NewsletterDetailPageMode.EDIT]}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export default Disclaimer
