title: 实践严格的代码风格检查来保证代码质量
categories:
  - Code
tags:
  - eslint
  - code style
  - git hook
toc: true
date: 2017-5-24 22:29:11
---

工作之后，代码洁癖越来越重；团队协作时，不同人的代码交织在一起，编码风格冲突问题更显突出。我们需要一套严格的代码风格检查流程来确保代码质量，保证多人协作项目的代码也能整洁统一高可读。

<!-- more -->

## 1. 使用 ESlint 检查 JavaScript

ESlint 是目前非常流行、已被广泛应用的 JavaScript 检查工具。我们可以根据自己的喜好定制一套 ESlint 配置，并在项目中对代码风格进行检查，辅助代码规范执行，提高代码质量。

### 1.1 在 webpack 中集成 ESlint

定制好 ESlint 的配置文件之后，在命令行可以直接调用 ESlint 进行代码检查（参见 [Command Line Interface](http://eslint.org/docs/user-guide/command-line-interface)）。一般来说，我们会在 `package.json` 中添加一个 lint 的 npm task。如下

```json
"scripts": {
  "lint": "eslint ./site/**/*.js ./site/**/*.vue ./package/**/*.vue ./package/**/*.js ./preview/**/*.vue ./preview/**/*.js"
}
```

配置后，运行 `npm run lint` 即可进行 ESlint 检查。

但是，每次都手动检查带来了一定的执行成本。我们很难要求团队每个人都能勤检查，所以要尽量部署一些半强制的自动检查措施来时时提醒，约束行为，养成习惯。将 ESlint 集成进 webpack 可以在每次打包时都在终端和 devtool console 中打印出检查结果，增强约束效果（通过插件为编辑器集成 ESlint 功能，在编写时实时提醒更为有效）。

以 Vue 项目为例：

安装 `eslint-loader`, `eslint-plugin-html`。

```bash
$ npm i eslint-loader eslint-plugin-html --save-dev
```

修改 ESlint 配置文件:

```json
//.eslintrc.json
"plugins": [
    "html"
]
```

在 `webpack` 中引入 `eslint-loader`:

```javascript
//webpack.config.js
module.exports = {
  // ... other options
  module: {
    rules: [
      // only lint local *.vue files
      {
        enforce: 'pre',
        test: /\.vue$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      },
      // but use vue-loader for all *.vue files
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  }
}
```
集成后，每次打包都会输出 ESlint 检查结果：

![eslint1](/imgs/blog/eslint1.png)

![eslint2](/imgs/blog/eslint2.png)

如果写出了不合要求的代码，终端、浏览器……都会不停的蹦出提示烦你，烦你烦到受不了的去改正了，约束代码风格的目的就达到了。

### 1.2 抽象出团队共享的配置文件

团队需要制定统一的规范，ESlint 提供功能可以将配置文件抽出并复用。ESlint 配置文件中有一个名为 `extends` 的属性值，可以从其他配置文件进行继承操作。

我们可以将定义好的配置文件抽出成一个 npm 包，将其发布到 npm 仓库中。例如：[eslint-config-wdfe](https://github.com/wdfe/eslint-config-wdfe)。他人想要使用该配置时，执行：

```bash
$ npm i eslint-config-wdfe --save-dev
```

随后在本地配置文件中写入：

```
{
    "extends": "wdfe"
}
```

即可。

使用 npm 托管规则文件还可以方便的进行版本迭代。规则有更改？大家重新 npm i 一下就可以更新了。将该 npm 包集成进团队项目脚手架中，可以在项目创建时就做好 ESlint 检查的准备。

### 1.3 自动修正与例外规则

ESLint 提供部分自动修正功能。某些易修复、不会影响代码逻辑的风格检查项：如缩进、空格等，ESlint 可以自动将不合格代码修改为符合规范的代码，省去很多体力活。当然像代码命名等与代码逻辑紧耦合的检查项 ESlint 是不敢自己改的。推荐在检查时默认就加上 `--fix` 参数，无痛。

```bash
$ eslint --fix **/*.vue
```

有时会遇到一些尴尬情景，比如用 webpack 的 ProvidePlugin 插件注入的全局变量，直接使用无法通过 ESLint 的 `no-undef` 规则。调用后端接口时某些参数不是驼峰写法，此时会触发 `camelcase` 规则。这些本不是我们的错或者没办法改的错，再一直提醒就很碍眼了。我们可以选择性的让 ESlint 忽略他们。

![eslint3](/imgs/blog/eslint3.png)

如上图所示，使用指定格式的注释即可在指定场景关闭 ESlint 检查。更多注释写法可以参考 [Disabling Rules with Inline Comments](http://eslint.org/docs/user-guide/)

## 2. 使用 git-hook 在提交代码时做强制检查

编辑器集成 lint、webpack 集成 lint 这些都是建议手段，假如开发者完全忽视，是可以将脏代码提交进仓库的。我们可以使用 git-hook 再加一层保险，在 commit 时自动做 ESlint 检查，不通过就不让提交！

安装 pre-commit:

```bash
$ npm i pre-commit --save-dev
```

在 `package.json` 中加入任务：

```json
{
  ...
  "pre-commit": {
    "run": [
      "lint"
    ]
  }
  ...
}
```
这样就会在 commit 时自动跑一次 `npm run lint` 了。如果出现 erorr，ESlint 会返回 1 而非正常通过的 0，此时提交就会终止。

## 3. 养成更多良好的代码风格

我认为一个有追求的工程师应该时刻关注自己的代码风格，毕竟这是自己的脸面，也是自己的一个象征。从一个人的代码可以窥见一个人的性格。除了 ESlint 的检查项，还有很多代码风格可供参考，举几个例子：

1. html 风格：class 命名、折行等
2. css 风格：条目书写顺序（我一直按照 content > 布局属性（position 等） > 尺寸属性（width 等）> 字体属性（font 等）> 其他属性（background 等））、引号、折行等
3. 注释风格：使用 jsdocs 为函数自动生成注释、组件添加注释、尽量做到多写注释，注释全面
4. commit log 风格：按照 [git commit log 规范](http://www.ruanyifeng.com/blog/2016/01/commit_message_change_log.html)
5. 排版风格：最典型的 —— 中英文混排加空格

我个人是一个洁癖较严重的人，从不吝啬于给自己加各种约束，希望自己能写出干净的代码。如果你也想尝试更多规范，建议参考一下百度 FEX 的 [styleguide](https://github.com/fex-team/styleguide)。

## 4. 参考资料

1. [Linting](https://github.com/vuejs/vue-loader/blob/master/docs/en/workflow/linting.md)
2. [Disabling Rules with Inline Comments](http://eslint.org/docs/user-guide/configuring#disabling-rules-with-inline-comments)
3. [git commit log 规范](http://www.ruanyifeng.com/blog/2016/01/commit_message_change_log.html)
4. [styleguide](https://github.com/fex-team/styleguide)
