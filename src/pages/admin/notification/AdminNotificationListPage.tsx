import { Box, Divider, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useMemo, useState } from 'react'

import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSkeleton from '@/components/admin/AdminSkeleton'
import AdminTable from '@/components/admin/AdminTable'
import MIButton from '@/components/common/button/MIButton'
import MIChip from '@/components/common/chip/MIChip'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIDatePicker from '@/components/common/datepicker/MIDatePicker'
import EmailIcon from '@/components/common/icons/table/EmailIcon'
import FailIcon from '@/components/common/icons/table/FailIcon'
import InfoIcon from '@/components/common/icons/table/InfoIcon'
import SuccessIcon from '@/components/common/icons/table/SuccessIcon'
import MIField from '@/components/common/input/MIField'
import MISelect from '@/components/common/select/MISelect'
import MITableCell from '@/components/common/table/MITableCell'
import useSearchFilter from '@/hooks/useSearchFilter'
import alarmService, { IAlarmDetail, IAlarmPaginationResponse, IAlarmRequest } from '@/service/admin/alarm'

const sendSuccessOptions = [
  { label: '성공', value: true },
  { label: '실패', value: false },
]

interface MITableStatusSummaryProps {
  totalEmailSendCnt: number
  totalEmailSuccessCnt: number
  totalEmailFailCnt: number
  lastUpdatedDt: string
}

interface StatusItemProps {
  icon: React.ReactNode
  title: string
  value: number
}

const containerStyles = {
  display: 'flex',
  flexDirection: 'row',
  gap: '10px',
  alignItems: 'center',
  pl: '12px',
  padding: '10px 12px',
  background: '#F8F9FA',
  height: '54px',
  borderTop: '1px solid',
  borderBottom: '1px solid',
  borderColor: '#DEE2E6',
  boxSizing: 'border-box',
}

const statusContainerStyles = {
  display: 'flex',
  color: '#868E96',
  flexDirection: 'row',
  gap: '8px',
  alignItems: 'center',
}

const statusItemStyles = {
  display: 'flex',
  flexDirection: 'row',
  gap: '4px',
  alignItems: 'center',
}

const StatusItem = ({ icon, title, value }: StatusItemProps) => (
  <Box sx={statusItemStyles}>
    {icon}
    <Typography variant="body2M14">{title}</Typography>
    <Typography color="primary" variant="sectionTitle">
      {value}
    </Typography>
  </Box>
)

const VerticalDivider = () => (
  <Divider
    orientation="vertical"
    flexItem
    sx={{
      color: '#DEE2E6',
      height: '14px',
      marginY: 'auto',
    }}
  />
)

