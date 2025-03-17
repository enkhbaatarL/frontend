# mi-platform-frontend

[English](../../README.md) | [한국어](README.md)

## 📝 프로젝트 개요

`mi-platform-frontend` 프로젝트는 React + Chart.js를 기반으로 한 웹 애플리케이션입니다. MI (Market Intelligence) 플랫폼은 정보를 수집, 분석, 시각화하여 기업이 전략적 결정을 내릴 수 있도록 돕습니다.

## 🔧 설치 및 실행

```sh
git clone https://github.com/sk-mi-platform/frontend.git
cd mi-platform-frontend

# 개발 브랜치 사용
git checkout dev
# 또는
# 퍼블리싱 브랜치
git checkout dev-style

# 로컬 실행
npm run dev
# 또는
# 모의 API 서버와 함께 로컬 실행
npm run mock
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
- **MUI 6.4**: UI 프레임워크
- **Zustand / React Query**: 상태 관리
- **Axios**: API 요청
- **i18next**: 다국어 지원 (향후 지원 예정)
- **Chart.js (4.4.8) & react-chartjs-2**: 차트
- **ESLint & Prettier**: 코드 스타일
- **Husky & lint-staged**: Git Hooks

## 📝 코드 스타일 가이드

- ESLint 및 Prettier 설정 포함
- `lint-staged` 및 `husky`를 사용하여 Git Hooks 적용
- 커밋 메시지에 `Conventional Commits` 규칙을 따름

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

## 🐳 Docker 빌드 (임시)

```bash
docker build -t mi-platform-frontend .

# 로컬 실행
docker run -p 8080:80 my-react-app
```

## 📂 프로젝트 구조

```
📦 project-root/
┣ 📂 public/
┣ 📂 src/
┃ ┣ 📂 adapter/        # 어댑터 관련 파일
┃ ┣ 📂 assets/         # 정적 파일 (이미지, 아이콘 등)
┃ ┣ 📂 components/     # 재사용 가능한 컴포넌트
┃ ┃ ┣ 📂 admin/        # 관리자 관련 컴포넌트
┃ ┃ ┣ 📂 common/       # 공통 컴포넌트
┃ ┃ ┗ 📂 user/         # 사용자 관련 컴포넌트
┃ ┣ 📂 constants/      # 상수 값
┃ ┣ 📂 contexts/       # Context API 관련 파일
┃ ┣ 📂 hooks/          # 커스텀 훅
┃ ┣ 📂 layouts/        # 레이아웃 컴포넌트
┃ ┣ 📂 lib/            # 라이브러리 파일
┃ ┣ 📂 pages/          # 주요 페이지
┃ ┃ ┣ 📂 admin/        # 관리자 페이지
┃ ┃ ┣ 📂 error/        # 오류 페이지
┃ ┃ ┗ 📂 user/         # 사용자 페이지
┃ ┣ 📂 providers/      # 컨텍스트 제공자
┃ ┣ 📂 routes/         # 라우트 정의
┃ ┣ 📂 styles/         # 스타일 파일
┃ ┣ 📂 types/          # 타입 정의
┃ ┣ 📂 utils/          # 유틸리티 함수
┣ 📂 mock/             # 모의 API 관련 파일
┣ 📂 .husky/           # Git Hook 설정
```
