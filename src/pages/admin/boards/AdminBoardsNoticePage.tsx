import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ErrorIcon from '@mui/icons-material/Error'
import PushPinIcon from '@mui/icons-material/PushPin'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSkeleton from '@/components/admin/AdminSkeleton.tsx'
import AdminTable, { AdminTableAction, AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField'
import MISelect from '@/components/common/select/MISelect'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import boardService, { INoticeInfo, INoticeRequest } from '@/service/admin/board'
import { IPaginationResponse } from '@/types/api'

const AdminBoardsNoticePageHeader = () => {
  const navigate = useNavigate()
  return (
    <Flex gap={10}>
      <AdminButton variant="contained" color="primary" size="h34" onClick={() => navigate('/admin/boards/notice/registration')}>
        {t('공지사항 등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminBoardsNoticePage = () => {
  const navigate = useNavigate()

  const { showSnackbar } = useSnackbar()
  const { setCustomComponent } = useAdminHeader()

  const [deleteNoticeBulletinNo, setDeleteNoticeBulletinNo] = useState<number | null>(null)

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
  } = useSearchFilter<INoticeRequest, IPaginationResponse<INoticeInfo>>(
    boardService.getNotice,
    {
      category: '',
      status: '',
      target: '',
      keyword: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  const { data: filterOptions, isLoading: filterOptionsIsLoading } = useQuery({
    queryKey: ['getNoticeFilter'],
    queryFn: async () => await boardService.getNoticeFilter(),
    refetchOnWindowFocus: false,
  })

  const handleDeleteNotice = useCallback(async () => {
    if (!deleteNoticeBulletinNo) return

    try {
      const response = await boardService.deleteNotice(deleteNoticeBulletinNo)

      if (response.status) {
        showSnackbar(t('게시글이 삭제되었습니다.'), { variant: 'success' })
        await refetch()
      }
    } catch (error) {
      console.error(error)
      showSnackbar(t('게시글 삭제에 실패했습니다.'), { variant: 'error' })
    }

    setDeleteNoticeBulletinNo(null)
  }, [deleteNoticeBulletinNo, refetch, showSnackbar])

  const columns: GridColDef[] = [
    {
      field: 'isTopFixed',
      headerName: t('고정'),
      maxWidth: 60,
      align: 'center',
      renderCell: (param) => (param.value ? <PushPinIcon fontSize="small" sx={{ color: 'gray.60' }} /> : null),
    },
    {
      field: 'isPopupUse',
      headerName: t('팝업 사용'),
      maxWidth: 90,
      align: 'center',
      renderCell: (param) => (param.value ? <CheckIcon fontSize="small" color="success" /> : null),
    },
    {
      field: 'bulletinCategorySeparateCode',
      headerName: t('카테고리'),
      width: 120,
      align: 'left',
      renderCell(param) {
        return <AdminTableCell>{filterOptions?.category.find((item) => item.key === param.value)?.value ?? param.value}</AdminTableCell>
      },
    },
    {
      field: 'bulletinTitleName',
      headerName: t('제목'),
      minWidth: 120,
      flex: 1,
    },
    {
      field: 'auditInfo.createUserNm',
      headerName: t('등록자'),
      width: 120,
      renderCell(param) {
        return <AdminTableCell>{param.row.auditInfo?.createUserNm}</AdminTableCell>
      },
    },
    {
      field: 'auditInfo.createDt',
      headerName: t('등록일'),
      width: 120,
      align: 'center',
      renderCell(param) {
        return <AdminTableCell typography={{ color: 'gray.60' }}>{param.row.auditInfo?.createDt}</AdminTableCell>
      },
    },
    {
      field: 'status',
      headerName: t('게시 여부'),
      width: 120,
      align: 'center',
      renderCell(param) {
        return (
          <AdminTableCell type="chip" chip={{ color: 'ACTIVE' === param.value ? 'blue' : 'gray' }}>
            {param.value === 'ACTIVE' ? t('게시  중') : t('게시 안함')}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'target',
      headerName: t('게시 대상'),
      minWidth: 120,
      flex: 1,
      renderCell(param) {
        const formattedValue = Array.isArray(param.value) ? param.value.join(', ') : param.value

        return <AdminTableCell ellipsis>{formattedValue}</AdminTableCell>
      },
    },
    {
      field: 'actions',
      headerName: t(''),
      maxWidth: 50,
      align: 'center',
      renderCell: (param) => (
        <AdminTableAction
          actions={[
            {
              label: '수정',
              icon: <EditIcon fontSize="small" />,
              onClick: () => navigate(`/admin/boards/notice/edit/${param.row.bulletinNo}`),
            },
            {
              label: '삭제',
              icon: <DeleteIcon fontSize="small" />,
              onClick: () => setDeleteNoticeBulletinNo(param.row.bulletinNo),
            },
          ]}
        />
      ),
    },
  ]

  useEffect(() => {
    setCustomComponent(<AdminBoardsNoticePageHeader />)

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
        <MIField label={t('게시 여부')}>
          <MISelect
            value={filter.status}
            onChange={(e) => {
              updateFilter('status', e.target.value as string)
            }}
            options={filterOptions?.status.map(({ key, value }) => ({ label: value, value: key })) ?? []}
          />
        </MIField>
        <MIField label={t('게시 대상')}>
          <MISelect
            value={filter.target}
            onChange={(e) => {
              updateFilter('target', e.target.value as string)
            }}
            options={filterOptions?.target.map(({ key, value }) => ({ label: value, value: key })) ?? []}
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
        isLoading={isLoading}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        onRowClick={({ row }) => {
          navigate(`/admin/boards/notice/detail/${row.bulletinNo}`)
        }}
      />
      <MIConfirm
        open={deleteNoticeBulletinNo !== null}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('게시글을 삭제하시겠습니까?')}
          </>
        }
        width={450}
        handleClose={() => {
          setDeleteNoticeBulletinNo(null)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setDeleteNoticeBulletinNo(null)
            },
          },
          {
            label: t('삭제'),
            variant: 'filled',
            color: 'red',
            onClick: async () => {
              await handleDeleteNotice()
            },
          },
        ]}
      >
        {t('게시 중인 글이 즉시 삭제됩니다.')}
      </MIConfirm>
    </AdminSkeleton>
  )
}

export default AdminBoardsNoticePage
