title: Webpack 构建性能优化实践
categories:
  - Code
tags:
  - webpack
toc: true
date: 2017-6-12 13:29:11
---

随着项目体积膨胀，webpack 构建时间越来越长。webpack 构建属于高频需求，每天耗费大量时间干等着是很难受的——于是有了本文，探讨如何加速 webpack 构建。

<!-- more -->

# 1. 使用 visualizer 追踪与精简项目依赖

项目本身容易出现的问题有以下两点：

- 为了实现小功能，引了个大包

比如：只为了使用 `lodash` 中的某个工具函数，把整个 `lodash` 都引进来；只为了一个简单的时间格式化功能，引了几十 K 的 `moment`；只为了画一个简单的小图表，引了整个 `echarts`。

为了一个小功能，引入一个复杂的库明显是不划算的。为了解决这种问题， 我们需要仔细分析项目的依赖：`lodash` 有打碎的工具函数的各自的库，需要时可以直接引用 `lodash.clonedeep` 库，避免引入无用内容；简单功能自己实现，不要太偷懒；需求不高，可以换用小体积的库，比如画简单图，完全可以将 `echarts` 替换成能达到功能的另一个小型库。

- 无用依赖忘记移除

有时业务代码变动，部分逻辑下线，而文件头部的模块引入部分忘了删掉，就会导致产生无用依赖。

优化精简依赖既可以减少打包时间，也可以优化 bundle 体积。

项目使用的依赖散落在文件各处，其体积也难以横向对比。借助 webpack 的 stat 功能与合适的 visualizer 工具可以更轻松的分析依赖。

## 1.1 输出 stats.json

