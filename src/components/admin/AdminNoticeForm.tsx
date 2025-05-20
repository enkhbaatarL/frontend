import CancelIcon from '@mui/icons-material/Cancel'
import { Chip, Box, Grid2 as Grid, Typography } from '@mui/material'
import Switch from '@mui/material/Switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { t } from 'i18next'
import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import AdminItemUpload from './AdminItemUpload/AdminItemUpload'

import AdminChip from '@/components/admin/AdminChip'
import AdminField, { AdminDateRangeType } from '@/components/admin/AdminField'
import Flex from '@/components/common/display/Flex'
import useSnackbar from '@/hooks/useSnackbar'
import boardService, { INoticeDetailInfo } from '@/service/admin/board'
import companiesService from '@/service/admin/companies'

interface Props {
  formData: INoticeDetailInfo
  setFormData?: Dispatch<SetStateAction<INoticeDetailInfo>>
  readonly?: boolean
}

const AdminNoticeForm = ({ formData, setFormData, readonly }: Props) => {
  const { showSnackbar } = useSnackbar()
  const { data: options } = useQuery({
    queryKey: ['getNoticeFilter'],
    queryFn: async () => await boardService.getNoticeFilter(),
    refetchOnWindowFocus: false,
  })

  const { data: companiesOptions } = useQuery({
    queryKey: ['getDepartmentAll'],
    queryFn: async () => await companiesService.getDepartmentAll(),
    refetchOnWindowFocus: false,
    enabled: !formData.isWholePost,
  })

  const handleOnTargetDelete = (customerCompanyNo: number) => {
    setFormData?.((prev) => {
      const targetList = prev.targetList.filter((target) => target.customerCompanyNo !== customerCompanyNo)
      return {
        ...formData,
        targetList,
      }
    })
  }

  const targetChip = (item: { customerCompanyNo: number; customerCompanyNm: string }) => (
    <Chip
      size="small"
      sx={{
        height: '28px',
        color: 'gray.70',
        fontSize: '14px',
        fontWeight: 400,
        backgroundColor: '#fff',
        borderColor: 'gray.30',
        padding: '0 5px',
      }}
      variant="outlined"
      key={item.customerCompanyNo}
      label={item.customerCompanyNm}
      {...(!readonly && {
        deleteIcon: <CancelIcon style={{ marginLeft: '3px', color: '#CED4DA' }} />,
        onDelete: () => {
          handleOnTargetDelete(item.customerCompanyNo)
        },
      })}
    />
  )

  /**
   * POST 공지사항 이미지 파일 업로드
   */
  const { mutate: uploadNoticeFile } = useMutation({
    mutationFn: ({ file }: { file: File }) => {
      const formFileData = new FormData()
      formFileData.append('file', file)
      return boardService.uploadNoticeFile(formFileData)
    },
    onSuccess: (data) => {
      setFormData?.((prev) => ({
        ...prev,
        fileList: [data],
      }))
    },
    onError: () => showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' }),
  })

  const handleFileChange = (files: File[]) => {
    if (!files?.[0]) return
    uploadNoticeFile({ file: files[0] })
  }

  const handleRemoveFile = () => {
    setFormData?.((prev) => ({
      ...prev,
      fileList: [],
    }))
  }

  return (
    <Grid sx={{ maxWidth: 700 }} container direction="column" spacing={7.5}>
      <Flex justify="space-between" gap={30}>
        <Box>
          <Typography variant="subtitle" component="div" color="gray.90" marginBottom={1}>
            {t('고정 여부')}
          </Typography>
          <Typography variant="subtext2" component="div" color="gray.60" marginBottom={3}>
            {t('활성화 시 공지사항 목록 상단에 고정됩니다. (개수 제한 없음)')}
          </Typography>
          {readonly ? (
            <AdminChip size="h24" label={formData.isTopFixed ? '사용' : '미사용'} color={formData.isTopFixed ? 'green' : 'gray'} />
          ) : (
            <Switch
              checked={formData.isTopFixed}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setFormData?.((prev) => ({
                  ...prev,
                  isTopFixed: event.target.checked,
                }))
              }}
            />
          )}
        </Box>
        <Box>
          <Typography variant="subtitle" component="div" color="gray.90" marginBottom={1}>
            {t('팝업 사용 여부')}
          </Typography>
          <Typography variant="subtext2" component="div" color="gray.60" marginBottom={3}>
            {t('활성화 시 홈 화면에 레이어 팝업으로 노출됩니다. (1개만 사용 가능)')}
          </Typography>
          {readonly ? (
            <AdminChip size="h24" label={formData.isPopupUse ? '사용' : '미사용'} color={formData.isPopupUse ? 'green' : 'gray'} />
          ) : (
            <Switch
              checked={formData.isPopupUse}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setFormData?.((prev) => ({
                  ...prev,
                  isPopupUse: event.target.checked,
                }))
              }}
            />
          )}
        </Box>
      </Flex>
      {formData.isPopupUse && (
        <Grid container spacing={7.5}>
          <Grid size={12}>
            <AdminField
              disabled={readonly}
              label={t('팝업 게시일자')}
              labelSub={t('팝업 게시 시작일 및 종료일을 선택하세요. 시작일을 오늘 이후로 설정 시 해당일에 예약 게시됩니다.')}
              labelVariant="subtitle"
              labelColor="gray.90"
              fullWidth
              value={[formData.popupPostBeginDt, formData.popupPostEndDt]}
              onChange={(value) => {
                if (Array.isArray(value) && value.length === 2 && setFormData) {
                  const [startDate, endDate] = value
                  if (dayjs.isDayjs(startDate) && dayjs.isDayjs(endDate)) {
                    setFormData((prev) => ({
                      ...prev,
                      popupPostBeginDt: startDate.isValid() ? startDate.format('YYYYMMDD') : '',
                      popupPostEndDt: endDate.isValid() ? endDate.format('YYYYMMDD') : '',
                    }))
                  }
                }
              }}
              fieldType="date-range"
            />
          </Grid>
        </Grid>
      )}
      <Grid container spacing={7.5}>
        <Grid size={6}>
          <AdminField
            label={t('카테고리')}
            labelVariant="subtitle"
            labelColor="gray.90"
            required
            disabled={readonly}
            fullWidth
            value={formData.bulletinCategorySeparateCd}
            onChange={(value) => {
              setFormData?.({ ...formData, bulletinCategorySeparateCd: value as string })
            }}
            options={(options?.category ?? []).map((item) => ({
              value: item.key,
              label: item.value,
            }))}
            fieldType="select"
          />
        </Grid>
      </Grid>
      <Grid container spacing={7.5}>
        <Grid size={12}>
          <AdminField
            disabled={readonly}
            label={t('제목')}
            labelVariant="subtitle"
            labelColor="gray.90"
            required
            fullWidth
            maxLength={50}
            value={formData.bulletinTitleNm}
            onChange={(value) => {
              setFormData?.({ ...formData, bulletinTitleNm: value as string })
            }}
            fieldType="text"
          />
        </Grid>
      </Grid>
      <Grid container spacing={7.5}>
        <Grid size={12}>
          <AdminField
            disabled={readonly}
            label={t('게시일자')}
            labelSub={t('게시 시작일 및 종료일을 선택하세요. 시작일을 오늘 이후로 설정 시 해당일에 예약 게시됩니다.')}
            labelVariant="subtitle"
            labelColor="gray.90"
            required
            fullWidth
            value={[formData.bulletinValidBeginDt, formData.bulletinValidEndDt]}
            onChange={({ startDate, endDate }: AdminDateRangeType) => {
              setFormData?.((prev) => ({
                ...prev,
                bulletinValidBeginDt: startDate ? startDate.format('YYYYMMDD') : '',
                bulletinValidEndDt: endDate ? endDate.format('YYYYMMDD') : '',
              }))
            }}
            fieldType="date-range"
          />
        </Grid>
      </Grid>
      <Grid container spacing={7.5}>
        <Grid size={12}>
          <AdminField
            disabled={readonly}
            label={t('게시대상')}
            labelSub={t('고객사별 별도 공지가 필요한 경우 "개별" 옵션에서 고객사를 선택하시면 해당 고객사의 회원에게만 보여집니다.')}
            labelVariant="subtitle"
            labelColor="gray.90"
            fullWidth
            value={String(formData.isWholePost)}
            onChange={(value) => {
              setFormData?.((prev) => ({ ...prev, isWholePost: value === 'true' }))
            }}
            options={[
              { value: 'true', label: t('전체') },
              { value: 'false', label: t('개별') },
            ]}
            fieldType="radio"
          />
        </Grid>
      </Grid>
      {!formData.isWholePost && (
        <Grid container spacing={4}>
          {!readonly && (
            <Grid size={12}>
              <AdminField
                disabled={readonly}
                label={t('고객사 선택')}
                labelSub={t('해당 게시글을 조회 가능한 고객사를 선택해 주세요. 고객사 선택 시 하단에 추가됩니다.')}
                labelVariant="subtitle"
                labelColor="gray.90"
                required
                fullWidth
                width={335}
                multiple
                placeholder="선택하세요"
                value={formData.targetList.map((item) => String(item.customerCompanyNo))}
                onChange={(value) => {
                  const targetList =
                    companiesOptions
                      ?.filter((item) => (value as string[]).includes(String(item.companyNo)))
                      .map((item) => ({
                        customerCompanyNo: item.companyNo,
                        customerCompanyNm: item.companyNm,
                      })) ?? []

                  setFormData?.((prev) => ({
                    ...prev,
                    targetList,
                  }))
                }}
                options={companiesOptions?.map((item) => ({
                  value: String(item.companyNo),
                  label: item.companyNm,
                }))}
                fieldType="select"
                useAllOption={false}
                showSelectedValue={false}
              />
            </Grid>
          )}

          <Grid
            style={{ marginTop: readonly ? -18 : 0 }}
            minHeight={92}
            size={12}
            wrap="wrap"
            borderRadius={2}
            bgcolor="gray.5"
            gap={2}
            padding={3.5}
            container
          >
            {formData.targetList.map((item) => targetChip(item))}
          </Grid>
        </Grid>
      )}

      <Grid container spacing={7.5}>
        <Grid size={12}>
          <AdminField
            disabled={readonly}
            label={t('내용')}
            labelVariant="subtitle"
            placeholder={t('내용을 입력하세요')}
            labelColor="gray.90"
            fullWidth
            rows={4}
            required
            multiline
            fieldType="text"
            value={formData.bulletinCntt}
            onChange={(value) => {
              setFormData?.({ ...formData, bulletinCntt: value as string })
            }}
          />
        </Grid>
      </Grid>
      {(formData.fileList.length !== 0 || !readonly) && (
        <Grid container spacing={7.5}>
          <Grid size={12}>
            <AdminField
              disabled={readonly}
              label={t('이미지')}
              labelSub={t('jpg, png만 등록 가능합니다. (최대 용량 20MB. 이미지 사이즈 760*400px 권장)')}
              labelVariant="subtitle"
              labelColor="gray.90"
              fullWidth
              onChange={(files) => handleFileChange(files as File[])}
              fieldType="upload"
            />
            <>
              {formData.fileList.length !== 0 && (
                <div className="upload-field-file-list">
                  {formData.fileList.map((fileItem, index) => (
                    <AdminItemUpload
                      checkFile="pass"
                      key={index}
                      fileItem={{ ...fileItem, type: 'image/*' }}
                      nameStatus={'완료'}
                      onDelete={handleRemoveFile}
                    />
                  ))}
                </div>
              )}
            </>
          </Grid>
        </Grid>
      )}
    </Grid>
  )
}

export default AdminNoticeForm
