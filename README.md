# mi-platform-frontend

[English](README.md) | [한국어](docs/ko/README.md)

## 📝 Project Overview

The `mi-platform-frontend` project is a web application based on React + Chart.js. The MI (Market Intelligence) platform helps companies make strategic decisions by collecting, analyzing, and visualizing information.

## 🔧 Installation and Execution

```sh
git clone https://github.com/your-repo.git
cd mi-platform-frontend
npm install

# using dev branch
git checkout dev
# or
# style branch
git checkout dev-style

# run local
npm run dev
# or
# run with VDI development API server
npm run dev-vdi
```

## 🛠️ IDE Information

- **IntelliJ IDEA 2024.3.4.1 (Ultimate Edition)**
- **Visual Studio Code Version: 1.98.1 (Universal)**

## ✨ ESLint Setting

You need to set up ESLint in your IDE. For detailed instructions, please refer to [IDE_SETTING.md](docs/en/IDE_SETTING.md).

> ⚠️ You must set up ESLint configuration in your IDE to ensure code quality and consistency. You should also use Prettier for code formatting.

## 📦 Tech Stack

- **Node 22.14**: Latest LTS version
- **React 19**: Latest version
- **TypeScript**: Type checking
- **Vite 6.2**: Build tool and dev server
- **MUI 6.4**: UI Framework
- **Zustand / React Query**: State management
- **Axios**: API requests
- **i18next**: Multilingual (planned for future enhancement)
- **Chart.js (4.4.8) & react-chartjs-2**: Charts
- **ESLint & Prettier**: Code style
- **Husky & lint-staged**: Git Hooks
- **vite-plugin-federation**: Host loads remote micro-frontends

> ⚠️ Multilingual support is partially implemented with `t('string')` format in the code, but currently bypassed for output.   
> (Future mapping is required)

## 🔌 Module Federation

This app acts as a **host** and loads selected UI from a **remote** application at runtime via [Vite Module Federation](https://github.com/originjs/vite-plugin-federation).

### Configuration (`vite.config.ts`)

| Item | Value |
|------|--------|
| Host name | `hostApp` |
| Remote name | `positionPlayRemote` |
| Remote entry URL | `{remoteUrl}/assets/remoteEntry.js` |
| `remoteUrl` | `VITE_POSITION_PLAY_REMOTE_URL` env, or `http://localhost:5174` if unset |

**Shared dependencies** (singleton, version-aligned with the host): `react`, `react-dom`, `react-router-dom`. Host and remote must use compatible major versions so a single instance is shared at runtime.

The Vite build sets `modulePreload: false` and `target: 'esnext'` as required for federation bundling.

### In-app route

- **`/mi/position-play`** — Shell page that lazy-loads the remote module `positionPlayRemote/PositionPlayPage` inside the MI layout (`PositionPlayRemotePage`).

### TypeScript

Remote module paths are declared in `src/types/federation.d.ts` so `import('positionPlayRemote/PositionPlayPage')` type-checks.

### Local development

1. Start the **remote** app so it serves `remoteEntry.js` (default expectation: dev server on port **5174**).
2. Start this **host** (`npm run dev`).
3. Open `/mi/position-play`. If the remote is down or the URL is wrong, the page will fail to load the federated chunk.

Override the remote origin with `VITE_POSITION_PLAY_REMOTE_URL` (no trailing path; the host app appends `/assets/remoteEntry.js`).

## 🛣️ Routing Structure

The application uses React Router v7 with a hierarchical routing structure:

### Main Routes
- `/` - Login page
- `/callback` - OAuth callback processing
- `/saml2/authenticate` - SAML authentication callback
- `/pdf-viewer/:fileId` - PDF viewer
- `/healthcheck` - Health check endpoint

### MI Platform (`/mi`)
- `/mi` - Redirects to company-specific home page
- `/mi/dashboard` - Main dashboard
- `/mi/signal-map` - Signal map visualization
- `/mi/position-play` - Position Play (Module Federation remote)
- `/mi/market-data` - Market data analysis
- `/mi/insights` - Market insights
- `/mi/data-detail/:goodsNo/:goodsDataNo` - Detailed data view
- `/mi/notices` - Notice board
  - `/mi/notices/:noticeNo` - Notice detail
- `/mi/help-center` - Help center (FAQ)
- `/mi/privacy-policy` - Privacy policy
- `/mi/notifications` - User notifications

### Admin (`/admin`)
- `/admin` - Redirects to customer company management
- `/admin/customer-company` - Customer company management
  - `/admin/customer-company/companies` - Company list
  - `/admin/customer-company/owner-companies` - Owner companies
- `/admin/member-mgmt` - User management
  - `/admin/member-mgmt/users` - Service users
  - `/admin/member-mgmt/managers` - Admin managers
- `/admin/data-providers` - Data provider management
  - `/admin/data-providers/providers` - Provider list
- `/admin/notification` - Notification management
  - `/admin/notification/list` - Notification list
- `/admin/boards` - Board management
  - `/admin/boards/notice` - Notice management
  - `/admin/boards/faq` - FAQ management
- `/admin/system` - System management
  - `/admin/system/api` - API management

### Error (`/error`)
- `/error/404` - Page not found
- `/error/auth` - Authentication error
- `/error/unknown` - Unknown error
- `/error/access-denied` - Access denied
- `/error/ip-verification` - IP verification error
- `/error/session-expired` - Session expired

## 📝 Style Guide

- Includes ESLint and Prettier settings
- You should write style code in a module.scss file.

**Example)**

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

## 📌 Commit Message Convention

The table below shows the types of commit messages following `Conventional Commits`.

