title: 对浏览器首次渲染时间点的探究
categories:
  - Code
tags:
  - first-paint
  - performance
  - eventloop
toc: true
date: 2019-04-23 22:17:10
---

使用 Chrome Devtool 进行性能分析时，在 Performance 面板上，可以看到用绿线标出来的 `First-Contentful-Paint`。浏览器何时进行首次渲染？网上只能查到一些模棱两可的资料，今天我们来探究这个问题。

<!-- more -->

> 注：
> 原始链接: https://www.404forest.com/2019/04/23/when-does-the-browser-first-paint/
> 文章备份: https://github.com/jin5354/404forest/issues/73

# 1. 引子

## 1.1 术语堪明

- 首次渲染
- 首屏时间/首屏渲染

在掘金上用『首次渲染』进行搜索，查不到什么相关资料；使用『首屏时间』进行搜索，能搜出大量性能优化的文章。点进去看可以发现，大家常谈的『首屏时间』是一个业务概念，指的是业务的首屏内容全部渲染完毕的时间点，一般使用埋点进行手动上报。本文探索的则是浏览器进行首次渲染的时间点，此时可能只渲染出了网页的部分内容。

![first-paint4](/imgs/blog/first-paint4.png)
<center>浏览器何时进行首次渲染？</center>

## 1.2 提出场景

举例说明:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>demo</title>
  </head>
  <body>
    <div id="app">
      <p>俺是用来测试首屏渲染的文字。</p>
    </div>
    <script src="./bundle.js"></script>
  </body>
</html>
```

这是一个最常见的单页应用形态。`bundle.js` 下载完后，执行，构建 DOM 树，替换 `div#app` 节点，渲染应用。那么问题来了，这段用来测试首屏渲染的文字，会不会被渲染到屏幕上？查询已有的资料，主要从两个方面讲解：

- 浏览器解析页面流程：
   1. 解析 HTML，构建 DOM 树
   2. 解析 CSS，构建 CSSOM
   3. 合并 DOM 和 CSSOM，构建渲染树（render tree）
   4. 对渲染树进行布局，得到每个节点的位置、尺寸信息
   5. 对渲染树进行绘制。

由于脚本是阻塞 html 解析的，只有下载、执行完，html 解析才宣告结束，此时构建的渲染树是完全的，但也已经不再有测试文字节点了。而在脚本下载、执行完之前，这个『不完整的渲染树』会渲染吗？得不出确切的结论。

- 『需要着重指出的是，这是一个渐进的过程。为达到更好的用户体验，呈现引擎会力求尽快将内容显示在屏幕上。它不必等到整个 HTML 文档解析完毕之后，就会开始构建呈现树和设置布局。在不断接收和处理来自网络的其余内容的同时，呈现引擎会将部分内容解析并显示出来。』 - 来自『浏览器的工作原理：新式网络浏览器幕后揭秘』

这篇讲解浏览器工作内幕的经典文章表示：HTML 解析完毕之前，也是可以进行绘制的，那么测试文字一定就能绘制出来么？依然没有明确的答案，感觉像是浏览器的黑箱。没有办法啦，只能自己去尽量检索了。

# 2. 规范解读

## 2.1 stage1: paint timing 规范

