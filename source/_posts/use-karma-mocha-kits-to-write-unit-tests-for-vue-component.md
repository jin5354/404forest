title: 使用 karma/mocha 全家桶为 Vue 组件编写单元测试
categories:
  - Code
tags:
  - unit test
  - karma
  - vue
  - mocha
toc: true
date: 2017-2-22 21:03:11
---

编写单元测试可以大大提高项目的稳定性和内心的安全感。对于功能点稳定、需长期迭代的项目，编写单元测试可以有效的减少维护成本，降低 Bug 率。最近在为公司内部的 Vue 组件库添加单元测试，配置测试环境、编写测试用例花了一些时间，略作整理。

<!-- more -->

## 1. 整理安装 Karma + mocha + sinon + chai 全家桶

整理一下配置测试环境所需要的依赖：

- **karma**  //test runner，提供测试所需的浏览器环境、监测代码改变自动重测、整合持续集成等功能
- **phantomjs-prebuilt** //phantomjs，在终端运行的浏览器虚拟机
- **mocha**  //test framework，测试框架，运行测试
- **chai**  //assertion framework, 断言库，提供多种断言，与测试框架配合使用
- **sinon**  //测试辅助工具，提供 spy、stub、mock 三种测试手段，帮助捏造特定场景
- **karma-webpack**  //karma 中的 webpack 插件
- **karma-mocha**  //karma 中的 mocha 插件
- **karma-sinon-chai**  //karma 中的 sinon-chai 插件
- **sinon-chai**  //karma 中的 chai 插件
- **karma-sourcemap-loader**  //karma 中的 sourcemap 插件
- **karma-phantomjs-launcher**  //karma 中的 phantomjs 插件
- **karma-spec-reporter**  //在终端输出测试结果
- **istanbul-instrumenter-loader**  //代码覆盖率统计工具 istanbul
- **karma-coverage-istanbul-reporter**  //代码覆盖率报告产出插件

