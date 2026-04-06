# mi-platform-frontend

[English](../../README.md) | [한국어](README.md)

## 📝 프로젝트 개요

`mi-platform-frontend` 프로젝트는 React + Chart.js를 기반으로 한 웹 애플리케이션입니다. MI (Market Intelligence) 플랫폼은 정보를 수집, 분석, 시각화하여 기업이 전략적 결정을 내릴 수 있도록 돕습니다.

## 🔧 설치 및 실행

```sh
git clone https://github.com/sk-mi-platform/frontend.git
cd mi-platform-frontend
npm install

# 개발 브랜치 사용
git checkout dev
# 또는
# 퍼블리싱 브랜치
git checkout dev-style

# 로컬 실행
npm run dev
# 또는
# VDI에서 개발 API 서버로 연결 및 실행
npm run dev-vdi
```

## 🛠️ IDE 정보

- **IntelliJ IDEA 2024.3.4.1 (Ultimate Edition)**
- **Visual Studio Code Version: 1.98.1 (Universal)**

## ✨ ESLint 설정

IDE에 ESLint를 설정해야 합니다. 자세한 지침은 [IDE_SETTING.md](../ko/IDE_SETTING.md)를 참조하세요.

> ⚠️ 코드 품질과 일관성을 보장하기 위해 IDE에 ESLint 구성을 설정해주세요. 코드 포맷팅을 위해 Prettier도 설정합니다.

## 📦 기술 스택

- **Node 22.14**: 최신 LTS 버전
- **React 19**: 최신 버전
- **TypeScript**: 타입 검사
- **Vite 6.2**: 빌드 도구 및 개발 서버
- **MUI 6.4**: UI 프레임워크
- **Zustand / React Query**: 상태 관리
- **Axios**: API 요청
- **i18next**: 다국어 지원 (향후 지원 예정)
- **Chart.js (4.4.8) & react-chartjs-2**: 차트
- **ESLint & Prettier**: 코드 스타일
- **Husky & lint-staged**: Git Hooks
- **vite-plugin-federation**: 런타임 Remote 마이크로 프론트엔드

> ⚠️ 다국어 지원은 일부 `t('string')` 형식으로 코드 작성 되어 있으나, 현재 바이패스로 출력하고 있습니다. 
> (차후 맵핑이 필요합니다)

## 🔌 모듈 페더레이션