使用 [webpack-stats-plugin](https://github.com/FormidableLabs/webpack-stats-plugin) 插件可以在构建完成后的 output 目录下生成 `stats.json` 文件。这个文件记录了 webpack 构建相关数据。

`webpack-stats-plugin` 的使用方法可见 [README.md](https://github.com/FormidableLabs/webpack-stats-plugin)。

## 1.2 将 stats.json 导入 visualizer

目前有两个好用的 visualizer：

[WEBPACK VISUALIZER](https://chrisbateman.github.io/webpack-visualizer/)

![optimie-webpack-bundle-performance-1](/imgs/blog/optimie-webpack-bundle-performance-1.png)

通过这个圆环图可以清晰的看出各依赖的占比，寻找其中的大块依赖，检查是否有可精简项。

[webpack analyse](http://webpack.github.io/analyse/)

![optimie-webpack-bundle-performance-2](/imgs/blog/optimie-webpack-bundle-performance-2.png)

webpack 官方出的分析工具，可以从更多维度分析依赖。可以清晰的看到各文件中的依赖关系。

# 2. 升级环境

**一般来说**新版本总是要胜于旧版本，将 node、npm 以及项目依赖在项目正常工作的前提下升级到尽可能新的稳定版，往往会有好结果。例如：伴随着 node 8 发布的 npm 5 就声称在性能上获得了显著提升，至少 `npm install` 的速度起飞了。

# 3. 提速 Webpack 构建

## 3.1 查看 Webpack 各环节消耗时间

使用命令行调用 Webpack 时加入 `--colors`、`--profile`、`--display-modules` 可以显示加载的模块、构建各环节耗时，并着色以增强可读性。

![optimie-webpack-bundle-performance-3](/imgs/blog/optimie-webpack-bundle-performance-3.png)

## 3.2 使用 dllPlugin & DllReferencePlugin

这两个插件搭配使用，作用是将不产生变化的公共库（如 vue、react、polyfill 这种）抽离，将其进行预编译，这样在每次构建时就不再重复分析这些公共库，避免内耗。dllPlugin 用于预编译公共库，产生相应的 `dll.js` 和 `manifest.json`，DllReferencePlugin 用于将 dllPlugin 产生的预编译结果传送给 Webpack。使用 DllReferencePlugin 前要先用 dllPlugin 准备好预编译结果。

### 3.2.1 使用 dllPlugin 做预编译

新建一个 `webpack.config.dll.js`，其内容与项目构建文件基本类同，只是将入口换成公共库，仅对公共库做编译：

```
const path = require('path')
const autoprefixer = require('autoprefixer')
const px2rem = require('postcss-px2rem')
const webpack = require('webpack')
const filterStream = require('postcss-filter-stream')

module.exports = {
  entry: {
    vendor: ['es6-promise/auto', 'regenerator-runtime/runtime', 'vue', 'vuex-router-sync', 'vue-router', 'lodash.clonedeep', 'vuex', 'axios'] // 改动点1：项目入口改为需要预编译的公共库的入口
  },
  output: {
    path: path.resolve(path.resolve(__dirname), 'dll'), // 改动点2：编译出的文件找个地方存一下，我这里存到 /dll 文件夹下
    publicPath: '/',
    filename: 'dll.[name].js',
    library: '[name]'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'babel-loader',
          'eslint-loader'
        ],
        exclude: /node_modules/
      },
      {
        enforce: 'pre',
        test: /\.vue$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      },
      {
        test: /\.vue$/,
        loaders: [{
          loader: 'vue-loader',
          options: {
            postcss: {
              plugins: [autoprefixer({browsers: ['> 1%', 'ie >= 9', 'iOS >= 6', 'Android >= 2.1']}), filterStream('**/site/**', px2rem({remUnit: 75}))]
            }
          }
        }]
      },
      {
        test: /\.(css|scss|sass)$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.md$/,
        use: 'raw-loader'
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif|svg)(\?t=\d+)?$/,
        loaders: [{
          loader: 'url-loader?limit=8192&name=index/assets/[name]-[hash].[ext]'
        }]
      }
    ]
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, 'dll', '[name]-manifest.json'), // 改动点3：引入 dllPlugin 插件，指出将 manifest.json 存放的地方，我这里也存到 /dll 文件夹下，和 dll.js 一起
      name: '[name]',
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      output: {
        comments: false,
      },
      compress: {
        warnings: false
      }
    })
  ]
}
```

编写完后执行 `webpack --config=webpack.config.dll.js`，没问题的话，预编译结果会在 `/dll` 下会生成。

### 3.2.2 使用 DllReferencePlugin 引入预编译库 manifest

在项目构建的 `webpack.config.js` 中加入：

```
new webpack.DllReferencePlugin({
  context: __dirname,
  manifest: require('./dll/vendor-manifest.json') // 指向 dllPlugin 生成的 manifest.json
})
```

### 3.2.3 在页面中引入 dll.js

在 index.html 中，引入项目主要的 `app.js` 之前，先引入 `dll.js` 即可。如： `<script src="../dll/dll.vendor.js"></script>`。

如果使用 `HtmlwebpackPlugin` 插件，可以搭配 `HtmlWebpackIncludeAssetsPlugin` 插件引入该 js：

``` javascript
new HtmlWebpackIncludeAssetsPlugin({
  assets: ['dll/dll.vendor.js'],
  append: false,
  hash: true
}),
```

这就大功告成了。项目中依赖的公共库越多，提速效果越大，一般来说这个优化项都可带来 20%+ 的提速效果。我们再次使用 webpack 打包，可以看到：

![optimie-webpack-bundle-performance-4](/imgs/blog/optimie-webpack-bundle-performance-4.png)

公共库全部标明 `from dll-reference vendor`，同时其 `building` 耗时均为 0-1ms。相比较上面的几个 js，`building` 动辄 500ms 左右。这部分时间被节约了出来。

由于做了 vendor 的拆分，最终实际上是拆成了两个包，如果生产环境下还是想只用一个包的话，可以将这个插件只应用于开发环境，不用于生产环境。

## 3.3 happypack

webpack 在单个 node 进程中调用 loader，导致耗 cpu 计算型 loader 性能不佳。happypack 允许多进程调用 loader，恰当的使用 happypack 可以提速构建。

该插件适合场景：项目复杂度高、耗 cpu 操作多（如 babel transform）、需处理文件多。如果项目简单，使用该插件效果即不显著。

用法非常简单，首先在 webpack 构建文件中添加该插件：

```
const os = require('os')
const HappyPack = require('happypack')
const happThreadPool = HappyPack.ThreadPool({size: os.cpus().length}) // 指定线程池中的线程数量为处理器的核心数

...
modules: {
  rules: {
    {
      test: /\.js$/,
      use: [
        'happypack/loader?id=js', // 将 babel-loader 替换为 happypack/loader?id=js
        'eslint-loader'
      ],
      exclude: /node_modules/,
    },
    {
      test: /\.vue$/,
      loaders: [{
        loader: 'vue-loader',
        options: {
          postcss: {
            plugins: [autoprefixer({browsers: ['> 1%', 'ie >= 9', 'iOS >= 6', 'Android >= 2.1']}), filterStream('**/site/**', px2rem({remUnit: 75}))]
          },
          loaders: {
            js: 'happypack/loader?id=js' // 将 vue-loader 中处理 js 的部分也交给 happypack/loader?id=js 处理
          }
        }
      }]
    },
  }
},
plugins: [
  ...
  new HappyPack({
    id: 'js',
    loaders: ['babel-loader?cacheDirectory=true'], // 使用 happypack 接管 babel-loader 插件，并指定其 id 为 js
    threadPool: happThreadPool
  })
  ...
]
...
```

这里只允许 happypack 并行执行 `babel-loader`，对其他 loader 做了尝试，提速不明显。各位也可以根据自己项目实际情况多试试。

![optimie-webpack-bundle-performance-5](/imgs/blog/optimie-webpack-bundle-performance-5.png)

在 webpack 打印出的 log 里可以确认 happypack 是否生效。

## 3.4 使用 webpack-uglify-parallel 并行执行压缩

`webpack-uglify-parallel` 功能与自带的 `uglifyPlugin` 没差，只是允许开启多核并行执行以提高性能。

```
const os = require('os')
const UglifyJsParallelPlugin = require('webpack-uglify-parallel')

...
new UglifyJsParallelPlugin({
  workers: os.cpus().length,
  output: {
    comments: false,
  },
  compress: {
    warnings: false,
  },
  sourceMap: false
})
...
```

直接将项目中的 `uglifyPlugin` 替换为 `webpack-uglify-parallel` 即可。多加一个参数 `workers`，指定进程数，一般来说设置为 CPU 核心数。

## 3.5 其他零散的优化点

### 3.5.1 cache

开启 webpack 的 cache 选项：

```
module.exports = {
  cache: true,
  entry: ...,
  output: ...,
  ...
}
```

开启 babel-loader 的 cache 选项：

```
loaders: ['babel-loader?cacheDirectory=true'],
```

### 3.5.2 resolve.modules

定义 resolve.modules 可以告知 webpack 去哪里搜索模块。显式定义可以节约搜索时间。

```
resolve: {
  modules: [path.resolve(__dirname, '../node_modules')],  //根据项目实际情况配
},
```

### 3.5.3 resolve.alias 与 module.noParse

显式指定外部依赖的具体文件，如：

```
resolve: {
  alais: {
    'vue': 'vue/dist/vue.runtime.min.js',
    'vue-router': 'vue-router/dist/vue-router.min.js'
    ...
  }
},
```

指定到对应库的 min 文件，这种文件已经经过压缩，且不再含外部依赖，我们可以应用 noParse 让 webpack 跳过对其的解析来进行优化：

```
modules: {
  noParse: [/vue\.runtime\.min/, /vue-router\.min/]
}
```

# 4. CommonsChunkPlugin 与 DllPlugin 的区别

在多入口项目中，每个入口最终会产生一个独立的 bundle。CommonsChunkPlugin 可以抽取多入口中的公共模块部分，将公共模块打包到一个或多个独立文件中去，以便在其他入口和模块中使用。

使用 CommonsChunkPlugin 主要是为了复用公共模块，减少最终打包文件体积，优化加载性能。公共模块在每次构建时都会重新打包，所以并不会提升构建速度。

DllPlugin 的目的是预编译公共库，这样在之后的构建过程中，公共库都不需重新打包，主要目的是加速构建过程。当然，他也可以在生产环境临时客串一下 CommonsChunkPlugin 的功能，把你的代码拆分成两部分，dll 和其他，如果你想这么做的话。

# 5. 试验

在一个手头的小项目上，试验上面的方法，每次打包时间重复三次取平均值：

|                | 生产环境(ms) | 开发环境(ms) |
|----------------|--------------|--------------|
| 优化前         | 15509        | 11226        |
| dllPlugin      | 11166        | 8788         |
| happypack      | 9898         | 7743         |
| uglifyParallel | 8764         |              |


已经做到了近 50% 的速度提升，相信随着项目体积的膨胀，速度提升占比还会再上升。

# 6. 参考资料

1. [Webpack 构建性能优化探索](https://github.com/pigcan/blog/issues/1)
2. [webpack的性能优化](https://github.com/SunShinewyf/webpack-demo/issues/5)
3. [Webpack 性能优化 （一）](http://code.oneapm.com/javascript/2015/07/07/webpack_performance_1/)
4. [使用happypack将vuejs项目webpack初始化构建速度提升50%](https://flyyang.github.io/2017/03/09/%E4%BD%BF%E7%94%A8happypack%E5%B0%86vuejs%E9%A1%B9%E7%9B%AEwebpack%E5%88%9D%E5%A7%8B%E5%8C%96%E6%9E%84%E5%BB%BA%E9%80%9F%E5%BA%A6%E6%8F%90%E5%8D%8750/)
5. [webpack common chunks plugin vs webpack dll plugin](https://webpack.toobug.net/zh-cn/chapter3/common-chunks-plugin.html)
