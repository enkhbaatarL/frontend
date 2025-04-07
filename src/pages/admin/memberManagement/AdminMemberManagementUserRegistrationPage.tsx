import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useEffect } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import companiesService, { IGroupUserInfo, IGroupUserRequest } from '@/service/admin/companies'
import { IPaginationResponse } from '@/types/api'

const AdminCustomerCompanyManagementUserPageHeader = ({
  registeredUsers,
  setIsOpenCancel,
  setIsOpenRegistration,
}: {
  registeredUsers: []
  setIsOpenCancel: (value: boolean) => void
  setIsOpenRegistration: (value: boolean) => void
}) => (
  <Flex gap={10}>
    <AdminButton
      variant="outlined"
      color="secondary"
      size="h34"
      onClick={() => {
        setIsOpenCancel(true)
      }}
    >
      {t('취소')}
    </AdminButton>
    <AdminButton
      disabled={registeredUsers.length === 0}
      color="primary"
      variant="contained"
      size="h34"
      onClick={() => setIsOpenRegistration(true)}
    >
      {t('등록')}
    </AdminButton>
  </Flex>
)

const AdminMemberManagementUserRegistrationPage = () => {
  const { setCustomComponent } = useAdminHeader()

  const { filter, updateFilter, resetFilter, search, isInitialState, isSearchedState } = useSearchFilter<
    Omit<IGroupUserRequest, 'userRoleCd'>,
    IPaginationResponse<IGroupUserInfo>
  >(
    companiesService.getGroupUsers,
    {
      companyCd: '',
      userNm: '',
      emailAddress: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  const { data: filterOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => await companiesService.getDepartmentAll(),
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    setCustomComponent(
      <AdminCustomerCompanyManagementUserPageHeader
        setIsOpenRegistration={(value: boolean) => value}
        setIsOpenCancel={(value: boolean) => value}
        registeredUsers={[]}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return (
    <AdminSearchFilter onSearch={search} onReset={resetFilter} disabledSearch={isSearchedState} disabledReset={isInitialState}>
      <AdminSelect
        label={t('회사명')}
        value={filter.companyCd}
        onChange={(e) => {
          updateFilter('companyCd', e.target.value as string)
        }}
        options={filterOptions?.map(({ companyCd, companyNm }) => ({ label: companyNm, value: companyCd })) ?? []}
        useAllOption={false}
      />
      <AdminTextField
        label={t('이름')}
        value={filter.userNm}
        onChange={(e) => {
          updateFilter('userNm', e.target.value)
        }}
      />
      <AdminTextField
        label={t('이메일')}
        value={filter.emailAddress}
        onChange={(e) => {
          updateFilter('emailAddress', e.target.value)
        }}
      />
    </AdminSearchFilter>
  )
}

export default AdminMemberManagementUserRegistrationPage
