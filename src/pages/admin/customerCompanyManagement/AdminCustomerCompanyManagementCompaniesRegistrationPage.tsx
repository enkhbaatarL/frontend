import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminAutoComplete from '@/components/admin/AdminAutoComplete'
import AdminButton from '@/components/admin/AdminButton'
import AdminDatePicker from '@/components/admin/AdminDatePicker'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService from '@/service/admin/companies'
import { Nullable, ICommonOptions } from '@/types/common'

const ADD_DATE_RANGE = 100 // days

interface HeaderProp {
  onCancel: () => void
  onSave: () => void
  saveAble: boolean
}

const Header = ({ onCancel, onSave, saveAble }: HeaderProp) => (
  <Flex gap={4}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onCancel}>
      {t('취소')}
    </AdminButton>
    <AdminButton variant="contained" color="primary" size="h34" onClick={onSave} disabled={!saveAble}>
      {t('등록')}
    </AdminButton>
  </Flex>
)

const AdminCustomerCompanyManagementCompaniesRegistrationPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()

  const today = dayjs()

  const [selectedCompany, setSelectedCompany] = useState<Nullable<ICommonOptions>>(null)
  const [usageBeginDate, setUsageBeginDate] = useState<Nullable<Dayjs>>(today)
  const [usageEndDate, setUsageEndDate] = useState<Nullable<Dayjs>>(today.add(ADD_DATE_RANGE, 'years'))

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { data } = useQuery({
    queryKey: ['group-companies'],
    queryFn: async () => await companiesService.getGroupCompanies(),
  })

  const options = useMemo(
    () =>
      data?.map((company) => ({
        value: company.companyCd,
        label: company.companyNm,
      })),
    [data],
  )

  const navigateToList = useCallback(() => {
    navigate('/admin/customer-company/companies', { replace: true })
  }, [navigate])

  const onCancel = () => {
    setShowCancelDialog(true)
  }

  const onSave = useCallback(async () => {
    const response = await companiesService.registerCompany({
      companyCd: selectedCompany?.value ?? '',
      companyNm: selectedCompany?.label ?? '',
      usageBeginDate: usageBeginDate?.format('YYYY-MM-DD').replace(/-/g, '') ?? '',
      usageEndDate: usageEndDate?.format('YYYY-MM-DD').replace(/-/g, '') ?? '',
    })

    setShowConfirmDialog(false)
    if (response.status) {
      navigateToList()
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
    } else {
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
    }
  }, [navigateToList, selectedCompany?.label, selectedCompany?.value, showSnackbar, usageBeginDate, usageEndDate])

  const saveAble = useMemo(
    () => selectedCompany !== null && usageBeginDate !== null && usageEndDate !== null,
    [selectedCompany, usageBeginDate, usageEndDate],
  )

  useEffect(() => {
    setCustomComponent(<Header onCancel={onCancel} onSave={() => setShowConfirmDialog(true)} saveAble={saveAble} />)

    return () => {
      setCustomComponent(null)
    }
  }, [onSave, saveAble, setCustomComponent])

  return (
    <>
      <Box display={'flex'} flexDirection={'column'} gap={4}>
        <Box maxWidth={335}>
          <Typography component={'p'} sx={{ mb: 1 }} variant="subtitle">
            고객사명
            <Typography component={'sup'} variant="asterisk" color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component="p" variant="subtext2" color="gray.60" mb={3}>
            고객사로 등록할 회사를 선택하세요.
          </Typography>
          <AdminAutoComplete<ICommonOptions>
            fullWidth
            disablePortal
            options={options ?? []}
            onChange={(_event, newValue) => setSelectedCompany(newValue)}
            placeholder="검색 또는 선택하세요."
          />
        </Box>

        <Box maxWidth={700}>
          <Typography component={'p'} sx={{ mb: 1 }} variant="subtitle">
            사용 기간
            <Typography component={'sup'} variant="asterisk" color="point.red1">
              *
            </Typography>
          </Typography>
          <Typography component="p" variant="subtext2" color="gray.60" mb={3}>
            고객사의 MI Platform 사용 기간을 입력하세요.
          </Typography>
          <Flex gap={2}>
            <AdminDatePicker value={usageBeginDate} onChange={(date) => setUsageBeginDate(date)} />
            <Typography variant="breadcrumbs" color="gray.50" sx={{ margin: '5px', marginTop: '10px' }}>
              ~
            </Typography>
            <AdminDatePicker minDate={usageBeginDate || today} value={usageEndDate} onChange={(date) => setUsageEndDate(date)} />
          </Flex>
        </Box>
      </Box>
      <MIConfirm
        open={showCancelDialog}
        title={t('취소하시겠습니까?')}
        handleClose={() => setShowCancelDialog(false)}
        actions={[
          { label: '이어서 작성', variant: 'outlined', color: 'gray', onClick: () => setShowCancelDialog(false) },
          {
            label: '취소 및 이동',
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setShowCancelDialog(false)
              navigateToList()
            },
          },
        ]}
      >
        {t('취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.')}
      </MIConfirm>
      <MIConfirm
        open={showConfirmDialog}
        title={t('등록하시겠습니까?')}
        handleClose={() => setShowConfirmDialog(false)}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: () => setShowConfirmDialog(false),
          },
          {
            label: '등록',
            variant: 'filled',
            color: 'primary',
            onClick: () => onSave(),
          },
        ]}
      />
    </>
  )
}

export default AdminCustomerCompanyManagementCompaniesRegistrationPage