이 저장소는 **Host** 앱이며, [Vite Module Federation](https://github.com/originjs/vite-plugin-federation)으로 **Remote** 앱의 UI를 런타임 시점에 불러옵니다.

### 설정 (`vite.config.ts`)

| 항목 | 값 |
|------|-----|
| Host 이름 | `hostApp` |
| Remote 이름 | `positionPlayRemote` |
| Remote 엔트리 URL | `{remoteUrl}/assets/remoteEntry.js` |
| `remoteUrl` | 환경 변수 `VITE_POSITION_PLAY_REMOTE_URL`, 미설정 시 `http://localhost:5174` |

**공유 의존성**(`singleton`, Host와 맞춘 버전): `react`, `react-dom`, `react-router-dom`. Host·Remote가 호환되는 메이저 버전을 사용하여야 런타임에 단일 인스턴스로 공유됩니다.

페더레이션 빌드를 위해 Vite에서 `modulePreload: false`, `target: 'esnext'`를 사용합니다.

### 앱 내 라우트

- **`/mi/position-play`** — MI 레이아웃(`PositionPlayRemotePage`) 안에서 Remote 모듈 `positionPlayRemote/PositionPlayPage`를 `lazy`로 로드하는 셸 페이지입니다.

### TypeScript

`src/types/federation.d.ts`에 Remote 모듈 경로를 선언해 `import('positionPlayRemote/PositionPlayPage')`가 타입 체크되도록 합니다.

### 로컬 개발

1. **Remote** 앱을 먼저 띄워 `remoteEntry.js`가 서빙되게 합니다(기본 가정: 개발 서버 포트 **5174**).
2. 이 **Host**를 실행합니다(`npm run dev`).
3. `/mi/position-play`로 접속합니다. Remote가 꺼져 있거나 URL이 잘못되면 페더레이션 청크 로드에 실패합니다.

Remote의 오리진만 바꿀 때는 `VITE_POSITION_PLAY_REMOTE_URL`을 사용합니다(끝에 경로 없이 scheme·호스트·포트만; Host가 `/assets/remoteEntry.js`를 붙입니다).

## 🛣️ 라우팅 구조

애플리케이션은 React Router v7을 사용하여 계층적 라우팅 구조를 가집니다:

### 메인 라우트
- `/` - 로그인 페이지
- `/callback` - OAuth 콜백 처리
- `/saml2/authenticate` - SAML 인증 콜백
- `/pdf-viewer/:fileId` - PDF 뷰어
- `/healthcheck` - 헬스 체크 엔드포인트

### MI 플랫폼 (`/mi`)
- `/mi` - 회사별 홈페이지로 리다이렉트
- `/mi/dashboard` - 메인 대시보드
- `/mi/signal-map` - 시그널 맵 시각화
- `/mi/position-play` - 포지션 플레이(모듈 페더레이션 Remote)
- `/mi/market-data` - 시장 데이터 분석
- `/mi/insights` - 시장 인사이트
- `/mi/data-detail/:goodsNo/:goodsDataNo` - 상세 데이터 보기
- `/mi/notices` - 공지사항
  - `/mi/notices/:noticeNo` - 공지사항 상세
- `/mi/help-center` - 도움말 센터 (FAQ)
- `/mi/privacy-policy` - 개인정보처리방침
- `/mi/notifications` - 사용자 알림

### 관리자 (`/admin`)
- `/admin` - 고객사 관리로 리다이렉트
- `/admin/customer-company` - 고객사 관리
  - `/admin/customer-company/companies` - 고객사 목록
  - `/admin/customer-company/owner-companies` - 관리사 목록
- `/admin/member-mgmt` - 사용자 관리
  - `/admin/member-mgmt/users` - 서비스 회원
  - `/admin/member-mgmt/managers` - 어드민 관리자
- `/admin/data-providers` - 데이터 프로바이더 관리
  - `/admin/data-providers/providers` - 프로바이더 목록
- `/admin/notification` - 알람 관리
  - `/admin/notification/list` - 알람 발송 목록
- `/admin/boards` - 게시판 관리
  - `/admin/boards/notice` - 공지사항 관리
  - `/admin/boards/faq` - FAQ 관리
- `/admin/system` - 시스템 관리
  - `/admin/system/api` - API 관리

### 오류 (`/error`)
- `/error/404` - 페이지를 찾을 수 없음
- `/error/auth` - 인증 오류
- `/error/unknown` - 알 수 없는 오류
- `/error/access-denied` - 접근 거부
- `/error/ip-verification` - IP 인증 오류
- `/error/session-expired` - 세션 만료

## 📝 코드 스타일 가이드

- ESLint 및 Prettier 설정 포함
- `lint-staged` 및 `husky`를 사용하여 Git Hooks 적용
- 커밋 메시지에 `Conventional Commits` 규칙을 따름
- 스타일 코드는 module.scss 파일에 작성

**예시)**

DividerScroll.module.scss

```scss
.dividerScroll {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  flex-grow: 1;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 12px 40px;
  border-top: none;
  border-bottom: none;

  &.noPadding {
    padding: 0;
  }

  &.showTopBorder {
    border-top: 1px solid #dde1eb;
  }

  &.showBottomBorder {
    border-bottom: 1px solid #dde1eb;
  }
}
```

DividerScroll.tsx

```typescript jsx
...
import style from './DividerScroll.module.scss'
...
    <div
      ref={containerRef}
      className={clsx(
        style.dividerScroll,
        !padding && style.noPadding,
        showTopBorder && style.showTopBorder,
        showBottomBorder && style.showBottomBorder,
        className,
      )}
      {...DividerScrollProps}
    >
      <div ref={contentRef}>{children}</div>
    </div>
...
```

