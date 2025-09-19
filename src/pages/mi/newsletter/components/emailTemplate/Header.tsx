import { useState } from 'react'

interface Props {
  headerImg?: string
  title?: string
  subtitle?: string
}

const Header = ({ headerImg, title, subtitle }: Props) => {
  const [imageError, setImageError] = useState(false)

  return (
    <table
      style={{
        width: '800px',
        margin: '0 auto 20px auto',
        backgroundColor: '#F1F3F5',
      }}
    >
      <thead>
        <tr>
          <th style={{ paddingTop: imageError ? '12px' : undefined }}>
            {headerImg && !imageError && (
              <img
                src={headerImg}
                alt="cover"
                width={280}
                height={188}
                style={{ marginBottom: '8px' }}
                draggable={false}
                onError={() => setImageError(true)}
              />
            )}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'Source Serif Pro, serif',
                fontWeight: 600,
                fontSize: '12px',
                color: '#212529',
                padding: '0',
                margin: '0 0 6px 0',
              }}
            >
              <u>AI Market Insights</u>
            </p>
            <p
              style={{
                fontFamily: 'Source Serif Pro, serif',
                fontWeight: 600,
                fontSize: '26px',
                color: '#212529',
                padding: '0',
                margin: '0 0 6px 0',
              }}
            >
              {title}
            </p>
            <p
              style={{
                fontWeight: 600,
                fontSize: '14px',
                color: '#495057',
                padding: '0',
                margin: '0 0 14px 0',
              }}
            >
              {subtitle}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export default Header
