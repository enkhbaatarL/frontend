import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ErrorIcon from '@mui/icons-material/Error'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSkeleton from '@/components/admin/AdminSkeleton'
import AdminTable, { AdminTableAction, AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField'
import MISelect from '@/components/common/select/MISelect'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import boardService, { IFaqInfo, IFaqRequest } from '@/service/admin/board'
import { IPaginationResponse } from '@/types/api'

const AdminBoardsFaqPageHeader = () => {
  const navigate = useNavigate()

  return (
    <Flex gap={10}>
      <AdminButton variant="contained" color="primary" size="h34" onClick={() => navigate('/admin/boards/faq/registration')}>
        {t('FAQ 등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminBoardsFaqPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [deleteFaqBulletinNo, setDeleteFaqBulletinNo] = useState<number | null>(null)

  const {
    filter,
    updateFilter,
    pagination,
    updateSize,
    updatePage,
    resetFilter,
    search,
    data,
    refetch,
    isInitialState,
    isSearchedState,
    isLoading,
  } = useSearchFilter<IFaqRequest, IPaginationResponse<IFaqInfo>>(
    boardService.getFaq,
    {
      category: '',
      keyword: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  const { data: filterOptions, isLoading: filterOptionsIsLoading } = useQuery({
    queryKey: ['getFaqFilter'],
    queryFn: async () => await boardService.getFaqFilter(),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const handleDeleteFaq = useCallback(async () => {
    if (!deleteFaqBulletinNo) return

    try {
      const response = await boardService.deleteFaq(deleteFaqBulletinNo)

      if (response.status) {
        showSnackbar(t('게시글이 삭제되었습니다.'), { variant: 'success' })
        await refetch()
      }
    } catch (error) {
      console.error(error)
      showSnackbar(t('게시글 삭제에 실패했습니다.'), { variant: 'error' })
    }

    setDeleteFaqBulletinNo(null)
  }, [deleteFaqBulletinNo, refetch, showSnackbar])

  const columns: GridColDef[] = [
    {
      field: 'bulletinCategorySeparateCd',
      headerName: t('카테고리'),
      width: 120,
      align: 'left',
      renderCell: (param) => {
        const { bulletinCategorySeparateCd } = param.row
        const category = filterOptions?.category.find(({ key }) => key === bulletinCategorySeparateCd)?.value

        return (
          <AdminTableCell ellipsis cursorPointer>
            {category}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'bulletinTitleNm',
      headerName: t('제목'),
      width: 400,
    },
    {
      field: 'createUserNm',
      headerName: t('등록자'),
      width: 120,
      renderCell: (param) => {
        const { createUserNm, createUserDeptNm, createUserCpnyNm } = param.row.auditInfo
        const tooltipContent = `${createUserNm} / ${createUserDeptNm} / ${createUserCpnyNm}`

        return (
          <AdminTableCell tooltipContent={tooltipContent} cursorPointer>
            {createUserNm}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'createDt',
      headerName: t('등록일'),
      width: 120,
      align: 'center',
      renderCell: (param) => {
        const { createDt } = param.row.auditInfo

        return (
          <AdminTableCell typography={{ color: 'gray.60' }} cursorPointer>
            {createDt ? dayjs(createDt).format('YYYY-MM-DD') : null}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'actions',
      headerName: '',
      maxWidth: 50,
      align: 'center',
      renderCell: (param) => (
        <AdminTableAction
          actions={[
            {
              label: t('수정'),
              icon: <EditIcon fontSize="small" />,
              onClick: () => {
                navigate(`/admin/boards/faq/edit/${param.row.bulletinNo}`)
              },
            },
            {
              label: t('삭제'),
              icon: <DeleteIcon fontSize="small" />,
              onClick: () => {
                setDeleteFaqBulletinNo(param.row.bulletinNo)
              },
            },
          ]}
        />
      ),
    },
  ]

  useEffect(() => {
    setCustomComponent(<AdminBoardsFaqPageHeader />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return (
    <AdminSkeleton loading={filterOptionsIsLoading} table>
      <AdminSearchFilter onSearch={search} onReset={resetFilter} disabledSearch={isSearchedState} disabledReset={isInitialState}>
        <MIField label={t('카테고리')}>
          <MISelect
            value={filter.category}
            onChange={(e) => {
              updateFilter('category', e.target.value as string)
            }}
            options={filterOptions?.category.map(({ key, value }) => ({ label: value, value: key })) ?? []}
          />
        </MIField>
        <AdminTextField
          label={t('제목 또는 내용')}
          value={filter.keyword}
          onChange={(e) => {
            updateFilter('keyword', e.target.value)
          }}
        />
      </AdminSearchFilter>
      <AdminTable
        getRowId={(row) => row.bulletinNo}
        columns={columns}
        data={data}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        onRowClick={({ row }) => {
          navigate(`/admin/boards/faq/detail/${row.bulletinNo}`)
        }}
        isLoading={isLoading}
      />
      <MIConfirm
        open={deleteFaqBulletinNo !== null}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('게시글을 삭제하시겠습니까?')}
          </>
        }
        width={450}
        handleClose={() => {
          setDeleteFaqBulletinNo(null)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setDeleteFaqBulletinNo(null)
            },
          },
          {
            label: t('삭제'),
            variant: 'filled',
            color: 'red',
            onClick: async () => {
              await handleDeleteFaq()
            },
          },
        ]}
      >
        {t('게시 중인 글이 즉시 삭제됩니다.')}
      </MIConfirm>
    </AdminSkeleton>
  )
}

export default AdminBoardsFaqPage
