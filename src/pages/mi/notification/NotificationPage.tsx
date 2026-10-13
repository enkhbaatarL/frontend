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
import { getNextGenMIEventDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import notificationService, { IMyNotification, INotificationRequest } from '@/service/mi/notification'
import { IPaginationResponse } from '@/types/api'

type NotificationListRow = IMyNotification & {
  rowKey: string
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
    IPaginationResponse<IMyNotification>
  >(
    notificationService.getMyNotifications,
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

  const rows = useMemo<NotificationListRow[]>(
    () =>
      (data?.detail ?? []).map((row, index) => ({
        ...row,
        rowKey:
          row.notificationType === 'EVENT_KEYWORD'
            ? `EVENT_KEYWORD-${row.eventKeyword?.keywordSettingId}-${row.eventKeyword?.eventId}-${index}`
            : `GOODS_THRESHOLD-${row.goodsThreshold?.goodsDataSourceNo}-${index}`,
      })),
    [data?.detail],
  )

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
          <MITableUser<NotificationListRow>
            hidePagination={data?.totalElements === 0 || !data?.totalElements}
            tableProps={{
              loading: isLoading,
              noRowMessage: '설정된 알람이 없습니다.',
              rowId: 'rowKey',
              rows,
              onRowClick: ({ row }) => {
                if (row.notificationType === 'EVENT_KEYWORD' && row.eventKeyword && Number.isFinite(row.eventKeyword.eventId)) {
                  navigate(getNextGenMIEventDetailPath(String(row.eventKeyword.eventId)))
                  return
                }
                const goods = row.goodsThreshold
                if (!goods) return
                navigate(`/mi/data-detail/${goods.goodsNo}/${goods.goodsDataNo}`, { state: { goodsDataSrcNo: goods.goodsDataSourceNo } })
              },
              columns: [
                {
                  field: 'notificationType',
                  headerName: '구분',
                  width: 120,
                  sortable: false,
                  renderCell: (params) => (
                    <MITableCell
                      value={
                        params.row.notificationType === 'EVENT_KEYWORD'
                          ? 'Keyword'
                          : params.row.goodsThreshold?.notificationType === 'ACTUAL'
                            ? 'Data'
                            : 'MI'
                      }
                    />
                  ),
                },
                {
                  field: 'dataTitle',
                  headerName: 'Data Title',
                  flex: 3,
                  sortable: false,
                  valueGetter: (_, row) =>
                    row.notificationType === 'EVENT_KEYWORD' ? row.eventKeyword?.keywordName : row.goodsThreshold?.goodsDataNm,
                  renderCell: (params) => <MITableCell value={params.value} />,
                },
                {
                  field: 'structuredData',
                  headerName: 'Structured Data',
                  flex: 2,
                  sortable: false,
                  renderCell: (params) =>
                    params.row.notificationType === 'EVENT_KEYWORD' && params.row.eventKeyword ? (
                      <MITableCell>
                        <Typography variant="tableBody2" color="gray.90" noWrap>
                          {highlightKeyword(params.row.eventKeyword.eventName, params.row.eventKeyword.keywordName)}
                        </Typography>
                      </MITableCell>
                    ) : (
                      <MITableCell value={params.row.goodsThreshold?.goodsDataSourceNm} />
                    ),
                },
                {
                  field: 'settingNotificationCount',
                  headerName: 'Notifications',
                  width: 120,
                  align: 'center',
                  sortable: false,
                  renderCell: (params) =>
                    params.row.notificationType === 'EVENT_KEYWORD' || !params.row.goodsThreshold ? null : (
                      <MIChip
                        label={params.row.goodsThreshold.settingNotificationCount}
                        size="h22"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenSettingModal(
                            params.row.goodsThreshold?.goodsDataSourceNo ?? 0,
                            params.row.goodsThreshold?.notificationType ?? '',
                          )
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
              data: data as unknown as IPaginationResponse<NotificationListRow>,
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