## 📌 커밋 메시지 규칙

아래 표는 `Conventional Commits`를 따르는 커밋 메시지 유형을 보여줍니다.

| 유형     | 설명                                                                |
| -------- | ------------------------------------------------------------------- |
| feat     | 새로운 기능 추가                                                    |
| fix      | 버그 수정                                                           |
| docs     | 문서 변경 (예: README)                                              |
| style    | 코드 스타일 변경 (예: 공백, 세미콜론, 기능적 변화 없음)             |
| refactor | 코드 리팩토링 (기능 변경 없이 코드 구조 개선)                       |
| perf     | 성능 개선                                                           |
| test     | 테스트 추가 또는 업데이트                                           |
| chore    | 빌드 프로세스 또는 보조 도구 변경 (예: CI/CD 설정, 종속성 업데이트) |
| revert   | 이전 커밋 되돌리기                                                  |

**예시)**

> feat: 사용자 로그인 기능 추가  
> fix: 로그인 시 잘못된 비밀번호 입력 시 오류 수정  
> chore: eslint 설정 업데이트

## 🐳 Docker 빌드

```bash
docker build -t mi-platform-frontend .

# 로컬 실행
docker run -p 8080:80 mi-platform-frontend
```
자세한 배포는 AMDP 파이프라인 참고

## 📂 프로젝트 구조

```
📦 project-root/
┣ 📂 public/
┃ ┗ 📂 locales/          # i18n 번역 파일
┣ 📂 src/
┃ ┣ 📂 assets/           # 정적 파일 (이미지, 아이콘, 폰트 등)
┃ ┣ 📂 components/       # 재사용 가능한 컴포넌트
┃ ┃ ┣ 📂 admin/          # 관리자 관련 컴포넌트
┃ ┃ ┣ 📂 common/         # 공통 컴포넌트 (차트, 버튼, 입력 등)
┃ ┃ ┗ 📂 mi/             # MI 플랫폼 전용 컴포넌트
┃ ┣ 📂 constants/        # 상수 값
┃ ┣ 📂 contexts/         # Context API 관련 파일
┃ ┣ 📂 hooks/            # 커스텀 훅
┃ ┣ 📂 layouts/          # 레이아웃 컴포넌트
┃ ┣ 📂 lib/              # 라이브러리 파일 (axios, i18n, 차트 어댑터)
┃ ┣ 📂 pages/            # 주요 페이지
┃ ┃ ┣ 📂 admin/          # 관리자 페이지
┃ ┃ ┣ 📂 common/         # 공통 페이지 (로그인, 콜백 등)
┃ ┃ ┣ 📂 error/          # 오류 페이지
┃ ┃ ┗ 📂 mi/             # MI 플랫폼 페이지 (대시보드, 인사이트 등)
┃ ┣ 📂 providers/        # 컨텍스트 제공자
┃ ┣ 📂 routes/           # 라우트 정의
┃ ┣ 📂 service/          # API 서비스 파일
┃ ┣ 📂 store/            # 상태 관리 (Zustand 스토어)
┃ ┣ 📂 styles/           # 전역 스타일 파일
┃ ┣ 📂 theming/          # 테마 설정
┃ ┣ 📂 types/            # 타입 정의
┃ ┣ 📂 utils/            # 유틸리티 함수
┃ ┣ 📂 App.tsx           # 메인 App 컴포넌트
┃ ┗ 📂 main.tsx          # 애플리케이션 진입점
┣ 📂 docs/               # 문서
┣ 📂 .husky/             # Git Hook 설정
┣ 📂 eslint.config.js    # ESLint 설정
┣ 📂 vite.config.ts      # Vite 설정
┗ 📂 package.json        # 의존성 및 스크립트
```

## 🔧 사용 가능한 스크립트

- `npm run dev` - 개발 서버 시작
- `npm run dev-vdi` - VDI 모드로 개발 서버 시작
- `npm run build` - 빌드
- `npm run lint` - ESLint 실행
- `npm run preview` - 빌드 미리보기

