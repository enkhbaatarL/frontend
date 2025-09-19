interface Props {
  title: string
  date: string
}

const Title = ({ title, date }: Props) => (
  <table
    style={{
      width: '800px',
      margin: '20px auto 20px auto',
      padding: '0 12px',
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
          <table>
            <thead>
              <tr>
                <th
                  style={{
                    width: '776px',
                    textAlign: 'center',
                    margin: '0 auto',
                    borderTop: '1px solid #2E3F5E',
                  }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: '24px',
                      color: '#212529',
                      margin: '32px auto 3px auto',
                    }}
                  >
                    {title}
                  </p>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    textAlign: 'center',
                    margin: '0 auto',
                    borderBottom: '1px solid #2E3F5E',
                  }}
                >
                  <p
                    style={{
                      fontWeight: '500',
                      fontSize: '16px',
                      color: '#495057',
                      margin: '3px auto 32px auto',
                    }}
                  >
                    {date}
                  </p>
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
