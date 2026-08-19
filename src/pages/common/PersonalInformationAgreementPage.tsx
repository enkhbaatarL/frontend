import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import logoImg from '@/assets/logo.svg'
import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MICheckBox from '@/components/common/input/MICheckBox'

interface AgreementTableRowProps {
  header: string
  body: string
  isLast?: boolean
}

const AgreementTableRow = ({ header, body, isLast = false }: AgreementTableRowProps) => (
  <Stack direction="row" height="40px">
    <Typography
      component="div"
      variant="tableHeaderSemibold"
      color="contentText.Normal"
      display="flex"
      alignItems="center"
      flex="0 0 160px"
      height="40px"
      padding="8px 12px"
      boxSizing="border-box"
      borderTop="1px solid"
      borderBottom={isLast ? '1px solid' : undefined}
      borderLeft="1px solid"
      borderColor="contentBorder.Normal"
      bgcolor="gray.10"
      noWrap
    >
      {header}
    </Typography>
    <Typography
      component="div"
      variant="tableBody2"
      color="contentText.Black"
      display="flex"
      alignItems="center"
      flex={1}
      minWidth={0}
      height="40px"
      padding="10px 12px"
      boxSizing="border-box"
      borderTop="1px solid"
      borderRight="1px solid"
      borderBottom={isLast ? '1px solid' : undefined}
      borderLeft="1px solid"
      borderColor="contentBorder.Normal"
      bgcolor="common.white"
      noWrap
    >
      {body}
    </Typography>
  </Stack>
)

const PersonalInformationAgreementPage = () => {
  const [isAgreed, setIsAgreed] = useState(false)

  return (
    <Box width="100%" height="100%" overflow="hidden" bgcolor="gray.5">
      <Stack alignItems="center" gap="40px" height="100%" padding="50px 24px 68px" boxSizing="border-box">
        <Box component="img" src={logoImg} alt="AI Market Intelligence" draggable={false} width="253px" height="38px" />
        <Stack gap="30px" width="634px" minHeight={0} padding="40px" boxSizing="border-box" bgcolor="common.white" flex={1}>
          <Typography component="h1" variant="heading2" color="contentText.Black" lineHeight="29px">
            서비스 이용을 위해
            <br />
            개인정보 동의를 진행해 주세요.
          </Typography>
          <Stack gap="20px" minHeight={0} flex={1}>
            <Box
              minHeight={0}
              overflow="hidden"
              boxSizing="border-box"
              border="1px solid"
              borderColor="contentBorder.Normal"
              borderRadius="6px"
              bgcolor="common.white"
              flex={1}
            >
              <ScrollWrapper height="100%" showScrollbarOnHover thumbWidth={4} thumbInsetTop={8} thumbInsetBottom={8}>
                <Stack gap="30px" padding="30px" boxSizing="border-box">
                  <Typography component="p" variant="body2R14" color="contentText.Normal">
                    SK㈜AX (이하 “회사”)는 그룹 MI플랫폼 서비스(이하 “서비스”) 제공을 위해서 귀하의 동의를 받고자 합니다. 회사는 서비스
                    제공에 필요한 최소한의 개인정보를 수집하고 고객의 개인정보를 적극적으로 보호하며, 수집한 개인정보를 다음의 목적 외 다른
                    용도로 사용하지 않습니다. 내용을 충분히 읽어보신 후 동의 여부를 결정해 주시기 바랍니다.
                  </Typography>
                  <Stack component="section" gap="16px">
                    <Typography component="h2" variant="body1SB16" color="contentText.Black">
                      개인정보의 수집 및 이용 목적
                    </Typography>
                    <Stack width="100%">
                      <AgreementTableRow header="회원 가입 및 관리" body="개인식별 및 권한부여" />
                      <AgreementTableRow header="서비스 제공 및 운영" body="알람, 이메일 서비스 제공" />
                      <AgreementTableRow header="고객 문의 및 불만 처리" body="고객 문의, 서비스 개선" isLast />
                    </Stack>
                  </Stack>
                  <Stack component="section" gap="16px">
                    <Typography component="h2" variant="body1SB16" color="contentText.Black">
                      수집하는 개인정보 항목
                    </Typography>
                    <Stack width="100%">
                      <AgreementTableRow header="필수 항목" body="회사, 이름, 이메일, 부서, 직위명, 직급명" isLast />
                    </Stack>
                  </Stack>
                  <Stack component="section" gap="16px">
                    <Typography component="h2" variant="body1SB16" color="contentText.Black">
                      개인정보의 보유 및 이용 기간
                    </Typography>
                    <Typography
                      component="ul"
                      variant="body1R16"
                      color="contentText.Normal"
                      display="flex"
                      flexDirection="column"
                      sx={{
                        listStyle: 'none',
                        '& li': {
                          position: 'relative',
                          paddingLeft: '24px',
                        },
                        '& li::before': {
                          position: 'absolute',
                          top: '50%',
                          left: '10px',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: 'currentColor',
                          content: '""',
                          transform: 'translateY(-50%)',
                        },
                      }}
                    >
                      <li>회원 탈퇴 시까지</li>
                      <li>법령에 따른 보존 기간 동안</li>
                    </Typography>
                  </Stack>
                  <Stack component="section" gap="16px">
                    <Typography component="h2" variant="body1SB16" color="contentText.Black">
                      동의를 거부 권리 및 불이익
                    </Typography>
                    <Typography component="p" variant="body1R16" color="contentText.Normal">
                      귀하는 개인정보 제공 및 활용에 대한 동의를 거부할 권리가 있습니다. 다만, 동의를 거부할 경우 서비스 이용에 제한이
                      있습니다.
                    </Typography>
                  </Stack>
                  <Stack component="section" gap="16px">
                    <Typography component="h2" variant="body1SB16" color="contentText.Black">
                      개인정보 처리 위탁
                    </Typography>
                    <Typography component="p" variant="body1R16" color="contentText.Normal">
                      시스템을 운영하기 위하여 업체에게 개인정보를 위탁할 수 있습니다.
                    </Typography>
                  </Stack>
                </Stack>
              </ScrollWrapper>
            </Box>
            <Stack gap="30px">
              <Stack
                component="label"
                direction="row"
                alignItems="center"
                alignSelf="flex-start"
                gap="4px"
                sx={{
                  cursor: 'pointer',
                }}
              >
                <MICheckBox
                  checked={isAgreed}
                  onChange={(event) => setIsAgreed(event.target.checked)}
                  sx={{ width: '26px', height: '26px', '& .MuiSvgIcon-root': { fontSize: '26px' } }}
                />
                <Typography component="span" variant="body1R16" color="contentText.Normal" lineHeight="normal">
                  [필수] 개인정보 제공 및 이용에 동의합니다.
                </Typography>
              </Stack>
              <MIBaseButton
                disabled={!isAgreed}
                variant="contained"
                fullWidth
                sx={{ height: '50px', padding: '10px 16px', borderRadius: '4px' }}
              >
                <Typography variant="body1SB16" color={isAgreed ? 'common.white' : 'contentText.Disabled'}>
                  동의하고 계속하기
                </Typography>
              </MIBaseButton>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

export default PersonalInformationAgreementPage
