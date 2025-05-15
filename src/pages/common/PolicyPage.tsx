import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useState } from 'react'

import MISelect from '@/components/common/select/MISelect'

import './Policy.scss'

const tableCell = {
  padding: '10px 12px',
  textAlign: 'left' as const,
  color: '#212529',
  fontSize: 14,
  fontWeight: 400,
}

const tableHeader = {
  padding: '8px 12px',
  textAlign: 'left' as const,
  fontSize: 13,
  fontWeight: 600,
  color: '#868E96',
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#212529' }}>{title}</h3>
    <div style={{ fontSize: 16, fontWeight: 400, margin: 0, color: '#495057' }}>{children}</div>
  </div>
)

const PolicyPage = () => {
  const [selectDate, setSelectDate] = useState<string>('20250000')

  return (
    <>
      {' '}
      <Grid justifyContent="space-between" container pt={10} px={7.5}>
        <Typography color="gray.90" component="div" variant="heading2">
          개인정보 처리방침
        </Typography>
        <MISelect value={selectDate} onChange={(e) => setSelectDate(String(e.target.value))}></MISelect>
      </Grid>
      <Box className="contentHtml" padding={7.5} component="div">
        <div style={{ display: 'flex', flexFlow: 'column', gap: '40px' }}>
          <p style={{ fontSize: 16, fontWeight: 400, margin: 0, color: '#495057' }}>
            SK주식회사(이하 ‘회사’라 한다)는 회사가 제공하는 AI MI플랫폼서비스(이하”서비스”)에 대하여 개인정보 보호법 제30조에 따라 회원의
            개인정보를 보호하고 이와 관련한 문의를 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리지방침을
            수립․공개합니다.
          </p>

          <Section title="제 1 조 (개인정보의 처리목적)">
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용
            목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            <br />
            1. AI MI플랫폼 회원 가입 및 관리
            <ul style={{ marginLeft: 3 }}>
              <li>
                회원 가입의사 확인, 서비스 제공에 따른 본인 식별․인증, 회원자격 유지․관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스
                부정이용 방지, 만 14세 미만 아동의 개인정보 처리시 법정대리인의 동의여부 확인을 목적으로 개인정보를 처리합니다.
              </li>
            </ul>
            2. 서비스 제공 및 운영
            <ul style={{ marginLeft: 3 }}>
              <li>
                회원 가입의사 확인, 서비스 제공에 따른 본인 식별․인증, 회원자격 유지․관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스
                부정이용 방지, 만 14세 미만 아동의 개인정보 처리시 법정대리인의 동의여부 확인을 목적으로 개인정보를 처리합니다.
              </li>
            </ul>
            3. 고객 문의 및 불만 처리
            <ul style={{ marginLeft: 3 }}>
              <li>
                회원 가입의사 확인, 서비스 제공에 따른 본인 식별․인증, 회원자격 유지․관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스
                부정이용 방지, 만 14세 미만 아동의 개인정보 처리시 법정대리인의 동의여부 확인을 목적으로 개인정보를 처리합니다.
              </li>
            </ul>
          </Section>

          <Section title="제 2 조 (처리하는 개인정보 항목)">
            회사는 다음의 개인정보 항목을 처리하고 있습니다.
            <br />
            1. AI MI플랫폼 회원 가입 및 관리: (필수) 사번, 회사, 이름, 이메일, 부서, 직위, 직급
            <br />
            2. 서비스 제공 및 운영 : (필수) 사번, 회사, 이름, 이메일
            <br />
            3. 고객 문의 및 불만 처리 : (필수) 사번, 회사, 이름, 이메일
            <br />
            4. 서비스 이용과정에서 다음 항목이 자동으로 생성되어 수집될 수 있습니다. 서비스 이용기록, 방문기록 등
          </Section>

          <Section title="제 3 조 (개인정보의 처리 및 보유기간)">
            ① 회사는 법령에 따른 개인정보 보유․이용기간 또는 회원으로부터 개인정보를 수집시에 동의받은 개인정보 보유․이용기간 내에서
            개인정보를 처리․보유합니다. <br />
            ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다. <br />
            &nbsp;1. AI MI플랫폼 회원 가입 및 관리 : AI MI플랫폼 탈퇴시까지 / 다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료시까지
            <ul style={{ marginLeft: 30 }}>
              <li>관계 법령 위반에 따른 수사․조사 등이 진행중인 경우에는 해당 수사․조사 종료시까지</li>
              <li>AI MI플랫폼 이용에 따른 채권․채무관계 잔존시에는 해당 채권․채무관계 정산시까지</li>
            </ul>
            &nbsp;2. 서비스 제공 및 운영 : AI MI플랫폼 탈퇴시까지 <br />
            &nbsp;3. 고객 문의 및 불만 처리 : AI MI플랫폼 탈퇴시까지 <br />
            ③ 제2항에도 불구하고 회사는 상법, 전자상거래 등에서의 소비자 보호에 관한 법률 등 관련 법령의 규정에 의하여 일정기간 정보를
            보유할 필요가 있는 경우 또는 회원의 부정한 이용 등을 방지하기 위하여 일정기간 회원의 개인정보를 보유할 수 있으며, 보유 기간은
            아래와 같습니다.
            <br />
            &nbsp;1. 로그기록 등 방문에 관한 기록 보유 : 3개월(통신비밀보호법) <br />
            &nbsp;2. 통신사실확인자료 : 12개월(통신비밀보호법)
          </Section>

          <Section title="제 4 조 (개인정보의 제3자 제공)">
            ① 회사는 회원의 개인정보를 개인정보의 처리 목적에서 명시한 범위 내에서만 처리하며, 회원의 동의, 법률의 특별한 규정 등
            개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공하고 그 이외에는 회원의 개인정보를 제3자에게
            제공하지 않습니다.
            <br />② 회사는 AI MI플랫폼 공동운영을 위하여 회원의 동의를 얻은 후에 아래와 같이 개인정보를 제공하고 있습니다.
            <table style={{ maxWidth: 700, width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #CED4DA' }}>
                  <th style={tableHeader}>제공받는 자</th>
                  <th style={tableHeader}>제공 목적</th>
                  <th style={tableHeader}>제공 항목</th>
                  <th style={tableHeader}>보유 • 이용기간</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #DEE2E6' }}>
                  <td style={tableCell}>SK텔레콤㈜</td>
                  <td style={tableCell}>AI MI플랫폼 공동운영(예시)</td>
                  <td style={tableCell}>사번, 회사, 이름, 이메일, 부서, 직위, 직급</td>
                  <td style={tableCell}>회원 탈퇴 시까지</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section title="제 5 조 (개인정보처리의 위탁)">
            ① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁할 수 있습니다. <br />
            &nbsp;1. 시스템 운영
            <ul style={{ marginLeft: 30 }}>
              <li>위탁받는 자 (수탁자) : TBD</li>
              <li>위탁하는 업무의 내용 : 시스템 운영, 문의 응대, 소속 및 직원 안내</li>
            </ul>
            ② 회사는 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적․관리적 보호조치, 재위탁
            제한, 수탁자에 대한 관리․감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게
            처리하는지를 감독하고 있습니다.
            <br />③ 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.
          </Section>
        </div>
      </Box>
    </>
  )
}

export default PolicyPage
