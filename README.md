# mi-platform-frontend

[English](README.md) | [한국어](docs/ko/README.md)

## 📝 Project Overview

The `mi-platform-frontend` project is a web application based on React + Chart.js. The MI (Market Intelligence) platform helps companies make strategic decisions by collecting, analyzing, and visualizing information.

## 🔧 Installation and Execution

```sh
git clone https://github.com/your-repo.git
cd mi-platform-frontend

# using dev branch
git checkout dev
# or
# style branch
git checkout dev-style

# run local
npm run dev
# or
# local with mock api server
npm run mock
```

## 🛠️ IDE Information

- **IntelliJ IDEA 2024.3.4.1 (Ultimate Edition)**
- **Visual Studio Code Version: 1.98.1 (Universal)**

## ✨ ESLint Setting

You need to set up ESLint in your IDE. For detailed instructions, please refer to [IDE_SETTING.md](docs/en/IDE_SETTING.md).

> ⚠️ You must set up ESLint configuration in your IDE to ensure code quality and consistency. You should also use Prettier for code formatting.

## 📦 Tech Stack

- **Node 23.5**: Latest LTS version
- **React 19**: Latest version
- **TypeScript**: Type checking
- **MUI**: Styling
- **Zustand / React Query**: State management
- **Axios**: API requests
- **i18next**: Multilingual (planned for future enhancement)
- **Chart.js & react-chartjs-2**: Charts
- **ESLint & Prettier**: Code style
- **Husky & lint-staged**: Git Hooks

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

## 🐳 Docker Build (Temporary)

```bash
docker build -t mi-platform-frontend .

# Run locally
docker run -p 8080:80 my-react-app
```

## 📂 Project Structure

```
📦 project-root/
┣ 📂 public/
┣ 📂 src/
┃ ┣ 📂 adapter/        # Adapter related files
┃ ┣ 📂 assets/         # Static files (images, icons, etc.)
┃ ┣ 📂 components/     # Reusable components
┃ ┃ ┣ 📂 admin/        # Admin related components
┃ ┃ ┣ 📂 common/       # Common components
┃ ┃ ┗ 📂 user/         # User related components
┃ ┣ 📂 constants/      # Constant values
┃ ┣ 📂 contexts/       # Context API related files
┃ ┣ 📂 hooks/          # Custom hooks
┃ ┣ 📂 layouts/        # Layout components
┃ ┣ 📂 lib/            # Library files
┃ ┣ 📂 pages/          # Main pages
┃ ┃ ┣ 📂 admin/        # Admin pages
┃ ┃ ┣ 📂 error/        # Error pages
┃ ┃ ┗ 📂 user/         # User pages
┃ ┣ 📂 providers/      # Providers for context
┃ ┣ 📂 routes/         # Route definitions
┃ ┣ 📂 styles/         # Style files
┃ ┣ 📂 types/          # Type definitions
┃ ┣ 📂 utils/          # Utility functions
┣ 📂 mock/             # Mock API related files
┣ 📂 .husky/           # Git Hook settings
```
