import { Box } from '@mui/material'
import { useState, useEffect } from 'react'

import mariBadgeImg from '@/assets/newsletter/mari-badge.png'
import EditPanal from '@/pages/mi/newsletter/components/EditPanal'
import { NewsletterDetailPageMode } from '@/service/mi/newsletter'
import { convertImageToBase64 } from '@/utils/image'

interface Props {
  content: string
  mode: NewsletterDetailPageMode
  isPublished: boolean
  onPublishedChange?: (isPublished: boolean) => void
}

const Summarized = ({ content, mode, isPublished, onPublishedChange }: Props) => {
  const [base64MariBadgeImg, setBase64MariBadgeImg] = useState<string>('')

  useEffect(() => {
    const loadBase64Image = async () => {
      setBase64MariBadgeImg(await convertImageToBase64(mariBadgeImg))
    }

    loadBase64Image().then()
  }, [])

  if (mode === NewsletterDetailPageMode.CAPTURE && !isPublished) {
    return null
  }

  return (
    <>
      {mode === NewsletterDetailPageMode.EDIT && (
        <Box width="100%" height="0px" position="relative">
          <Box position="absolute" top="26px" right="-180px">
            <EditPanal isPublished={isPublished} inflectionPoint="미등록" onPublishedChange={onPublishedChange} />
          </Box>
        </Box>
      )}
      <table
        style={{
          width: '800px',
          padding: '0px 12px 20px 12px',
        }}
      >
        <thead>
          <tr>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <table
                style={{
                  width: '776px',
                }}
              >
                <thead>
                  <tr>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        textAlign: 'left',
                        margin: '0 auto',
                      }}
                    >
                      <p
                        style={{
                          width: '752px',
                          margin: '0 auto',
                          fontWeight: '500',
                          fontSize: '16px',
                          color: isPublished ? '#212529' : '#ADB5BD',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {content}
                      </p>
                    </td>
                  </tr>
                  {base64MariBadgeImg && (
                    <tr>
                      <td style={{ textAlign: 'right', paddingTop: '20px' }}>
                        <img
                          src={base64MariBadgeImg}
                          alt="Mari Badge"
                          style={{
                            width: '177px',
                            height: '46px',
                            display: 'block',
                            marginLeft: 'auto',
                          }}
                          draggable={false}
                        />
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ height: '24px', borderBottom: '1px solid #DEE2E6' }}></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export default Summarized
