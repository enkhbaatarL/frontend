import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'
import { useState } from 'react'

import MIChip from '@/components/common/chip/MIChip'
import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import useSearchFilter from '@/hooks/useSearchFilter'
import SettingModalComponent from '@/pages/mi/dataDetail/components/SettingModalComponent'
import notificationService, { INotificationInfo, INotificationRequest } from '@/service/mi/notification'
import { IPaginationResponse } from '@/types/api'

const NotificationPage = () => {
  const handleClickDetail = () => {
    alert('redirect to detail')
  }

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

  const handleOpenSettingModal = (goodsDataSourceNo: number, notificationType: string) => {
    setSelectedGoodsDataSourceNo(goodsDataSourceNo)
    setNotificationType(notificationType)
    setIsOpenSetting(true)
  }

  const handleCloseSettingModal = () => {
    setIsOpenSetting(false)
    setSelectedGoodsDataSourceNo(undefined)
    setNotificationType('')
  }

  return (
    <>
      <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
        <Box paddingTop={10}>
          <Typography mb={5} color="gray.90" component="h2" variant="heading2">
            My Notifications
          </Typography>
          <MIInput
            width={458}
            maxWidth={'100%'}
            placeholder="Search for Notifications"
            size="h46"
            startIcon={<SearchIcon style={{ color: '#CED4DA' }} />}
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
              rowId: 'goodsDataNo',
              rows: data?.detail,

              onRowClick: handleClickDetail,
              columns: [
                {
                  field: 'notificationType',
                  headerName: '구분',
                  width: 120,
                  renderCell: (params) => <MITableCell value={params.value === 'ACTUAL' ? 'Data' : 'MI'} />,
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
                  renderCell: (params) => <MITableCell value={params.value} />,
                },
                {
                  field: 'settingNotificationCount',
                  headerName: 'Notifications',
                  width: 120,
                  align: 'center',
                  renderCell: (params) => (
                    <MIChip
                      label={params.value}
                      size="h24"
                      color="blue"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenSettingModal(params.row.goodsDataSourceNo, params.row.notificationType)
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