官方示例中是使用 `karma-coverage` 来统计代码覆盖率的，不过很遗憾用来测试 Vue 组件输出结果不太正常，折腾一番无果，参照其他开源项目最终替换为了 [istanbul](https://github.com/deepsweet/istanbul-instrumenter-loader) 。

全家桶安装一波：

```bash
npm i karma phantomjs-prebuilt mocha chai sinon karma-webpack karma-mocha karma-sinon-chai sinon-chai karma-sourcemap-loader karma-phantomjs-launcher karma-spec-reporter istanbul-instrumenter-loader karma-coverage-istanbul-reporter --save-dev
```

## 2. 配置 karma

按照 karma 的文档，运行：

```bash
karma init
```

先后选择使用的测试框架、是否使用 require.js、浏览器环境、测试脚本存放位置、是否有需要 ignore 的文件，等等。很简单，选择完毕之后，该项目根目录下生成名为 `karma.conf.js` 文件。

接下来就是设置 karma 的各项插件的配置：

```javascript
module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // 手动引入 karma 的各项插件，如果不显式引入，karma 也会自动寻找 karma- 开头的插件并自动引入
    plugins: [
      'karma-coverage-istanbul-reporter',
      'karma-mocha',
      'karma-sinon-chai',
      'karma-webpack',
      'karma-sourcemap-loader',
      'karma-spec-reporter',
      'karma-phantomjs-launcher'
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    // 设定要使用的 frameworks
    frameworks: ['mocha', 'sinon-chai'],

    // list of files / patterns to load in the browser
    // 入口文件，按照 istanbul-instrumenter-loader 的要求来写
    files: ['./test/unit/index.js'],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    // 加入 webpack 与 sourcemap 插件
    preprocessors: {
      './test/unit/index.js': ['webpack', 'sourcemap'],
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    // 设定报告输出插件： spec 和 coverage-istanbul
    reporters: ['spec', 'coverage-istanbul'],

    // coverage-istanbul 输出配置，报告文件输出于根目录下的 coverage 文件夹内
    coverageIstanbulReporter: {

       // reports can be any that are listed here: https://github.com/istanbuljs/istanbul-reports/tree/590e6b0089f67b723a1fdf57bc7ccc080ff189d7/lib
      reports: ['html', 'lcovonly', 'text-summary'],

       // base output directory
      dir: './coverage',

       // if using webpack and pre-loaders, work around webpack breaking the source path
      fixWebpackSourcePaths: true,

       // Most reporters accept additional config options. You can pass these through the `report-config` option
      'report-config': {

        // all options available at: https://github.com/istanbuljs/istanbul-reports/blob/590e6b0089f67b723a1fdf57bc7ccc080ff189d7/lib/html/index.js#L135-L137
        html: {
          // outputs the report in ./coverage/html
          subdir: 'html'
        }
      }
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    // 设定终端上不输出 webpack 的打包信息
    webpackMiddleware: {
      noInfo: true
    },

    // 用来预编译源代码的 webpack 配置，基本就是项目的 webpack 配置，但要去掉 entry 属性
    webpack: {
      output: {
        path: __dirname + '/lib',
        filename: '[name].js',
        libraryTarget: 'umd'
      },
      module: {
        loaders: [
          {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/
          },
          // 为了统计代码覆盖率，对 js 文件加入 istanbul-instrumenter-loader
          {
            test: /\.(js)$/,
            loader: 'istanbul-instrumenter-loader',
            exclude: /node_modules/,
            include: /src|packages/,
            enforce: 'post',
            options: {
              esModules: true
            }
          },
          {
            test: /\.(js|vue)$/,
            loader: 'eslint-loader',
            exclude: /node_modules/,
            include: /src|packages/,
            enforce: 'pre',
            options: {
              eslint: {
                configFile: '../.eslintrc.json'
              }
            }
          },
          {
            test: /\.vue$/,
            loaders: [{
              loader: 'vue-loader',
              options: {
                postcss: [autoprefixer({browsers: ['> 1%', 'ie >= 9', 'iOS >= 6', 'Android >= 2.1']}), px2rem({remUnit: 75})],
                // 为了统计代码覆盖率，对 vue 文件加入 istanbul-instrumenter-loader
                preLoaders: {
                  js: 'istanbul-instrumenter-loader?esModules=true'
                }
              }
            }]
          },
          {
            test: /\.(scss|sass)$/,
            loaders: ['style-loader', 'css-loader', 'sass-loader']
          },
          {
            test: /\.css$/,
            loaders: ['style-loader', 'css-loader']
          },
          {
            test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif|svg)(\?t=\d+)?$/,
            loaders: [{
              loader: 'url-loader?limit=8192&name=[name]-[hash].[ext]'
            }]
          }
        ]
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: '"production"'
          }
        })
      ]
    }
  })
}
```

## 3. 规划目录结构

```bash
├── src/
├── packages/
│
├── test/
│   └── unit/
│       ├── index.js
│       └── *.spec.js
└── karma.conf.js
```

项目源代码均处于 src 和 packages 两个文件夹下，且 src 文件夹下存在一个总入口文件，其中引入了 src 与 packages 下的全部模块。

测试相关文件均放在 test/unit 文件夹下，总入口文件为 index.js，各个组件的单测文件分别为 组件名.spec.js。

karma 配置文件 karma.conf.js 放置于项目根目录下。

根据 `istanbul-instrumenter-loader` 文档的说明，测试总入口文件 index.js 内容如下：

```
// Polyfill fn.bind() for PhantomJS
/* eslint-disable no-extend-native */
Function.prototype.bind = require('function-bind')

// require all test files (files that ends with .spec.js)
// require 所有的测试文件 *.spec.js
const testsContext = require.context('.', true, /\.spec$/)
testsContext.keys().forEach(testsContext)

// require all src files except main.js for coverage.
// you can also change this to match only the subset of files that
// you want coverage for.
// require 需要统计覆盖率的源码文件
const srcContext = require.context('../../src', true, /^\.\/(?!main(\.js)?$)/)
srcContext.keys().forEach(srcContext)
```

## 4. 编写 Vue 组件的单元测试

经过上面三步，karma 全家桶已经配置完毕，现在只需在根目录下运行：

```bash
karma start karma.conf.js
```

即可运行 karma，并自动运行所有 test/unit/*.spec.js 的单测文件，同时监测代码改动，自动重跑测试。不过现在还没有单测文件，我们来写一个。

举例一个标准的 Vue 组件：

![unit-test-1](/imgs/blog/unit-test-1.png)

根据 vue [单元测试相关的官方文档](https://vuejs.org/v2/guide/unit-testing.html)，我们知道可以这样在测试环境下测试单独组件：

```javascript
import Button from '../../packages/Button/index.js'

const ButtonConstructor = Vue.extend(Button)
const vm = new ButtonConstructor({
  propsData: {
    type: 'gray'
  }
}).$mount()

console.log(vm.name) //'wd-button'
```

使用 Vue.extend 方法可以创建出一个组件实例，还可以直接将 prop 数据传进去。我们将这个方法封装下：

```javascript
// utils.js

import Vue from 'vue'

export const createCompInstance = (Component, propsData) => {
  const Constructor = Vue.extend(Component)
  return new Constructor({
    propsData
  }).$mount()
}
```

然后编写 Button 组件的单元测试：

```javascript
// Button.spec.js

import Button from '../../packages/Button/index.js'
import {createCompInstance} from './utils.js'

describe('Button', () => {

  let vm

  it('type 样式', () => {
    vm = createCompInstance(Button, {
      type: 'gray'
    })
    expect(Array.prototype.slice.call(vm.$el.classList)).to.include('wd-button-gray')
  })

  it('diabled 禁用态', () => {
    vm = createCompInstance(Button, {
      disabled: true
    })
    expect(vm.$el.hasAttribute('disabled')).to.be.true
  })

  ...

})

```
组件创建完毕之后，结合断言库对情况进行测试。例如：当给 Button 组件传入 prop：type = 'gray' 时，实例的 DOM 上应该会有 'wd-button-gray' 这个 Class，于是可用断言库进行判断:

```javascript
expect(Array.prototype.slice.call(vm.$el.classList)).to.include('wd-button-gray')
```

当给 Button 组件传入 prop：disabled = true 时，实例的 DOM 上应该有一个叫 disabled 的 Attribute。断言：

```javascript
expect(vm.$el.hasAttribute('disabled')).to.be.true
```

以此类推，逐步测试各个功能点是否工作正常。如果测试未通过，即行为与预期不服，断言失败，会报错：

![unit-test-6](/imgs/blog/unit-test-6.png)

如果测试通过，终端结果如下：

![unit-test-2](/imgs/blog/unit-test-2.png)

src 和 packages 中源码很多，测试只写了一点点，可以看到 Coverage summary 即代码覆盖率很低。

mocha 与 chai 的语法这里不再赘述，编写测试用例时需多多查看文档。

## 5. 一些小 Tips

mocha 中涉及异步操作的测试，要使用 done 函数：

```javascript
it('picker onHide 窗体隐藏回调', done => {
  vm = Picker({
    slots: [{
      type: 'data',
      flex: 1,
      values: ['北京', '上海', '广州'],
      textAlign: 'center'
    }],
    onHide: (instance) => {
      document.body.testToken = 'hide'
      instance.value = false
    },
  })
  Vue.nextTick(() => {
    const $btn = document.querySelector('.wd-picker-header-cancel')
    $btn.click()
    setTimeout(() => {
      expect(document.body.testToken).to.equal('hide')
      delete document.body.testToken
      done()
    }, 500)
  })
})
```
涉及到 `Vue.nextTick` 和 `setTimeout` 等异步操作的测试，要使用 `done()` 来标记完成时间点。

mocha 提供 `beforeEach` `afterEach` 等方法帮忙做些杂活；比如我想每次测试完组件的其中一个用例之后，清空一下 body 节点，防止留下残余 DOM 影响后续的操作：

```
beforeEach(() => {
  document.body.innerHtml = ''
})
```

将测试任务集成进 npm scripts：

```json
//package.json

"scripts": {
  "test": "karma start karma.conf.js --single-run",
}
```

为项目中的3个组件添加了单元测试，暂时写了40个测试用例，基本覆盖了文档上的全部功能点。这之后如果对组件做重构/ bug 修复/加新功能时，就不需要担心是否会影响老功能，也不需要自己手动 check，直接跑 `npm run test` 测试看结果就可以了。安全感 up。

![unit-test-3](/imgs/blog/unit-test-3.png)

在项目根目录的 coverage 文件夹内可以看到输出的 html 格式代码覆盖率报告：

![unit-test-4](/imgs/blog/unit-test-4.png)

点击文件可以看到更详细的说明：哪行代码测到了，哪行代码没有测到：

![unit-test-5](/imgs/blog/unit-test-5.png)

图中标红的地方即为没被测到的代码，有些是在 if 分支内，有的在 watch 里，没有被执行过。另外 phantomJS 对于模拟鼠标键盘事件的能力并不强，没有提供相关的 api，所以图中的有关鼠标拖拽的事件很难模拟，没能进行测试。这些测试更适合用 E2E 测试而非单元测试来做。

另外代码覆盖率有些地方算得并不准确，比如 Button/src 下的 `Button.vue` 组件，因为比较简单，没有 methods，只有几个 prop，被判断成了 0% 的覆盖率（实际上 Button 组件的5个用例已经把每个 prop 都测过一遍了）。希望未来这个工具能更新的更加准确一些。

其他组件的单测日后逐渐补上。

## 6. 参考资料

1. [karma](https://github.com/karma-runner/karma)
2. [mocha](https://github.com/mochajs/mocha)
3. [chai](https://github.com/chaijs/chai)
4. [istanbul-instrumenter-loader](https://github.com/deepsweet/istanbul-instrumenter-loader)
5. [Vue单元测试起步](https://imys.net/20161110/vue-unit-test-start.html)
6. [karma-coverage-istanbul-reporter](https://github.com/mattlewis92/karma-coverage-istanbul-reporter)
7. [Unit Testing](https://vuejs.org/v2/guide/unit-testing.html)
