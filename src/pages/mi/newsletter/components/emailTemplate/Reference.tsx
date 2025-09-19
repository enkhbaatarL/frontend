import { IReferenceDataItem } from '@/service/mi/newsletter'

interface Props {
  referenceData: IReferenceDataItem[]
}

const Reference = ({ referenceData }: Props) =>
  referenceData.map((item) => (
    <table
      style={{
        width: '776px',
        margin: '30px auto 20px auto',
      }}
      key={item.title}
    >
      <thead>
        <tr>
          <th
            style={{
              width: '100%',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '18px',
              color: '#212529',
            }}
          >
            참고
          </th>
        </tr>
        <tr>
          <th style={{ width: '100%', height: '12px', borderBottom: '1px solid #868E96' }}></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: '16px 0' }}>
            <table width="100%">
              <thead>
                <tr>
                  <th style={{ padding: '4px 0', textAlign: 'left', fontWeight: 700, fontSize: '18px', color: '#212529' }}>{item.title}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 400, fontSize: '14px', color: '#495057', whiteSpace: 'pre-line' }}>{item.description}</td>
                </tr>
                <tr>
                  <td width="100%" style={{ paddingTop: '24px' }}>
                    {/* 데이터 구현부 */}
                    {item.tableData && (
                      <table width="100%" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {item.tableData.headers.map((header, index) => (
                              <th
                                key={header.field}
                                style={{
                                  padding: '9px 12px',
                                  textAlign: index === 0 ? 'center' : 'right',
                                  whiteSpace: 'pre-line',
                                  color: '#868E96',
                                  backgroundColor: '#F8F9FA',
                                  borderBottom: '1px solid #CED4DA',
                                  fontWeight: 600,
                                  fontSize: '13px',
                                }}
                              >
                                {header.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {item.tableData.rows.map((row) => (
                            <tr key={row.cells.join(',')}>
                              {row.cells.map((cell, index) => (
                                <td
                                  key={cell}
                                  style={{
                                    padding: '9px 12px',
                                    textAlign: index === 0 ? 'center' : 'right',
                                    whiteSpace: 'pre-line',
                                    backgroundColor: index === 0 || index === 4 ? '#F8F9FA' : undefined,
                                    borderBottom: '1px solid #DEE2E6',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    color: '#212529',
                                  }}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  ))

export default Reference
