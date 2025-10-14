import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import logoImg from '@/assets/logo.png'
import { NewsletterDetailPageMode } from '@/service/mi/newsletter'
import { convertImageToBase64 } from '@/utils/image'

interface Props {
  mode: NewsletterDetailPageMode
}

const Disclaimer = ({ mode }: Props) => {
  const { t } = useTranslation()

  const disclaimerText = {
    [NewsletterDetailPageMode.VIEW]: t('newsletter.footer.disclaimerViewText'),
    [NewsletterDetailPageMode.EDIT]: t('newsletter.footer.disclaimerEditText'),
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
