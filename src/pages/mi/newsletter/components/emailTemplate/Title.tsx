interface Props {
  title: string
  date: string
}

const Title = ({ title, date }: Props) => (
  <table
    style={{
      width: '800px',
      padding: '20px 12px 20px 12px',
    }}
  >
    <thead>
      <tr>
        <th colSpan={2} style={{ display: 'none' }}></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <table>
            <thead>
              <tr>
                <th
                  style={{
                    width: '776px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '24px',
                    color: '#212529',
                    padding: '32px 0 3px 0',
                    borderTop: '1px solid #2E3F5E',
                  }}
                >
                  {title}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    textAlign: 'center',
                    margin: '0 auto',
                    fontWeight: '500',
                    fontSize: '16px',
                    color: '#495057',
                    padding: '3px 0 32px 0',
                    borderBottom: '1px solid #2E3F5E',
                  }}
                >
                  {date}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
)

export default Title
