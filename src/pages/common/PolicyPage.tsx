import { Grid2 as Grid, Typography } from '@mui/material'
import clsx from 'clsx'

import style from './PolicyTerm.module.scss'
const PolicyPage = () => (
  <>
    <Grid direction="column" container paddingX={6} paddingY={5} spacing={10}>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제1조 (목적)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          이 개인정보처리방침은 [회사명](이하 &quot;회사&quot;라 함)이 제공하는 [서비스명](이하 &quot;서비스&quot;라 함) 이용과 관련하여,
          회사가 수집하는 개인정보의 처리방침을 규정함을 목적으로 합니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 2 조 (수집하는 개인정보 항목 및 수집 방법)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; 수집하는 개인정보 항목 <br />
          회사는 다음과 같은 개인정보를 수집할 수 있습니다. <br />
          &nbsp; 1. &nbsp;회원 가입 및 서비스 이용 시 수집 정보 <br />
          <ul className={clsx(style.listDot, style.paddingleft12)}>
            <li>필수: 성명, 이메일, 휴대폰번호, 아이디(ID), 비밀번호</li>
            <li>선택: 생년월일, 주소</li>
          </ul>
          &nbsp; 2. 결제 및 환불 시 수집 정보 <br />
          <ul className={clsx(style.listDot, style.paddingleft12)}>
            <li>신용카드 정보, 은행 계좌 정보, 결제 기록</li>
          </ul>
          &nbsp; 3. 서비스 이용 과정에서 자동으로 생성 및 수집되는 정보
          <ul className={clsx(style.listDot, style.paddingleft12)}>
            <li>IP 주소, 쿠키, 방문 기록, 기기정보(운영체제, 브라우저 종류)</li>
          </ul>
          &#10113; 개인정보 수집 방법 <br />
          회사는 다음과 같은 방법으로 개인정보를 수집합니다. <br />
          <ul className={clsx(style.listDot, style.paddingleft12)}>
            <li>회원가입, 서비스 이용 신청 시 사용자가 직접 입력</li>
            <li>고객센터 상담 및 이벤트 참여 과정에서 수집</li>
            <li>서비스 이용 과정에서 자동 수집 (예: 쿠키, 로그 데이터)</li>
          </ul>
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 3 조 (개인정보의 수집 및 이용 목적)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          회사는 수집한 개인정보를 다음의 목적으로 이용합니다. <br />
          &#10112; 서비스 제공 및 운영: 회원가입, 로그인, 본인 확인, 서비스 이용 지원 <br />
          &#10113; 고객 지원 및 상담: 문의사항 대응, 서비스 관련 공지 <br />
          &#10114; 결제 및 환불 처리: 유료 서비스 결제, 환불 처리 <br />
          &#10115; 마케팅 및 광고 활용 (선택 동의 시): 이벤트, 프로모션, 맞춤형 광고 제공 <br />
          &#10116; 법적 의무 이행: 법령 준수, 법적 분쟁 대응
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 4 조 (개인정보 보유 및 이용 기간)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          회사는 원칙적으로 개인정보의 수집 및 이용 목적이 달성된 후 해당 정보를 즉시 파기합니다. 단, 다음과 같은 경우 관련 법령에 따라 일정
          기간 보관할 수 있습니다. <br />
          &#10112; 법령에 따른 보관
          <ul className={clsx(style.listDot, style.paddingleft12)}>
            <li>계약 또는 청약 철회 등에 관한 기록: 5년 (전자상거래법)</li>
            <li>대금 결제 및 재화 공급 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만 및 분쟁 처리 기록: 3년 (전자상거래법)</li>
            <li>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
          </ul>
          &#10113; 회원탈퇴 시 보관
          <ul className={clsx(style.listDot, style.paddingleft12)}>
            <li>부정 이용 방지를 위해 회원탈퇴 후 1년간 최소 정보 보관 가능</li>
          </ul>
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 5 조 (개인정보의 제3자 제공)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          회사는 원칙적으로 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우 예외로 합니다. <br />
          &#10112; 이용자가 사전 동의한 경우 <br />
          &#10113; 법령에 의거하여 제공이 요구되는 경우 <br />
          &#10114; 서비스 제공을 위해 필요한 범위 내에서 제휴사에 제공하는 경우 (별도 동의 후 진행)
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 6 조 (개인정보 처리 위탁)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁할 수 있습니다. <br />
          수탁업체위탁업무 내용보유 및 이용 기간[PG사]결제 처리서비스 제공 기간[고객센터 운영사]고객 상담 지원서비스 제공 기간[마케팅
          대행사]이메일 및 SMS 발송동의 철회 시까지 <br />※ 위탁 계약 시 개인정보 보호법에 따라 안전하게 관리되도록 필요한 조치를 합니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 7 조 (이용자의 권리 및 행사 방법)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          이용자는 다음과 같은 권리를 행사할 수 있습니다. <br />
          &#10112; 개인정보 열람, 수정, 삭제 요청 <br />
          &#10113; 회원 탈퇴 및 개인정보 처리 중단 요청 <br />
          &#10114; 수집, 이용 동의 철회 <br />
          이용자는 &quot;설정&quot; 메뉴 또는 고객센터를 통해 위 권리를 행사할 수 있습니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 8 조 (개인정보 보호를 위한 기술적·관리적 조치)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          회사는 개인정보 보호를 위해 다음과 같은 조치를 적용합니다. <br />
          &#10112; 기술적 보호 대책
          <ul className={style.listDot}>
            <li>개인정보 암호화 (비밀번호, 결제 정보 등)</li>
            <li>방화벽 및 침입 탐지 시스템 운영</li>
            <li>접근 제어 시스템 적용</li>
          </ul>
          &#10113; 관리적 보호 대책 <br />
          <ul className={style.listDot}>
            <li>개인정보 취급자 최소화 및 정기 교육</li>
            <li>내부 보안 정책 수립 및 운영</li>
          </ul>
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 9 조 (개인정보 자동 수집 장치의 설치·운영 및 거부 방법)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          회사는 쿠키(cookie)를 이용하여 이용자의 환경을 최적화할 수 있습니다. <br />
          &#10112; 쿠키의 사용 목적
          <ul className={style.listDot}>
            <li>로그인 유지, 맞춤형 서비스 제공</li>
          </ul>
          &#10113; 쿠키 설정 거부 방법
          <ul className={style.listDot}>
            <li>웹브라우저 설정에서 쿠키 저장 거부 가능</li>
          </ul>
          (설정 방법: 브라우저별 옵션 참고)
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 10 조 (개인정보 보호책임자 및 문의처)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          회사는 이용자의 개인정보를 보호하고 관련 불만을 처리하기 위해 개인정보 보호책임자를 지정하고 있습니다.
          <ul className={style.listDot}>
            <li>개인정보 보호책임자: [이름]</li>
            <li>연락처: [이메일, 전화번호]</li>
            <li>주소: [회사 주소]</li>
          </ul>
          ※ 개인정보 침해 신고 및 상담:
          <ul className={style.listDot}>
            <li>한국인터넷진흥원 개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
            <li>경찰청 사이버수사국 (cyberbureau.police.go.kr)</li>
          </ul>
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 11 조 (개인정보처리방침의 변경 및 고지)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          회사는 본 방침을 변경할 수 있으며, 변경 시 최소 7일 전에 공지합니다.
          <ul className={style.listDot}>
            <li>최초 시행일: [YYYY-MM-DD]</li>
            <li>최신 개정일: [YYYY-MM-DD]</li>
          </ul>
        </Typography>
      </Grid>
    </Grid>
    <Grid height={49}></Grid>
  </>
)

export default PolicyPage
