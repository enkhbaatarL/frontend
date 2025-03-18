import { Autocomplete } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useAdminMenuItems from '@/hooks/useAdminMenuItems'
import useAdminSnackbar from '@/hooks/useAdminSnackbar'
import companiesService from '@/service/admin/companies'
import { Nullable, ICommonOptions } from '@/types/common'

const ADD_DATE_RANGE = 100 // days

interface HeaderProp {
  onCancel: () => void
  onSave: () => void
  saveAble: boolean
}

const Header = ({ onCancel, onSave, saveAble }: HeaderProp) => {
  return (
    <Flex gap={4}>
      <AdminButton variant="contained" size="small" onClick={onCancel}>
        {t('취소')}
      </AdminButton>
      <AdminButton variant="contained" color="primary" size="small" onClick={onSave} disabled={!saveAble}>
        {t('등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminCustomerCompanyManagementCompaniesRegistrationPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const navigate = useNavigate()
  const { getPath } = useAdminMenuItems()
  const { showSnackbar } = useAdminSnackbar()

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

  const options = useMemo(() => {
    return data?.map((company) => {
      return {
        value: company.companyCd,
        label: company.companyNm,
      }
    })
  }, [data])

  const navigateToList = useCallback(() => {
    navigate(getPath('customer-companies'), { replace: true })
  }, [navigate])

  const onCancel = () => {
    setShowCancelDialog(true)
  }

  const onSave = useCallback(async () => {
    const response = await companiesService.registerCompany({
      companyCd: selectedCompany?.value ?? '',
      companyNm: selectedCompany?.label ?? '',
      usageBeginDate: usageBeginDate?.format('YYYY-MM-DD') ?? '',
      usageEndDate: usageEndDate?.format('YYYY-MM-DD') ?? '',
    })

    setShowConfirmDialog(false)
    if (response.status) {
      navigateToList()
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
    } else {
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
    }
  }, [navigateToList, selectedCompany?.label, selectedCompany?.value, usageBeginDate, usageEndDate])

  const saveAble = useMemo(() => {
    return selectedCompany !== null && usageBeginDate !== null && usageEndDate !== null
  }, [selectedCompany, usageBeginDate, usageEndDate])

  useEffect(() => {
    setCustomComponent(<Header onCancel={onCancel} onSave={() => setShowConfirmDialog(true)} saveAble={saveAble} />)

    return () => {
      setCustomComponent(null)
    }
  }, [onSave, saveAble, setCustomComponent])

  return (
    <>
      <Flex direction="column" gap={4}>
        <div>{t('고객사명')}*</div>
        <div>{t('고객사로 등록할 회사를 선택하세요')}</div>
        <Autocomplete
          disablePortal
          options={options ?? []}
          value={selectedCompany}
          onChange={(_event, newValue) => setSelectedCompany(newValue)}
          sx={{ width: 300 }}
          renderInput={(params) => <AdminTextField {...params} placeholder="검색 또는 선택하세요." />}
        />

        <div>{t('사용 기간')}*</div>
        <div>{t('고객사의 MI Platform 사용 기간을 입력하세요.')}</div>
        <Flex gap={2}>
          <DatePicker format="YYYY-MM-DD" value={usageBeginDate} onChange={(date) => setUsageBeginDate(date)} />
          <div>~</div>
          <DatePicker
            format="YYYY-MM-DD"
            minDate={today}
            maxDate={today.add(ADD_DATE_RANGE, 'years')}
            value={usageEndDate}
            onChange={(date) => setUsageEndDate(date)}
          />
        </Flex>
      </Flex>
      <AdminConfirm
        open={showCancelDialog}
        title={t('취소하시겠습니까?')}
        handleClose={() => setShowCancelDialog(false)}
        handleConfirm={() => {
          navigateToList()
          showSnackbar(t('취소되었습니다.'), { variant: 'info' })
          showSnackbar(t('문제가 발생했습니다.'), { variant: 'error', body: t('나중에 다시 시도해 주세요.') })
        }}
        closeText={t('이어서 작성')}
        confirmText={t('취소 및 이동')}
      >
        {t('취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.')}
      </AdminConfirm>
      <AdminConfirm
        open={showConfirmDialog}
        title={t('등록하시겠습니까?')}
        handleClose={() => setShowConfirmDialog(false)}
        handleConfirm={onSave}
      />
    </>
  )
}

export default AdminCustomerCompanyManagementCompaniesRegistrationPage
