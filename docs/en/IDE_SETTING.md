### IntelliJ IDEA Settings

1. **ESLint Settings**

   - Go to `Preferences` > `Languages & Frameworks` > `JavaScript` > `Code Quality Tools` > `ESLint`.
   - Select `Automatic ESLint configuration`.
   - Enable the `Run eslint --fix on save` option. (Optional)

2. **Prettier Settings**
   - Go to `Preferences` > `Languages & Frameworks` > `JavaScript` > `Prettier`.
   - Enable the `On code reformat` and `On save` options. (Optional)

### Visual Studio Code Settings

1. **ESLint Settings**

   - Install the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) from `Extensions`.
   - Add the following to the `settings.json` file:
     ```json
     "eslint.enable": true,
     "eslint.validate": [
       "javascript",
       "javascriptreact",
       "typescript",
       "typescriptreact"
     ],
     
     /* Optional */
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
     ```

2. **Prettier Settings**
   - Install the [Prettier - Code formatter extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) from `Extensions`.
   - Add the following to the `settings.json` file:
     ```json
     "prettier.requireConfig": true,

     /* Optional */
     "editor.formatOnSave": true,
     ```
