import { Grid2 as Grid } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { Dispatch, SetStateAction } from 'react'

import AdminField from '@/components/admin/AdminField'
import boardService, { IFaqDetailInfo } from '@/service/admin/board'

interface Props {
  formData: IFaqDetailInfo
  setFormData?: Dispatch<SetStateAction<IFaqDetailInfo>>
  readonly?: boolean
}

const AdminFaqForm = ({ formData, setFormData, readonly }: Props) => {
  const { data } = useQuery({
    queryKey: ['getFaqFilter'],
    queryFn: async () => await boardService.getFaqFilter(),
    refetchOnWindowFocus: false,
  })

  return (
    <Grid sx={{ maxWidth: 700 }} container direction="column" spacing={7.5}>
      <Grid container spacing={7.5}>
        <Grid size={6}>
          <AdminField
            disabled={readonly}
            label={t('카테고리')}
            labelVariant="subtitle"
            labelColor="gray.90"
            required
            fullWidth
            value={formData?.bulletinCategorySeparateCd ?? ''}
            onChange={(value) => {
              setFormData?.((prev) => ({ ...prev, bulletinCategorySeparateCd: value as string }))
            }}
            options={
              data?.category?.map(({ key, value }) => ({
                label: value,
                value: key,
              })) ?? []
            }
            useAllOption={false}
            fieldType="select"
          />
        </Grid>
      </Grid>
      <Grid container spacing={7.5}>
        <Grid size={12}>
          <AdminField
            disabled={readonly}
            label={t('제목(질문)')}
            placeholder={t('FAQ 질문을 입력하세요.')}
            labelVariant="subtitle"
            labelColor="gray.90"
            required
            fullWidth
            countCharacters={!readonly}
            maxLength={200}
            value={formData?.bulletinTitleNm ?? ''}
            onChange={(value) => {
              setFormData?.((prev) => ({ ...prev, bulletinTitleNm: value as string }))
            }}
            fieldType="text"
          />
        </Grid>
      </Grid>
      <Grid container spacing={7.5}>
        <Grid size={12}>
          <AdminField
            disabled={readonly}
            label={t('내용')}
            labelVariant="subtitle"
            placeholder="입력하세요"
            labelColor="gray.90"
            fullWidth
            rows={4}
            required
            multiline
            value={formData?.bulletinCntt ?? ''}
            onChange={(value) => {
              setFormData?.((prev) => ({ ...prev, bulletinCntt: value as string }))
            }}
            fieldType="text"
          />
        </Grid>
      </Grid>
    </Grid>
  )
}

export default AdminFaqForm
