import { Grid2 as Grid, Typography } from '@mui/material'

import style from './PolicyTerm.module.scss'
const TermPage = () => (
  <>
    <Grid direction="column" container paddingX={6} paddingY={5} spacing={10}>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제1조 (목적)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          이 약관은 [회사명] (이하 &quot;회사&quot;라 함)이 제공하는 온라인 서비스(이하 &quot;서비스&quot;라 함)의 이용과 관련하여 회사와
          이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 2 조 (용어의 정의)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; &quot;서비스&quot;란 회사가 제공하는 웹사이트, 모바일 애플리케이션 및 기타 온라인 플랫폼에서 제공하는 모든 콘텐츠와
          기능을 의미합니다. <br />
          &#10113; &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 의미합니다. <br />
          &#10114; &quot;회원&quot;이란 회사가 정한 가입 절차를 완료하고, 아이디(ID) 및 비밀번호를 부여받아 서비스를 이용하는 자를
          의미합니다. <br />
          &#10115; &quot;비회원&quot;이란 회원 가입 없이 서비스를 이용하는 자를 의미합니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 3 조 (약관의 효력 및 변경)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; 본 약관은 이용자가 동의함으로써 효력이 발생합니다. <br />
          &#10113; 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 약관을 개정할 수 있으며, 변경된 약관은 회사의 웹사이트 또는
          서비스 내 공지사항을 통해 사전 공지합니다. <br />
          &#10114; 이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있으며, 변경된 약관의 효력 발생일 이후에도 계속 사용할
          경우 약관 변경에 동의한 것으로 간주됩니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 4 조 (회원 가입 및 관리)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; 이용자는 회사가 정한 절차에 따라 회원 가입을 신청할 수 있으며, 회사는 이를 승낙할 수 있습니다.
          <br />
          &#10113; 회원은 가입 시 제공한 정보가 정확해야 하며, 정보 변경 시 즉시 수정해야 합니다.
          <br />
          &#10114; 회사는 다음 각 호의 경우 회원 가입을 거부하거나 취소할 수 있습니다.
          <ul className={style.listDot}>
            <li>가입 신청자가 이전에 회원 자격이 상실된 적이 있는 경우</li>
            <li>허위 정보를 제공한 경우</li>
            <li>서비스 운영에 지장을 초래할 우려가 있는 경우</li>
          </ul>
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 5 조 (서비스의 제공 및 변경)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; 회사는 이용자에게 다음과 같은 서비스를 제공합니다.
          <br />
          <ul className={style.listDot}>
            <li>[서비스 유형 및 내용 기재]</li>
          </ul>
          &#10113; 회사는 기술적 필요성, 법적 요건 등의 사유로 서비스의 일부 또는 전부를 변경할 수 있으며, 이에 대한 사전 공지를 합니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 6 조 (서비스 이용의 제한 및 정지)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; 회사는 이용자가 다음 각 호에 해당하는 경우 사전 통보 없이 서비스 이용을 제한하거나 중지할 수 있습니다.
          <ul className={style.listDot}>
            <li>본 약관을 위반한 경우</li>
            <li>서비스의 정상적인 운영을 방해한 경우</li>
            <li>법령을 위반하거나 공공질서 및 미풍양속을 해치는 경우</li>
          </ul>
          &#10113; 회사는 이용 제한 또는 정지로 인해 발생하는 문제에 대해 책임을 지지 않습니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 7 조 (이용자의 의무)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; 이용자는 관계 법령, 본 약관 및 회사가 공지한 이용 규칙을 준수해야 합니다.
          <br />
          &#10113; 이용자는 서비스 이용 시 다음과 같은 행위를 금지합니다.
          <ul className={style.listDot}>
            <li>타인의 계정을 부정 사용하는 행위</li>
            <li>허위 정보 등록 및 타인의 명의를 도용하는 행위</li>
            <li>불법적인 콘텐츠를 게시하는 행위</li>
            <li>서비스의 운영을 방해하는 행위</li>
          </ul>
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 8 조 (개인정보 보호)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; 회사는 이용자의 개인정보를 보호하기 위해 관련 법령 및 개인정보처리방침을 준수합니다.
          <br />
          &#10113; 이용자는 개인정보 변경 시 즉시 수정해야 하며, 회사는 이용자의 부주의로 인해 발생한 문제에 대해 책임을 지지 않습니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 9 조 (면책 조항)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; 회사는 천재지변, 서버 장애, 해킹 등의 불가항력적인 사유로 인해 발생한 서비스 중단 및 데이터 손실에 대해 책임을 지지
          않습니다.
          <br />
          &#10113; 회사는 이용자의 귀책사유로 인해 발생한 문제에 대해서도 책임을 지지 않습니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          제 10 조 (분쟁 해결 및 관할 법원)
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          &#10112; 회사와 이용자 간 발생한 분쟁은 상호 협의를 통해 해결하는 것을 원칙으로 합니다.
          <br />
          &#10113; 협의가 이루어지지 않을 경우 대한민국 법률을 따르며, 관할 법원은 회사의 본사 소재지 법원으로 합니다.
        </Typography>
      </Grid>
      <Grid direction="column" container gap={4}>
        <Typography color="gray.90" component="div" variant="body1B16">
          - 부칙-
        </Typography>
        <Typography color="gray.70" component="div" variant="body1R16">
          본 약관은 [yyyy년 mm월 dd일]부터 적용됩니다.
        </Typography>
      </Grid>
    </Grid>
    <Grid height={110}></Grid>
  </>
)

export default TermPage