在网上检索『首次渲染』、『when does browser first paint』找不到相关的资料。在搜索时，突然发现一个新的 API [PerformancePaintTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming)，可以通过 `first-paint` 和 `first-contentful-paint` 这两个 `entry name` 来获取首次渲染的时间。赶快去查阅它的[规范](https://w3c.github.io/paint-timing/#mark-paint-timing)：

> 4.1.1. Mark paint timing

> Perform the following steps:
> 1. Let `paint-timestamp` be the input timestamp.

> 2. If this instance of **update the rendering** is the **first paint**, then record the timestamp as paint-timestamp and invoke the §4.1.2 Report paint timing algorithm with two arguments: `"first-paint"` and `paint-timestamp`.

>   > NOTE: First paint excludes the default background paint, but includes non-default background paint.(这里可以发现，默认的白屏不算 first-paint，至少得设个背景色)

> 3. Otherwise, if this instance of **update the rendering** is the **first contentful paint**, then record the timestamp as paint-timestamp and invoke the §4.1.2 Report paint timing algorithm with two arguments: `"first-contentful-paint"` and `paint-timestamp`.

>   > NOTE: This paint must include text, image (including background images), non-white canvas or SVG.(写了字，放了图片，就算 first-contentful-paint 啦)

翻译：如果 `update the rendering` 实例是 `first-paint` 那么就记录时间戳，上报为 `first-paint` 时间。如果 `update the rendering` 实例是 `first-contentful-paint` 那么就记录时间戳，上报为 `first-contentful-paint` 时间。

[`update the rendering`]((https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)是啥？点进去，规范直接跳到了 `eventloop`。恍然大悟，`update the rendering` 不就是 `eventloop` 中的最后一个阶段吗！

![eventloop-1](/imgs/blog/eventloop-1.png)
<center>不熟悉 eventloop 的同学可查阅之前文章：[深入探究 eventloop 与浏览器渲染的时序问题](https://www.404forest.com/2017/07/18/how-javascript-actually-works-eventloop-and-uirendering/)</center>

<br>
原来浏览器对于首次渲染根本就没有什么『黑箱操作』，人家只是老老实实的按照 `eventloop` 来运行而已。`eventloop` 第一次进行到 `update the rendering` 阶段的时间点那就是 `first-paint` 的时间点了。于是我们下一步来研究，HTML 解析过程中，`eventloop` 是怎么运行的？

## 2.2 stage2: eventloop 规范

我们知道 `eventloop` 按照 `task > microtask > render` 的顺序执行。查阅[规范](https://html.spec.whatwg.org/multipage/webappapis.html#concept-task)中关于 `task` 的定义，得：

> The HTML parser tokenizing one or more bytes, and then processing any resulting tokens, is typically a task.

HTML 解析是一个典型的 `task`。`task` 执行完才能 `render`，正如 HTML 解析完才能渲染，很合理。然而经典文章说了，明明可以边解析边绘制的，事情肯定不会这么简单。

## 2.3 stage3: html parser 规范

在 `html parser` 规范中检索 `eventloop` 得：

> ([原文](https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-incdata)很晦涩，这里为了方便理解，直接翻译最核心的几句：)
>
> 当解析到 `</script>` 时：
>
> 如果当前文档存在**阻碍 JS 执行的 CSS** 或者当前的脚本 **不处于 `ready to be parser-executed`** 状态，**spin the event loop**，直到不再存在阻碍 JS 执行的 CSS 且该段脚本处于 `ready to be parser-executed`。

我们已经知道 CSS 的加载是会阻碍 JS 执行的。而脚本不处于这个 `ready to be parser-executed` 状态简单理解就是还没下载完。如果出现这两种情况，脚本就无法立刻执行，需要等待。此时要进行 **spin the eventloop**，查阅[规范](https://html.spec.whatwg.org/multipage/webappapis.html#spin-the-event-loop)，该操作即为：

> （简单翻译）
> 1. 暂存此时正在执行的 task 或 microtask
> 2. 暂存此时的 js 执行上下文堆栈
> 3. 清空 js执行上下文堆栈
> 4. 如果当前正在执行的是 task，执行 microtask checkpoint
> 5. 停止执行当前的 task/microtask。继续执行 eventloop 的主流程。
> 6. 当满足条件时，重新添加之前暂存的 task/microtask，恢复暂存的 js 执行上下文堆栈，继续执行。

简单的说就是让 `eventloop` 中断并暂存当前正在执行的 task/microtask，保持 `eventloop` 的继续执行，待一段时间之后满足条件了再恢复之前的 task/microtask。

那么问题就水落石出了：

**如果在 HTML 解析过程中，『解析到了某个脚本，但这个脚本被 CSS 阻塞住了或者还没下载完』，则会中断暂存当前的解析 `task`，继续执行 `eventloop`，网页被渲染**。

如果 JS 全部是内联的，或者网速好，在解析到`</script>`时脚本全都已下载完了，则解析 task 不会被中断，也就不会出现渲染情况了。

# 3. 实战测试

对于 [1.2](/2019/04/23/when-does-the-browser-first-paint/#1-2-%E6%8F%90%E5%87%BA%E5%9C%BA%E6%99%AF) 中的例子，我们禁用缓存，使用 chrome 模拟 3G 网速，测试结果：

![first-paint1](/imgs/blog/first-paint1.png)
<center>在 bundle.js 加载之前，测试文字被渲染出来了</center>
<br>

![first-paint2](/imgs/blog/first-paint2.png)
<center>`First-Contentful-Paint`在很早的位置</center>
<br>

可验证之前的结论：HTML 解析过程中遇到脚本且脚本处于等待执行状态（被CSS阻塞/没下载完），解析中断，进行渲染。我们开启缓存，不限速，让 bundle.js 走强缓存，瞬间加载：

![first-paint3](/imgs/blog/first-paint3.png)
<center>`First-Contentful-Paint`在 HTML 解析之后</center>
<br>

此时解析 Task 不被中断，渲染只能等到 HTML 解析完成之后再执行啦。

# 4. 题外话

笔者弄清该问题，花了一两个小时，写这篇文章又花了仨小时，查了不少资料，还是小有收获的，比如骨架屏的原理就是在解析中断时提早渲染页面，顺带巩固了 eventloop 和浏览器渲染机制。在 sf 上看到了有人跟我有同样的问题：

![first-paint5](/imgs/blog/first-paint5.png)

哇，遇到同样的探索者真难得！本是开心的准备迎接知识的海洋，然后：

![first-paint6](/imgs/blog/first-paint6.png)

![first-paint8](/imgs/blog/first-paint8.png)

![first-paint9](/imgs/blog/first-paint9.png)

# 5. 参考资料

1. [浏览器的工作原理：新式网络浏览器幕后揭秘](https://www.html5rocks.com/zh/tutorials/internals/howbrowserswork/)
2. [PerformancePaintTiming - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming)
3. [Paint Timing 1 - Editor’s Draft, 24 January 2019](https://w3c.github.io/paint-timing/#mark-paint-timing)
4. [update-the-rendering](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)
5. [深入探究 eventloop 与浏览器渲染的时序问题](https://www.404forest.com/2017/07/18/how-javascript-actually-works-eventloop-and-uirendering/)
6. [concept-task](https://html.spec.whatwg.org/multipage/webappapis.html#concept-task)
7. [html-parser](https://html.spec.whatwg.org/multipage/parsing.html#html-parser)
8. [spin-the-event-loop](https://html.spec.whatwg.org/multipage/webappapis.html#spin-the-event-loop)
9. [浏览器首次渲染页面的时间点是？](https://segmentfault.com/q/1010000008273871)