const AdminNotificationListPage = () => {
  const [viewErrorReasonModal, setViewErrorReasonModal] = useState<{ open: boolean; errorLog: string }>({ open: false, errorLog: '' })

  const {
    filter,
    updateFilter,
    pagination,
    updateSize,
    updatePage,
    resetFilter,
    search,
    isPureState,
    data,
    isInitialState,
    isSearchedState,
    isLoading,
  } = useSearchFilter<IAlarmRequest, IAlarmPaginationResponse<IAlarmDetail>>(
    alarmService.getAlarmList,
    {
      startDate: dayjs().subtract(1, 'day').format('YYYYMMDD'),
      endDate: dayjs().format('YYYYMMDD'),
      isSendSuccess: '',
    },
    {
      page: 1,
      size: 20,
    },
    {
      initialFetch: false,
    },
  )

  const { startDate, endDate } = useMemo(
    () => ({
      startDate: filter.startDate ? dayjs(filter.startDate) : null,
      endDate: filter.endDate ? dayjs(filter.endDate) : null,
    }),
    [filter.endDate, filter.startDate],
  )

  const extension: MITableStatusSummaryProps = useMemo(() => {
    if (!data?.extension)
      return {
        totalEmailSendCnt: 0,
        totalEmailSuccessCnt: 0,
        totalEmailFailCnt: 0,
        lastUpdatedDt: '',
      }
    return data.extension
  }, [data])

  const columns: GridColDef[] = [
    { field: 'customerCompanyNm', headerName: '고객사명', flex: 1, minWidth: 120 },
    { field: 'emailTitleNm', headerName: '알람 발송 내용', flex: 2, minWidth: 200 },
    {
      field: 'userNm',
      headerName: '발송 대상',
      flex: 2,
      minWidth: 200,
      renderCell: ({ row }) => (
        <MITableCell value={row.userNm} tooltip tooltipContent={`${row.userNm} / ${row.departmentNm} / ${row.customerCompanyNm}`} />
      ),
    },
    {
      field: 'isSendSuccess',
      headerName: '발송 결과',
      flex: 1,
      minWidth: 100,
      align: 'center',
      renderCell: (params) => {
        if (params.value === false) {
          return <MIChip label="실패" color="red" size="h20" />
        }
        if (params.value === true) {
          return <MIChip label="성공" color="green" size="h20" />
        }

        return null
      },
    },
    {
      field: 'emailSendErrorCntt',
      headerName: '실패 사유 상세',
      flex: 1.5,
      minWidth: 150,
      align: 'center',
      renderCell: ({ row }) => {
        if (row.isSendSuccess === true) return <></>
        return (
          <MITableCell>
            <MIButton
              type="outlined"
              size="h28"
              color="gray"
              onClick={() => {
                setViewErrorReasonModal({
                  open: true,
                  errorLog: row.emailSendErrorCntt,
                })
              }}
              width={'96px'}
            >
              실패 사유 상세
            </MIButton>
          </MITableCell>
        )
      },
    },
    {
      field: 'emailSendDtm',
      headerName: '발송 일시',
      flex: 1.5,
      minWidth: 150,
      align: 'center',
      renderCell: (params) => (
        <MITableCell>
          <Typography color="contentText.Subtext" variant="body2R14">
            {params.value}
          </Typography>
        </MITableCell>
      ),
    },
  ]
  const handleCheckErrorLog = (errorLog: string) => setViewErrorReasonModal({ open: false, errorLog })
  return (
    <div>
      <Box sx={{ marginBottom: '16px' }}>
        <Typography variant="contentTitle" color="contentText.Black">
          발송 내역 목록
        </Typography>
      </Box>

      <AdminSearchFilter
        onSearch={search}
        onReset={resetFilter}
        disabledSearch={!filter.endDate || !filter.startDate || isSearchedState}
        disabledReset={isInitialState}
      >
        <MIField label="기간" required subIcon={<InfoIcon />} sx={{ width: '400px !important' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 260 }}>
            <MIDatePicker
              value={startDate ?? null}
              defaultValue={null}
              onChange={(value) => {
                if (!value) updateFilter('startDate', undefined)
                else updateFilter('startDate', dayjs(value).format('YYYYMMDD'))
              }}
              format="YYYY-MM-DD"
              size="h34"
            />
            <span style={{ width: '9px' }}>~</span>
            <MIDatePicker
              value={endDate ?? null}
              defaultValue={null}
              onChange={(value) => {
                if (!value) updateFilter('endDate', undefined)
                else updateFilter('endDate', dayjs(value).format('YYYYMMDD'))
              }}
              format="YYYY-MM-DD"
              size="h34"
            />
          </div>
        </MIField>
        <MIField label={t('발송 결과')}>
          <MISelect
            value={filter.isSendSuccess}
            onChange={(e) => updateFilter('isSendSuccess', e.target.value as boolean | '')}
            options={sendSuccessOptions}
            type="input"
          ></MISelect>
        </MIField>
      </AdminSearchFilter>
      <AdminSkeleton loading={isLoading} table>
        <div
          style={{
            marginTop: 30,
          }}
        >
          <Box sx={containerStyles}>
            <Box sx={statusContainerStyles}>
              <StatusItem icon={<EmailIcon />} title="발송" value={extension.totalEmailSendCnt ?? 0} />
              <VerticalDivider />
              <StatusItem icon={<SuccessIcon />} title="성공" value={extension.totalEmailSuccessCnt ?? 0} />
              <VerticalDivider />
              <StatusItem icon={<FailIcon />} title="실패" value={extension.totalEmailFailCnt ?? 0} />
            </Box>
            <Typography variant="body3M12" color="gray.60">
              Last Updated {extension.lastUpdatedDt}
            </Typography>
          </Box>
          <AdminTable
            getRowId={(row) => row.emailSendSn}
            columns={columns}
            data={data}
            isLoading={isLoading}
            size={pagination?.size}
            onSizeChange={updateSize}
            onPageChange={updatePage}
            noRowMessage={isPureState ? t('기간을 검색하세요.') : undefined}
          />
        </div>

        <MIConfirm
          open={viewErrorReasonModal.open}
          title="실패 사유 상세"
          width={554}
          handleClose={() => setViewErrorReasonModal({ open: false, errorLog: '' })}
          actions={[
            {
              label: '확인',
              variant: 'filled',
              color: 'primary',
              onClick: () => handleCheckErrorLog(viewErrorReasonModal.errorLog),
            },
          ]}
        >
          <Box
            sx={{
              padding: '20px',
              backgroundColor: 'gray.10',
              borderRadius: '6px',
            }}
          >
            <Typography variant="body2M14" color="gray.70">
              {viewErrorReasonModal.errorLog}
            </Typography>
          </Box>
        </MIConfirm>
      </AdminSkeleton>
    </div>
  )
}

export default AdminNotificationListPage
