title: 代码分割结合 Prefetch 完美优化单页应用加载性能
categories:
  - Code
tags:
  - webpack
  - performance
  - prefetch
  - code splitting
  - prefetch-polyfill-webpack-plugin
  - toc: true
date: 2017-9-27 11:03:11
---

单页应用性能的最大痛点就是 bundle 体积大导致首屏时间过长。使用 webpack 的 `code splitting`（代码分割）功能可以将 bundle 分片，加速首屏，但之后的交互势必会受到影响。预加载分片 thunk 是必需的，本文探讨最理想的预加载手段。

<!-- more -->

> 注：
> 原始链接: https://www.404forest.com/2017/09/27/use-code-splitting-with-prefetch-to-improve-spa-web-page-load-performance/
> 文章备份: https://github.com/jin5354/404forest/issues/65

# 1. 场景概述

笔者负责一个认证类项目，项目页面结构大体如下：

![prefetch-1](/imgs/blog/prefetch-1.png)

随着项目体积膨胀，bundle 的体积已近 200k。认证系统有食品、出版物等多个分类，用户访问时多数情况下只进行一个分类的认证，把其他分类的代码也下载下来无疑产生性能损耗。于是按图进行代码切割，每个类目切割为单独的类目 chunk，公共模块用 `CommonsChunkPlugin` 提取成公共 chunk。切割后首页 chunk 只剩下 60k 左右，首屏时间由 2.2 秒减少到 1.2 秒（fast 3g 测试），优化效果显著。

用户从首页点击分类入口时，需要先下载类目 thunk 和公共 thunk 才能正常交互。若能使用预加载，可以在用户阅读首页的几秒钟时间内自动将后续 chunk 资源下载好，随后的交互就不会有阻滞感。

# 2. prefetch 方案对比

首先明确针对单页应用的分片 thunk 我们想要怎样的 prefetch 效果：

1. 延迟拉取，不要和首屏关键资源抢带宽，最好能在 onload 之后再拉取。
2. 无需执行，避免无谓损耗。

## 2.1 preload

preload 是较新的 web 标准。他可以声明式的告诉浏览器去获取某个资源，并且可以为资源设置优先级。

```
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
```

preload 加载资源后并不会执行，可以安全的预加载 JavaScript。我们一般使用 preload 来主动通知浏览器获取本页的关键资源。现在浏览器都有 Preloader，可以尽早发现大多数基于标记语言的资源，但依然存在一些隐藏在 CSS 和 JavaScript 中的资源，例如字体文件，其为首屏关键资源又隐藏在 CSS 中。这种场景适合使用 preload 进行声明，尽早进行资源加载，避免页面渲染延迟。

