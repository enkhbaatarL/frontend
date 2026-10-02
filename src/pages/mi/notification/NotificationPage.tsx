import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIChip from '@/components/common/chip/MIChip'
import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import useSearchFilter from '@/hooks/useSearchFilter'
import SettingModalComponent from '@/pages/mi/dataDetail/components/SettingModalComponent'
import { KEYWORD_ALERT_HISTORY } from '@/pages/mi/nextGenMI/utils/keywordAlertStore'
import notificationService, { INotificationInfo, INotificationRequest } from '@/service/mi/notification'
import { IPaginationResponse } from '@/types/api'

type NotificationListRow = INotificationInfo & {
  goodsNo?: number
  notificationType?: string
  eventId?: string
  keyword?: string
}

const highlightKeyword = (text: string, keyword: string) => {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))

  return parts.map((part, index) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <Box key={`${part}-${index}`} component="span" fontWeight={700}>
        {part}
      </Box>
    ) : (
      part
    ),
  )
}

const NotificationPage = () => {
  const navigate = useNavigate()

  const [isOpenSetting, setIsOpenSetting] = useState(false)
  const [selectedGoodsDataSourceNo, setSelectedGoodsDataSourceNo] = useState<number | undefined>(undefined)
  const [notificationType, setNotificationType] = useState<string>('')

  const { filter, data, updateFilter, pagination, updatePage, updateSize, updateFilterWithSearch, isLoading } = useSearchFilter<
    INotificationRequest,
    IPaginationResponse<INotificationInfo>
  >(
    notificationService.getNotificationSettingDataList,
    {
      search: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  const handleOpenSettingModal = (goodsDataSourceNo: number, nextNotificationType: string) => {
    setSelectedGoodsDataSourceNo(goodsDataSourceNo)
    setNotificationType(nextNotificationType)
    setIsOpenSetting(true)
  }

  const handleCloseSettingModal = () => {
    setIsOpenSetting(false)
    setSelectedGoodsDataSourceNo(undefined)
    setNotificationType('')
  }

  const rows = useMemo<NotificationListRow[]>(() => {
    // #DELETE
    const keywordRows: NotificationListRow[] =
      (pagination?.page ?? 1) === 1
        ? KEYWORD_ALERT_HISTORY.map((item, index) => ({
          goodsDataNo: 0,
          goodsNo: 0,
          goodsDataNm: item.keyword,
          goodsDataSourceNo: -(index + 1),
          goodsDataSourceNm: item.eventName,
          settingNotificationCount: 0,
          notificationType: 'KEYWORD',
          eventId: item.eventId,
          keyword: item.keyword,
        }))
        : []

    return [...keywordRows, ...(data?.detail ?? [])]
  }, [data?.detail, pagination?.page])

  return (
    <>
      <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
        <Box paddingTop={10}>
          <Typography mb={5} color="gray.90" component="h2" variant="heading2">
            My Notifications
          </Typography>
          <MIInput
            width={360}
            maxWidth={'100%'}
            placeholder="Search for Notifications"
            size="h46"
            endIcon={<SearchIcon style={{ color: '#CED4DA' }} sx={{ fontSize: 20 }} />}
            value={filter?.search ?? ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            onKeyDown={({ key, target }) => key === 'Enter' && updateFilterWithSearch('search', (target as HTMLInputElement).value)}
            onClear={() => updateFilterWithSearch('search', '')}
          />
        </Box>
        <Box paddingTop={5} paddingBottom={5}>
          <MITableUser
            hidePagination={data?.totalElements === 0 || !data?.totalElements}
            tableProps={{
              loading: isLoading,
              noRowMessage: '설정된 알람이 없습니다.',
              rowId: 'goodsDataSourceNo',
              rows,
              onRowClick: ({ row }) => {
                // #DELETE
                if (row.notificationType === 'KEYWORD' && row.eventId) {
                  navigate(`/mi/next-gen-mi/events/${row.eventId}`)
                  return
                }
                navigate(`/mi/data-detail/${row.goodsNo}/${row.goodsDataNo}`, { state: { goodsDataSrcNo: row.goodsDataSourceNo } })
              },
              columns: [
                {
                  field: 'notificationType',
                  headerName: '구분',
                  width: 120,
                  renderCell: (params) => (
                    <MITableCell value={params.value === 'ACTUAL' ? 'Data' : params.value === 'KEYWORD' ? 'Keyword' : 'MI'} />
                  ),
                },
                {
                  field: 'goodsDataNm',
                  headerName: 'Data Title',
                  flex: 3,
                  renderCell: (params) => <MITableCell value={params.value} />,
                },
                {
                  field: 'goodsDataSourceNm',
                  headerName: 'Structured Data',
                  flex: 2,
                  renderCell: (params) =>
                    params.row.notificationType === 'KEYWORD' && params.row.keyword ? (
                      <MITableCell>
                        <Typography variant="tableBody2" color="gray.90" noWrap>
                          {highlightKeyword(String(params.value ?? ''), params.row.keyword)}
                        </Typography>
                      </MITableCell>
                    ) : (
                      <MITableCell value={params.value} />
                    ),
                },
                {
                  field: 'settingNotificationCount',
                  headerName: 'Notifications',
                  width: 120,
                  align: 'center',
                  renderCell: (params) =>
                    params.row.notificationType === 'KEYWORD' ? null : (
                      <MIChip
                        label={params.value}
                        size="h22"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenSettingModal(params.row.goodsDataSourceNo, params.row.notificationType ?? '')
                        }}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: '700 !important',
                          border: '1px solid rgba(46, 63, 94, 0.50) !important',
                          backgroundColor: '#F0F4FF !important',
                          fontSize: '13px !important',
                          color: '#2E3F5E !important',
                          '.MuiTypography-root': {
                            fontWeight: '700 !important',
                            lineHeight: '1.5',
                          },
                        }}
                      />
                    ),
                },
              ],
            }}
            paginationProps={{
              data,
              size: pagination?.size,
              onPageChange: updatePage,
              onSizeChange: updateSize,
            }}
          />
        </Box>
        {selectedGoodsDataSourceNo && (
          <SettingModalComponent
            isNotification
            open={isOpenSetting}
            onClose={handleCloseSettingModal}
            goodsDataSourceNoList={[{ goodsDataSourceNm: '', goodsDataSourceNo: selectedGoodsDataSourceNo, type: notificationType }]}
          />
        )}
      </Box>
    </>
  )
}

export default NotificationPage