## 🔨 빌드 환경 변수

빌드 시 다음 환경 변수를 사용하여 빌드 옵션을 설정할 수 있습니다.

### VITE_PROFILE

애플리케이션의 환경 프로필을 설정합니다.

**사용 가능한 값:**
- `local` - 로컬 개발 환경
- `dev` - 개발 환경
- `prod` - 프로덕션 환경

**사용 예시:**
```bash
# 로컬 환경으로 빌드
npm run build:local

# 개발 환경으로 빌드
npm run build:dev

# 프로덕션 환경으로 빌드
npm run build:prod
```

### VITE_POSITION_PLAY_REMOTE_URL

모듈 페더레이션 **Remote** 애플리케이션의 베이스 URL(scheme + host + port)입니다. Host는 `{VITE_POSITION_PLAY_REMOTE_URL}/assets/remoteEntry.js`를 로드합니다.

미설정 시 기본값은 `http://localhost:5174`입니다(`vite.config.ts` 참고).

### VITE_USE_EXTERNAL_LOGIN

외부 로그인 시스템 사용 여부를 설정합니다.

**사용 가능한 값:**
- `true` - 외부 로그인 사용
- `false` - 내부 로그인 사용 (기본값)

**사용 예시:**
```bash
# 외부 로그인을 사용하는 프로덕션 빌드
npm run build:prod:external

# 직접 환경 변수 지정
cross-env VITE_PROFILE=prod VITE_USE_EXTERNAL_LOGIN=true npm run build
```

### 빌드 스크립트

프로젝트에는 다음과 같은 빌드 스크립트가 미리 정의되어 있습니다:

- `npm run build:local` - 로컬 환경 빌드 (`VITE_PROFILE=local`, `VITE_USE_EXTERNAL_LOGIN=false`)
- `npm run build:dev` - 개발 환경 빌드 (`VITE_PROFILE=dev`, `VITE_USE_EXTERNAL_LOGIN=false`)
- `npm run build:prod` - 프로덕션 환경 빌드 (`VITE_PROFILE=prod`, `VITE_USE_EXTERNAL_LOGIN=false`)
- `npm run build:prod:external` - 외부 로그인을 사용하는 프로덕션 빌드 (`VITE_PROFILE=prod`, `VITE_USE_EXTERNAL_LOGIN=true`)

### Docker 빌드 시 사용법

Docker 빌드 시 `--build-arg` 옵션을 사용하여 환경 변수를 전달할 수 있습니다:

```bash
# 기본값으로 빌드 (dev 환경, 내부 로그인)
docker build -t mi-platform-frontend .

# 프로덕션 환경으로 빌드
docker build \
  --build-arg VITE_PROFILE=prod \
  -t mi-platform-frontend .

# 외부 로그인을 사용하는 프로덕션 빌드
docker build \
  --build-arg VITE_PROFILE=prod \
  --build-arg VITE_USE_EXTERNAL_LOGIN=true \
  -t mi-platform-frontend .
```

## 💡 개발용 Mock 설정 (필요 시 참고사항)
`d08f60c0) refactor: mock 및 미사용 파일 제거` 내용을 참고하여 기존에 사용하던 mcok 관련 파일을 복구합니다.

```
📦 project-root/
┣ 📂 mock/
┃ ┣ 📂 swagger/  
┃ ┃ ┣ swagger-ui.css
┃ ┃ ┗ swagger-ui-bundle.js
┃ ┣ index.html
┃ ┗ mock-api.json
┣ .env.mock
┗ package.json
```


mock-api.json 파일을 BE 스웨거에서 다운받아서 파일 교체 후 prettier를 적용합니다.

```bash
prettier -w ./mock/mock-api.json
```

이후 파일 내용을 다음으로 치환합니다.
1. `"*/*"` -> `"application/json"`
2. `8080` -> `4010`

이후 시큐리티 관련 부분을 제거해줍니다.

```bash
# 종속성 설치
npm i

# Mock(+Dev) 서버 실행
npm run mock
```

### Mock 스웨거
http://localhost:9000/

