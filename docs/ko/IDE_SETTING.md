### IntelliJ IDEA 설정

1. **ESLint 설정**

   - `Preferences` > `Languages & Frameworks` > `JavaScript` > `Code Quality Tools` > `ESLint`로 이동합니다.
   - `Automatic ESLint configuration`을 선택합니다.
   - `Run eslint --fix on save` 옵션을 활성화합니다. (선택사항)

2. **Prettier 설정**
   - `Preferences` > `Languages & Frameworks` > `JavaScript` > `Prettier`로 이동합니다.
   - `On code reformat`과 `On save` 옵션을 활성화합니다. (선택사항)

### Visual Studio Code 설정

1. **ESLint 설정**

   - `Extensions`에서 [ESLint 확장 프로그램](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)을 설치합니다.
   - `settings.json` 파일에 다음을 추가합니다:
     ```json
     "eslint.enable": true,
     "eslint.validate": [
       "javascript",
       "javascriptreact",
       "typescript",
       "typescriptreact"
     ],

     /* 선택사항 */
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
     ```

2. **Prettier 설정**
   - `Extensions`에서 [Prettier - Code formatter 확장 프로그램](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)을 설치합니다.
   - `settings.json` 파일에 다음을 추가합니다:
     ```json
     "prettier.requireConfig": true,

     /* 선택사항 */
     "editor.formatOnSave": true,
     ```
