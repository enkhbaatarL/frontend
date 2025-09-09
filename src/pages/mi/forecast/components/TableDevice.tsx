import { Typography } from '@mui/material'
import { Fragment } from 'react'

import MIPagination from '@/components/common/pagination/MIPagination'

const headers = ['차종', '', '24-08', '24-09', '24-10', '24-11', '24-12', '25-01', '25-02', '25-03', '25-04', '25-05', '25-06', '25-07']

type Entry = {
  date: string
  F: number | null
  A: number | null
  rate: number | null
}

type MockRow = {
  type: string
  data: Entry[]
}

type TableDeviceProps = {
  data: MockRow[]
}

const formatRate = (rate: number | null) => {
  if (rate === null) return '-'

  const style = rate > 0 ? { color: '#498B47', fontWeight: 600 } : rate < 0 ? { color: '#CC4D50', fontWeight: 600 } : { color: '#212529' }

  const prefix = rate > 0 ? '+' : ''

  return (
    <span style={style}>
      {prefix}
      {rate.toFixed(2)}
    </span>
  )
}

const TableDevice = ({ data }: TableDeviceProps) => (
  <>
    <table border={0} cellPadding={0} style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'center' }}>
      <thead style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #CED4DA' }}>
        <tr>
          {headers.map((h, idx) => (
            <th
              align={idx >= 2 ? 'right' : 'center'}
              style={{ color: '#868E96', fontSize: '13px', fontWeight: 600, padding: '8px 12px' }}
              key={idx}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <Fragment key={idx}>
            <tr style={{ borderBottom: '1px solid #CED4DA' }}>
              <td style={{ padding: '10px 12px' }} rowSpan={3}>
                <Typography color={'gray.90'} sx={{ fontWeight: 600 }} variant={'tableBody2'}>
                  {row.type}
                </Typography>
              </td>
              <td>
                <Typography color={'gray.90'} variant={'tableBody2'}>
                  F
                </Typography>
              </td>
              {row.data.map((entry, i) => (
                <td style={{ padding: '10px 12px' }} align={'right'} key={`F-${i}`}>
                  <Typography color={'gray.90'} variant={'tableBody2'}>
                    {entry.F ?? '-'}
                  </Typography>
                </td>
              ))}
            </tr>
            <tr style={{ borderBottom: '1px solid #CED4DA' }}>
              <td style={{ padding: '10px 12px' }}>
                <Typography color={'gray.90'} variant={'tableBody2'}>
                  A
                </Typography>
              </td>
              {row.data.map((entry, i) => (
                <td style={{ padding: '10px 12px' }} align={'right'} key={`A-${i}`}>
                  <Typography color={'gray.90'} variant={'tableBody2'}>
                    {entry.A ?? '-'}
                  </Typography>
                </td>
              ))}
            </tr>
            <tr style={{ borderBottom: '1px solid #CED4DA' }}>
              <td style={{ padding: '10px 12px' }}>
                <Typography color={'gray.90'} variant={'tableBody2'}>
                  %
                </Typography>
              </td>
              {row.data.map((entry, i) => (
                <td style={{ padding: '10px 12px' }} align={'right'} key={`rate-${i}`}>
                  <Typography color={'gray.90'} variant={'tableBody2'}>
                    {formatRate(entry.rate)}
                  </Typography>
                </td>
              ))}
            </tr>
          </Fragment>
        ))}
      </tbody>
    </table>
    <MIPagination />
  </>
)

export default TableDevice