| Type     | Description                                                                            |
| -------- | -------------------------------------------------------------------------------------- |
| feat     | Add new features                                                                       |
| fix      | Bug fixes                                                                              |
| docs     | Documentation changes (e.g., README)                                                   |
| style    | Code style changes (e.g., whitespace, semicolons, no functional changes)               |
| refactor | Code refactoring (improving code structure without changing functionality)             |
| perf     | Performance improvements                                                               |
| test     | Adding or updating tests                                                               |
| chore    | Changes to build process or auxiliary tools (e.g., CI/CD settings, dependency updates) |
| revert   | Revert previous commits                                                                |

**Example)**

> feat: Add user login feature  
> fix: Fix error when entering incorrect password during login  
> chore: Update eslint settings

## 🐳 Docker Build

```bash
docker build -t mi-platform-frontend .

# Run locally
docker run -p 8080:80 mi-platform-frontend
```
For detailed deployment, refer to AMDP pipeline

## 📂 Project Structure

```
📦 project-root/
┣ 📂 public/
┃ ┗ 📂 locales/          # i18n translation files
┣ 📂 src/
┃ ┣ 📂 assets/           # Static files (images, icons, fonts, etc.)
┃ ┣ 📂 components/       # Reusable components
┃ ┃ ┣ 📂 admin/          # Admin related components
┃ ┃ ┣ 📂 common/         # Common components (charts, buttons, inputs, etc.)
┃ ┃ ┗ 📂 mi/             # MI platform specific components
┃ ┣ 📂 constants/        # Constant values
┃ ┣ 📂 contexts/         # Context API related files
┃ ┣ 📂 hooks/            # Custom hooks
┃ ┣ 📂 layouts/          # Layout components
┃ ┣ 📂 lib/              # Library files (axios, i18n, chart adapters)
┃ ┣ 📂 pages/            # Main pages
┃ ┃ ┣ 📂 admin/          # Admin pages
┃ ┃ ┣ 📂 common/         # Common pages (login, callback, etc.)
┃ ┃ ┣ 📂 error/          # Error pages
┃ ┃ ┗ 📂 mi/             # MI platform pages (dashboard, insights, etc.)
┃ ┣ 📂 providers/        # Providers for context
┃ ┣ 📂 routes/           # Route definitions
┃ ┣ 📂 service/          # API service files
┃ ┣ 📂 store/            # State management (Zustand stores)
┃ ┣ 📂 styles/           # Global style files
┃ ┣ 📂 theming/          # Theme configuration
┃ ┣ 📂 types/            # Type definitions
┃ ┣ 📂 utils/            # Utility functions
┃ ┣ 📂 App.tsx           # Main App component
┃ ┗ 📂 main.tsx          # Application entry point
┣ 📂 docs/               # Documentation
┣ 📂 .husky/             # Git Hook settings
┣ 📂 eslint.config.js    # ESLint configuration
┣ 📂 vite.config.ts      # Vite configuration
┗ 📂 package.json        # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run dev-vdi` - Start development server in VDI mode
- `npm run build` - Build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview build

## 🔨 Build Environment Variables

You can configure build options using the following environment variables during build:

### VITE_PROFILE

Sets the application environment profile.

**Available values:**
- `local` - Local development environment
- `dev` - Development environment
- `prod` - Production environment

**Usage examples:**
```bash
# Build for local environment
npm run build:local

# Build for development environment
npm run build:dev

# Build for production environment
npm run build:prod
```

### VITE_POSITION_PLAY_REMOTE_URL

Base URL of the Module Federation **remote** application (scheme + host + port). The host loads `{VITE_POSITION_PLAY_REMOTE_URL}/assets/remoteEntry.js`.

If omitted, the default is `http://localhost:5174` (see `vite.config.ts`).

### VITE_USE_EXTERNAL_LOGIN

Sets whether to use external login system.

**Available values:**
- `true` - Use external login
- `false` - Use internal login (default)

**Usage examples:**
```bash
# Build for production with external login
npm run build:prod:external

# Specify environment variables directly
cross-env VITE_PROFILE=prod VITE_USE_EXTERNAL_LOGIN=true npm run build
```

### Build Scripts

The project has the following pre-defined build scripts:

- `npm run build:local` - Build for local environment (`VITE_PROFILE=local`, `VITE_USE_EXTERNAL_LOGIN=false`)
- `npm run build:dev` - Build for development environment (`VITE_PROFILE=dev`, `VITE_USE_EXTERNAL_LOGIN=false`)
- `npm run build:prod` - Build for production environment (`VITE_PROFILE=prod`, `VITE_USE_EXTERNAL_LOGIN=false`)
- `npm run build:prod:external` - Build for production with external login (`VITE_PROFILE=prod`, `VITE_USE_EXTERNAL_LOGIN=true`)

### Docker Build Usage

When building with Docker, you can pass environment variables using the `--build-arg` option:

```bash
# Build with default values (dev environment, internal login)
docker build -t mi-platform-frontend .

# Build for production environment
docker build \
  --build-arg VITE_PROFILE=prod \
  -t mi-platform-frontend .

# Build for production with external login
docker build \
  --build-arg VITE_PROFILE=prod \
  --build-arg VITE_USE_EXTERNAL_LOGIN=true \
  -t mi-platform-frontend .
```

## 💡 Development Mock Setup (Reference for when needed)

Refer to the content of `d08f60c0) refactor: mock 및 미사용 파일 제거` to restore mock-related files that were previously used.

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

Download the mock-api.json file from BE Swagger and replace the file, then apply prettier.

```bash
prettier -w ./mock/mock-api.json
```

After that, replace the file content as follows:
1. `"*/*"` -> `"application/json"`
2. `8080` -> `4010`

Then remove security-related parts.

```bash
# Install dependencies
npm i

# Run Mock(+Dev) server
npm run mock
```

### Mock Swagger
http://localhost:9000/
