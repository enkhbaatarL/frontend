import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Card, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material'
import { useState } from 'react'

import DashboardCardHeader from './DashboardCardHeader'

import tableIcon from '@/assets/dashboard/table.svg'
import MIButton from '@/components/common/button/MIButton'
import MIToggleSegmented from '@/components/common/segmentedbtn/MIToggleSegmented'
import MISelect from '@/components/common/select/MISelect'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'

interface CompanyData {
  id: string
  name: string
  q3_2024: {
    revenue: string
    operatingIncome: string
  }
  q4_2024: {
    revenue: string
    operatingIncome: string
  }
  q1_2025: {
    revenue: string
    operatingIncome: string
  }
  q2_2025: {
    revenue: string
    operatingIncome: string
  }
}

interface IndustryWatchProps {
  data?: CompanyData[]
}

interface NameCellProps {
  companyName: string
}

const NameCell = ({ companyName }: NameCellProps) => {
  const { isEllipsis, ref } = useEllipsisDetection()

  return (
    <Tooltip
      title={companyName}
      disableHoverListener={!isEllipsis}
      followCursor
      placement="bottom-start"
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [10, 8],
              },
            },
          ],
        },
      }}
    >
      <Box
        ref={ref}
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: 'default',
          fontWeight: 600,
          fontSize: 14,
          color: '#212529',
        }}
      >
        {companyName}
      </Box>
    </Tooltip>
  )
}