preload 的更多细节可参考文章 [Preload: What Is It Good For?](https://www.smashingmagazine.com/2016/02/preload-what-is-it-good-for/)，它适合用来预加载**被隐藏的首屏关键资源**。preload 的兼容性并不理想，目前只有最新版的 chrome 和 safari 才支持。

## 2.2 prefetch

使用 prefetch 声明的资源是对浏览器的提示，暗示该资源可能『未来』会被用到，适用于对可能跳转到的其他路由页面进行资源缓存。被 prefetch 的资源的加载时机由浏览器决定，一般来说优先级较低，会在浏览器『空闲』时进行下载。

```
<link rel="prefetch" href="//example.com/industry-qualification-audit/js/common-main.550d4.chunk.js">
<link rel="prefetch" href="//example.com/industry-qualification-audit/js/Food.86661.chunk.js">
<link rel="prefetch" href="//example.com/industry-qualification-audit/js/Pub.9045b.chunk.js">
<link rel="prefetch" href="//example.com/industry-qualification-audit/js/Screencast.1eb1a.chunk.js">
```

![prefetch-2](/imgs/blog/prefetch-2.png)

从示例图可以看出，prefetch 声明的几个资源在页面关键资源 `main.js` 收到 response 时开始请求。此时确实为浏览器空闲时段，由于关键资源 `main.js` 已被切分，体积小加载快，prefetch 的资源也未发生抢占带宽的现象，实际效果还是比较符合期望的。

prefetch 的兼容性稍好，chrome、firefox、edge、android 4.4+ 都支持，但 safari、IE11-、iOS safari 始终未支持。

## 2.3 async/defer

说到 async 和 defer 先上一张经典的图：

![prefetch-3](/imgs/blog/prefetch-3.png)

`<script async>` 和 `<script defer>` 都可以不阻塞 HTML parsing 进行资源拉取。async 资源下载完毕后立刻执行，defer 资源下载完毕后，在 `DOMContentLoaded` 事件触发前（即浏览器解析 HTML 到 `</body>` 时）执行。两者均不能保证执行顺序。

使用 defer 与将资源直接放到 `</body>` 前加载差距不大，阻塞首屏，这里明显不采用。

使用 async 时要考虑的几点：

1. async 声明的资源下载完毕后立刻执行。webpack 的分片 thunk 必须在首屏 `main.js` 加载完毕后才能正常工作，否则会报 `webpackJSONP` 函数找不到的错，影响用户体验。若将 `<script async>` 写死在 html 中很难保证其在指定时机执行，只有在 `main.js` 中动态创建才算稳妥。
2. async 声明的资源会**推迟页面 onload 事件**。只有在所有 async 声明的资源都拉取完毕后，onload 事件才会触发。如果 async 声明的资源较多，会导致 onload 事件触发时机极大延后。

![prefetch-4](/imgs/blog/prefetch-4.png)

上图为一个包含 async 的生产环境示例，可见在首屏全部元素都载入完毕之后又等了好久，直到 5s 时才触发 onload 事件（红线）。一般来说我们使用 async 声明的资源都是非关键资源，如第三方插件、埋点等等——我们不希望他影响 onload 事件。更多详情可以看参考资料中的文章 [Why loading third party scripts async is not good enough](http://www.aaronpeters.nl/blog/why-loading-third-party-scripts-async-is-not-good-enough)。文章指出，可以手动在 onload 事件中动态创建 `<script async>` 来避免这个副作用。

所有主流浏览器都支持 `<script async>`。

## 2.4 new Image().src

参考 [Preload CSS/JavaScript without execution](http://www.phpied.com/preload-cssJavaScript-without-execution/) 一文， `new Image().src` 不仅能用来预加载图片，也能预加载 CSS 和 JavaScript，且下载完后不会执行。Firefox 不支持该方法，由于其图片与 JavaScript 资源缓存不共用。经过测试，IE、safari、iOS Safari 下使用 `new Image().src` 是可以实现提前加载 JavaScript 资源的功能的。

# 3. 结论

经过分析，资源加载方式简单总结如下：

1. 首屏关键资源：优先级高，使用阻塞方式载入，若有隐藏在 CSS、JavaScript 内部的关键资源（如字体），可使用 `preload` 声明提前开始加载。
2. 首屏非关键资源（第三方插件，如广告、评论、统计、分享）：优先级低，若无执行顺序要求，可使用 async 进行异步加载，但应警惕 onload 事件延迟现象（很多插件和业务逻辑都依赖 onload 事件），若产生了性能问题最好在 onload 事件后手动加载。
3. 非首屏资源（如其他路由的分片 thunk）：优先级最低，可使用 prefetch 声明进行预加载。在 safari、iOS 等不支持 prefetch 的浏览器上，在 onload 事件后手动进行加载。

单页应用的分片 thunk 为非首屏资源，可以采用 prefetch + onload 手动加载的方式实现全平台的预加载。prefetch 可以使用 [preload-webpack-plugin](https://github.com/GoogleChrome/preload-webpack-plugin) 插件自动打入，手动加载既可以在 onload 事件后用 `<script async>` 加载资源，也可以用 `new Image().src` 加载资源，区别仅仅是前者会执行脚本造成些微的性能损耗，而后者看起来比较 hack。

由于手动加载需求，我写了一个插件： [prefetch-polyfill-webpack-plugin](https://github.com/jin5354/prefetch-polyfill-webpack-plugin) 可以自动生成在 onload 事件触发时执行的 prefetch  polyfill 函数，由于其身份是作为 prefetch 的补足，所以仅在 IE、safari、iOS 上执行，使用 `new Image().src` 对分片 thunk 做预加载。

prefetch polyfill 函数示例：
```JavaScript
<script>
  (function(){
    var ua = (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '')
    if(/safari|iphone|ipad|ipod|msie|trident/i.test(ua) && !/chrome|crios|crmo|firefox|iceweasel|fxios|edge/i.test(ua)) {
      window.onload = function () {
        var i = 0, length = 0,
          preloadJs = ['/chunk.a839f9eac501a92482ca.js', ...your thunks]

        for (i = 0, length = preloadJs.length; i < length; i++) {
          new Image().src = preloadJs[i]
        }
      }
    }
  })()
</script>
```
在 safari 上可以看到资源进行预加载：

![prefetch-5](/imgs/blog/prefetch-5.png)

经过这样细致的优化，就可以保证我们的单页应用既有快速的首屏响应时间，又能享受流畅的交互体验了。

# 4. 参考资料

1. [Preload: What Is It Good For?](https://www.smashingmagazine.com/2016/02/preload-what-is-it-good-for/)
2. [Preload, Prefetch And Priorities in Chrome](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf)
3. [config option for adding `async` attribute to script tag?](https://github.com/jantimon/html-webpack-plugin/issues/113)
4. [Why loading third party scripts async is not good enough](http://www.aaronpeters.nl/blog/why-loading-third-party-scripts-async-is-not-good-enough)
5. [Beware of <script async defer> blocking HTML "load" event](https://gist.github.com/jakub-g/5286483ff5f29e8fdd9f)
6. [Preload CSS/JavaScript without execution](http://www.phpied.com/preload-cssJavaScript-without-execution/)
7. [preload-webpack-plugin](https://github.com/GoogleChrome/preload-webpack-plugin)
8. [prefetch-polyfill-webpack-plugin](https://github.com/jin5354/prefetch-polyfill-webpack-plugin)