const IndustryWatch = ({ data = [] }: IndustryWatchProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'quarterly' | 'annual'>('quarterly')
  const [hoveredCompanyId, setHoveredCompanyId] = useState<string | null>(null)
  const [tempSelectedValue, setTempSelectedValue] = useState('')

  const sampleData: CompanyData[] = [
    {
      id: '1',
      name: 'Kolon Industries',
      q3_2024: { revenue: '11,427', operatingIncome: '25,012' },
      q4_2024: { revenue: '11,427', operatingIncome: '22,629' },
      q1_2025: { revenue: '11,427', operatingIncome: '25,241' },
      q2_2025: { revenue: '12,585', operatingIncome: '25,230' },
    },
    {
      id: '2',
      name: 'Hankook Tire & Technology',
      q3_2024: { revenue: '-', operatingIncome: '3,985' },
      q4_2024: { revenue: '-', operatingIncome: '3,485' },
      q1_2025: { revenue: '269', operatingIncome: '4,018' },
      q2_2025: { revenue: '453', operatingIncome: '4,031' },
    },
    {
      id: '3',
      name: 'DuPont',
      q3_2024: { revenue: '24,353', operatingIncome: '4,702' },
      q4_2024: { revenue: '25,315', operatingIncome: '4,733' },
      q1_2025: { revenue: '49,637', operatingIncome: '3,546' },
      q2_2025: { revenue: '53,696', operatingIncome: '3,536' },
    },
    {
      id: '4',
      name: 'Continental',
      q3_2024: { revenue: '43,200', operatingIncome: '11,570' },
      q4_2024: { revenue: '41,850', operatingIncome: '10,895' },
      q1_2025: { revenue: '41,391', operatingIncome: '10,638' },
      q2_2025: { revenue: '43,969', operatingIncome: '11,601' },
    },
    {
      id: '5',
      name: 'Goodyear',
      q3_2024: { revenue: '141,595', operatingIncome: '12,571' },
      q4_2024: { revenue: '143,839', operatingIncome: '13,124' },
      q1_2025: { revenue: '139,195', operatingIncome: '1,114' },
      q2_2025: { revenue: '139,200', operatingIncome: '1,123' },
    },
    {
      id: '6',
      name: 'Pirelli',
      q3_2024: { revenue: '64,320', operatingIncome: '964' },
      q4_2024: { revenue: '64,190', operatingIncome: '5,043' },
      q1_2025: { revenue: '57,190', operatingIncome: '2,593' },
      q2_2025: { revenue: '60,277', operatingIncome: '2,146' },
    },
  ]

  const displayData = data.length > 0 ? data : sampleData

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as 'quarterly' | 'annual')
  }

  const handleMouseEnter = (companyId: string) => {
    setHoveredCompanyId(companyId)
  }

  const handleMouseLeave = () => {
    setHoveredCompanyId(null)
  }

  return (
    <Card
      elevation={0}
      sx={{
        width: 556,
        border: '1px solid #DEE2E6',
        borderRadius: '4px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <DashboardCardHeader icon={tableIcon} title="Industry Watch" padding="17px 15px" />

      <Box padding="18px 12px 6px">
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <MISelect
            value={tempSelectedValue ?? ''}
            onChange={(selected) => {
              setTempSelectedValue(selected.target.value as string)
            }}
            options={displayData.map((company) => ({
              label: company.name,
              value: company.name,
            }))}
            sizeSelect="h36"
            placeholder="Select Competitors"
            width={260}
            type="input"
            useAllOption={false}
            showClearIcon
            darkPlaceholder
            sx={{
              backgroundColor: '#fff',
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                padding: '2px 0',
                fontSize: '14px',
                '& fieldset': {
                  borderColor: '#DEE2E6',
                },
                '&:hover fieldset': {
                  borderColor: '#DEE2E6',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#DEE2E6',
                },
                '& input': {
                  backgroundColor: '#fff !important',
                },
              },
            }}
          />
          <MIToggleSegmented
            options={[
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'annual', label: 'Annual' },
            ]}
            value={selectedPeriod}
            onChange={handlePeriodChange}
            size="medium"
          />
        </Stack>
      </Box>

      <Box padding="12px 12px 4px">
        <Stack direction="row" justifyContent="space-between" alignItems="center" padding="4px">
          <Typography variant="body3" color="gray.60" fontSize={12}>
            매출 · 영업이익 순 표기
          </Typography>
          <Typography variant="body3" color="gray.60" fontSize={12}>
            단위: 억 원
          </Typography>
        </Stack>
      </Box>

      {/* MITable에서는 셀 병합을 지원하지 않아 별도 구현 */}
      <Box padding="0 12px 12px">
        <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: '#F8F9FA',
                  borderBottom: '1px solid #CED4DA',
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#868E96',
                }}
              ></TableCell>
              <TableCell
                sx={{
                  backgroundColor: '#F8F9FA',
                  borderBottom: '1px solid #CED4DA',
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#868E96',
                  textAlign: 'center',
                }}
              >
                &#39;24 Q3
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: '#F8F9FA',
                  borderBottom: '1px solid #CED4DA',
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#868E96',
                  textAlign: 'center',
                }}
              >
                &#39;24 Q4
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: '#F8F9FA',
                  borderBottom: '1px solid #CED4DA',
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#868E96',
                  textAlign: 'center',
                }}
              >
                &#39;25 Q1
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: '#F8F9FA',
                  borderBottom: '1px solid #CED4DA',
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#868E96',
                  textAlign: 'center',
                }}
              >
                &#39;25 Q2
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.map((company) => (
              <>
                <TableRow
                  key={`${company.id}-revenue`}
                  onMouseEnter={() => handleMouseEnter(company.id)}
                  onMouseLeave={handleMouseLeave}
                  sx={{
                    backgroundColor: hoveredCompanyId === company.id ? '#F8F9FA' : '#FFFFFF',
                  }}
                >
                  <TableCell
                    rowSpan={2}
                    sx={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #DEE2E6',
                      verticalAlign: 'middle',
                      width: 86,
                      maxWidth: 86,
                    }}
                  >
                    <NameCell companyName={company.name} />
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '10px 12px',
                      borderBottom: '0px',
                      textAlign: 'right',
                      fontSize: 14,
                      color: '#212529',
                    }}
                  >
                    {company.q3_2024.revenue}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '10px 12px',
                      borderBottom: '0px',
                      textAlign: 'right',
                      fontSize: 14,
                      color: '#212529',
                    }}
                  >
                    {company.q4_2024.revenue}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '10px 12px',
                      borderBottom: '0px',
                      textAlign: 'right',
                      fontSize: 14,
                      color: '#212529',
                    }}
                  >
                    {company.q1_2025.revenue}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '10px 12px',
                      borderBottom: '0px',
                      textAlign: 'right',
                      fontSize: 14,
                      color: '#212529',
                    }}
                  >
                    {company.q2_2025.revenue}
                  </TableCell>
                </TableRow>

                <TableRow
                  key={`${company.id}-operating`}
                  onMouseEnter={() => handleMouseEnter(company.id)}
                  onMouseLeave={handleMouseLeave}
                  sx={{
                    backgroundColor: hoveredCompanyId === company.id ? '#F8F9FA' : '#FFFFFF',
                  }}
                >
                  <TableCell
                    sx={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #DEE2E6',
                      textAlign: 'right',
                      fontSize: 14,
                      color: '#212529',
                    }}
                  >
                    {company.q3_2024.operatingIncome}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #DEE2E6',
                      textAlign: 'right',
                      fontSize: 14,
                      color: '#212529',
                    }}
                  >
                    {company.q4_2024.operatingIncome}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #DEE2E6',
                      textAlign: 'right',
                      fontSize: 14,
                      color: '#212529',
                    }}
                  >
                    {company.q1_2025.operatingIncome}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #DEE2E6',
                      textAlign: 'right',
                      fontSize: 14,
                      color: '#212529',
                    }}
                  >
                    {company.q2_2025.operatingIncome}
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Box padding="12px">
        <MIButton width="100%" color="gray" type="outlined" contentType="text" size="h42" onClick={() => {}}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body1" color="gray.90" fontWeight={600}>
              View more
            </Typography>
            <KeyboardArrowRightIcon fontSize="small" sx={{ color: '#868E96' }} />
          </Box>
        </MIButton>
      </Box>
    </Card>
  )
}

export default IndustryWatch
