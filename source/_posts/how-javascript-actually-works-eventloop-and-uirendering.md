title: 深入探究 eventloop 与浏览器渲染的时序问题
categories:
  - Code
tags:
  - how-javascript-actually-works
  - eventloop
  - requestAnimationFrame
toc: true
date: 2017-7-18 10:38:11
---

在上篇文章[《现代前端科技解析 —— 数据响应式系统 (Data Reactivity System)》](https://www.404forest.com/2017/06/28/modern-web-development-tech-analysis-data-reactivity-system/)中我们用到了 `nextTick` 函数，该函数使用 `MutationObserver` 实现了『异步』更新。我们工作中也常用 `setTimeout(fn, 0)` 来实现任务的『延迟』执行。本文以次为引，结合浏览器渲染，全面解析一轮 `eventloop(事件循环)` 各步骤的执行时序问题。

<!-- more -->

> 原始链接: https://www.404forest.com/2017/07/18/how-javascript-actually-works-eventloop-and-uirendering/
> 文章备份: https://github.com/jin5354/404forest/issues/61

# 1. 引子：那些『延迟』执行的函数们

先列举几个会『延迟』执行的函数：

- setTimeout(callback, 0)           // 延迟时间为 0 的定时器
- Promise.resolve().then(callback)  // 立刻决议的 Promise
- requestAnimationFrame(callback)   // 下次重绘时执行

如果这些函数一起使用，你能猜出结果吗？

```javascript
// requestAnimationFrame 是个非常麻烦的主，我们一会儿再讨论

console.log('A')

setTimeout(() => {
  console.log('B')
}, 0)

Promise.resolve().then(() => {
  console.log('C')
}).then(() => {
  console.log('D')
})

console.log('E')
```
结果是：
```javascript
A
E
C
D
B
```
[在线示例](https://jsfiddle.net/jin5354/1psfcazk/)

# 2. 挖掘 eventloop 规范

为了协调事件、用户交互、脚本、UI 渲染、网络请求，用户代理必须使用 eventloop。我们在 HTML5 规范中找到 [eventloop 相关章节](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)，查看每轮 eventloop 是如何执行的。

将关键点翻译成中文：

>An event loop must continually run through the following steps for as long as it exists:
>1. Let oldestTask be the oldest task on one of the event loop's task queues, if any, ignoring, in the case of a browsing context event loop, tasks whose associated Documents are not fully active. The user agent may pick any task queue. If there is no task to select, then jump to the microtasks step below.
>2. Set the event loop's currently running task to oldestTask.
>3. Run oldestTask.
>4. Set the event loop's currently running task back to null.
>5. Remove oldestTask from its task queue.

1-5. 从 task 队列（一个或多个）中选出最老的一个 task，执行它。

>6\. Microtasks: Perform a microtask checkpoint.

6\. 执行 microtask 检查点。简单说，会执行 microtask 队列中的所有 microtask，直到队列为空。如果 microtask 中又添加了新的 microtask，直接放进本队列末尾。

>7\. Update the rendering: If this event loop is a browsing context event loop (as opposed to a worker event loop), then run the following substeps.
>  1. Let now be the value that would be returned by the Performance object's now() method. [HRT]
>  2. Let docs be the list of Document objects associated with the event loop in question, sorted arbitrarily except that the following conditions must be met:
>  3. If there are top-level browsing contexts B that the user agent believes would not benefit from having their rendering updated at this time, then remove from docs all Document objects whose browsing context's top-level browsing context is in B.
>  4. If there are a nested browsing contexts B that the user agent believes would not benefit from having their rendering updated at this time, then remove from docs all Document objects whose browsing context is in B.
>  5. For each fully active Document in docs, run the resize steps for that Document, passing in now as the timestamp. [CSSOMVIEW]
>  6. For each fully active Document in docs, run the scroll steps for that Document, passing in now as the timestamp. [CSSOMVIEW]
>  7. For each fully active Document in docs, evaluate media queries and report changes for that Document, passing in now as the timestamp. [CSSOMVIEW]
>  8. For each fully active Document in docs, run CSS animations and send events for that Document, passing in now as the timestamp. [CSSANIMATIONS]
>  9. For each fully active Document in docs, run the fullscreen steps for that Document, passing in now as the timestamp. [FULLSCREEN]
>  10. For each fully active Document in docs, run the animation frame callbacks for that Document, passing in now as the timestamp.
>  11. For each fully active Document in docs, run the update intersection observations steps for that Document, passing in now as the timestamp. [INTERSECTIONOBSERVER]
>  12. For each fully active Document in docs, update the rendering or user interface of that Document and its browsing context to reflect the current state.

7\. 执行 UI render 操作：
7.1-7.4. 判断 document 在此时间点渲染是否会『获益』。浏览器只需保证 60Hz 的刷新率即可（在机器负荷重时还会降低刷新率），若 eventloop 频率过高，即使渲染了浏览器也无法及时展示。所以**并不是每轮 eventloop 都会执行 UI Render**。
7.5-7.9. 执行各种渲染所需工作，如 触发 resize、scroll 事件、建立媒体查询、运行 CSS 动画等等
**7.10. 执行 animation frame callbacks**
7.11. 执行 IntersectionObserver callback
7.12. 渲染 UI

用一张图来概括整体流程：

![eventloop-1](/imgs/blog/eventloop-1.png)

## 2.1 task(macrotask)

何为 task？task 又称 macrotask。我们查看 HTML 规范中 task 的有关章节 [webappapis.html#concept-task](https://html.spec.whatwg.org/multipage/webappapis.html#concept-task)。

> 一个 eventloop 有一或多个 task 队列。每个 task 由一个确定的 task 源提供。从不同 task 源而来的 task 可能会放到不同的 task 队列中。例如，浏览器可能单独为鼠标键盘事件维护一个 task 队列，所有其他 task 都放到另一个 task 队列。通过区分 task 队列的优先级，使高优先级的 task 优先执行，保证更好的交互体验。

task 源包括：（[webappapis.html#generic-task-sources](https://html.spec.whatwg.org/multipage/webappapis.html#generic-task-sources)）

- DOM 操作任务源：如元素以非阻塞方式插入文档
- 用户交互任务源：如鼠标键盘事件。用户输入事件（如 click） 必须使用 task 队列
- 网络任务源：如 XHR 回调
- history 回溯任务源：使用 history.back() 或者类似 API

此外 setTimeout、setInterval、IndexDB 数据库操作等也是任务源。总结来说，常见的 task 任务有：

- 事件回调
- XHR 回调
- IndexDB 数据库操作等 I/O
- setTimeout / setInterval
- history.back

## 2.2 microtask

看规范 [webappapis.html#microtask](https://html.spec.whatwg.org/multipage/webappapis.html#microtask)：每一个 eventloop 都有一个 microtask 队列。microtask 会排在 microtask 队列而非 task 队列中。

一般来说，microtask 包括：

- Promise.then
> [Promise 规范](https://promisesaplus.com/#notes)中提及 Promise.then 的具体实现由平台把握，可以是 microtask 或 task。当前的共识是使用 microtask 实现。
- MutationObserver
- Object.observe
- process.nextTick

现在再来看前面的例子，就很清晰了：

```javascript
//步骤1： 开始执行首个 eventloop 的 task 阶段
console.log('A') // 步骤2：**输出 A**

setTimeout(() => {  // 步骤3：立刻将 callback（B） 放入 task 队列中
  console.log('B')
}, 0)

Promise.resolve().then(() => {  // 步骤4：立刻将 callback（C） 放入 microtask 队列中
  console.log('C')
}).then(() => {
  console.log('D')
})

console.log('E') // 步骤5：**输出 E**

// 步骤6：首个 eventloop 的 task 阶段执行完毕，开始执行 microtask，发现有一个 callback（C），执行之，**输出 C**，同时又将 callback（D）放入 microtask 队列中
// 步骤7：发现 microtask 队列不为空，执行 callback（D），**输出 D**
// 步骤8：microtask 队列为空，执行 UI render，（根据机器负荷等环境影响，综合浏览器策略，此步骤可能执行也可能不执行）
// 步骤9：首次 eventloop 结束。执行第二轮 eventloop，取出一个 task callback（B），执行之，**输出 B**
```
# 3. microtask 的执行时机

在一些文章中将 requestAnimationFrame 划分为 task，理由是假如你在 requestAnimationFrame 的 callback 中注册了 microtask 任务，你会发现该 microtask 任务会在 requestAnimationFrame 的 callback 结束后立刻执行。

[在线示例](https://jsfiddle.net/jin5354/z2wdvkmw/)

```javascript
setTimeout(() => {
  console.log('A')
}, 0)
requestAnimationFrame(() => {
  console.log('B')
  Promise.resolve().then(() => {
    console.log('C')
  })
})
```
结果：
```javascript
B
C
A
// 有可能出现 A B C 的情况，本节讨论的重点在于 B C 一定紧挨着输出
```
使用 devtool 查看运行情况：(本图引自[资料3](#7-参考资料))

![eventloop-2](/imgs/blog/eventloop-2.jpg)

可以看到 requestAnimationFrame 中注册的 microtask 并没有在下一轮 eventloop 的 task 之后执行，而是直接在本轮 eventloop 中紧跟着 requestAnimationFrame 执行了。起初我认为规范明摆着表明 eventloop 由执行 task、执行 microtask、UI render 三部分构成，从属于 render 阶段的 requestAnimationFrame 说是 task 怎么不大合适。但是多检索了一下，发现 W3C 工作组在 2015 年 9 月 22 日的一篇工作笔记[《Timing control for script-based animations》](https://www.w3.org/TR/animation-timing/) 中提到了 `animation task source` 这一概念，在该文中，确实将 animation frame request callback list 中的 callback 作为 task 处理。另外，在 [zone.js 中也将 requestAnimationFrame 划进 macrotask 分类中](https://github.com/angular/zone.js/blob/e9f68bedcba044cb0be1a4fbf41fb35b62ca9f25/STANDARD-APIS.md)。但 whatwg 规范中对 requestAnimationFrame callback 未明确出现任何 task 相关字眼，由于 whatwg 和 w3c 的分歧，我对 requestAnimationFrame 是否该划分为 task 存保留意见。

我们再研究下 microtask 的执行时机。

eventloop 规范的第 6 步直接表明，task 执行后执行 microtask。我们在 html 规范中进行检索，可以发现，在这些时刻都会 perform a microtask checkpoint：

![eventloop-7](/imgs/blog/eventloop-7.png)

举例：

- Calling scripts - Clean up after running script (whatwg 规范)
- Calling scripts - clean up after running a callback (w3c 规范)
- Creating and inserting nodes
- Parsing XML documents

在 `Calling scripts` 的清理阶段，如果 javascript 执行栈为空，也会 `perform a microtask checkpoint`，即执行 microtask。联系[《Tasks, microtasks, queues and schedules》](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)文中的解释：

> ... The microtask queue is processed after callbacks as long as no other JavaScript is mid-execution, and at the end of each task.

在 callback 执行完，若没有其他 javascript 正在执行中（javascript 执行栈为空），microtask 队列会被处理，与在 task 结束后一样。从这里可知，**microtask 虽也是延迟任务，但是它的执行时机『见缝插针，尽可能早』——只要 javascript 执行栈为空，就会执行 microtask。eventloop 中的第 6 步只是这种策略的其中一种场景而已。**

深入 requestAnimationFrame 的执行过程也能发现：[在执行 animation frame callbacks 时，会唤起 callback（invoke the callback）](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames)，[在唤起 callback 的最后一步，会 clean up after running a callback](https://heycam.github.io/webidl/#invoke-a-callback-function)，此时若满足 javascript 执行栈为空的条件，则执行 microtask。

也就是说一轮 eventloop 中有可能执行多次 microtask。

有一个非常非常有趣的例子可以佐证这个观点，请务必看一下：

我们构建一个嵌套 DOM。为这两个 DOM 绑定相同的 click 回调函数，我们点击内部 DOM 时，由于事件冒泡，内部和外部的 onClick 会依次触发。

```html
<div class="outer">
  <div class="inner"></div>
</div>
```
```javascript
let $outer = document.querySelector('.outer')
let $inner = document.querySelector('.inner')

function onClick() {
  console.log('click!')
  setTimeout(() => {
    console.log('setTimeout!')
  }, 0)
  Promise.resolve().then(() => {
    console.log('Promise!')
  })
}

$outer.addEventListener('click', onClick)
$inner.addEventListener('click', onClick)

//$inner.click() 在第二个测试中，我们通过 Javascript 触发 click 事件
```
在第一个测试中，我们通过点击内部 DOM，让浏览器去派发 click 事件。
在第二个测试中，我们通过 Javascript 触发 click 事件。猜猜输出结果有什么不同？

![eventloop-3](/imgs/blog/eventloop-3.png)

[在线示例A](https://jsfiddle.net/jin5354/gbw2n8bs/) [在线示例B](https://jsfiddle.net/jin5354/t86cxb29/)

第一个测试的结果：

```javascript
click!
Promise!
click!
Promise!
setTimeout!
setTimeout!
```

第二个测试的结果：

```javascript
click!
click!
Promise!
Promise!
setTimeout!
setTimeout!
```
我简单的画下时序图：

第一个测试：

![eventloop-4](/imgs/blog/eventloop-4.png)

第二个测试：

![eventloop-5](/imgs/blog/eventloop-5.png)

测试结果很有趣的佐证了『只要 javascript 执行栈为空，就会执行 microtask』的观点。

# 4. requestAnimationFrame callback 的执行时机

执行 requestAnimationFrame callback 是 UI Render 的其中一步。上文已经提到过并不是每轮 eventloop 都会执行 UI Render。我们仔细看文档：

> For example, if the browser is attempting to achieve a 60Hz refresh rate, then these steps are only necessary every 60th of a second (about 16.7ms). If the browser finds that a top-level browsing context is not able to sustain this rate, it might drop to a more sustainable 30Hz for that set of Documents, rather than occasionally dropping frames. (This specification does not mandate any particular model for when to update the rendering.) Similarly, if a top-level browsing context is in the background, the user agent might decide to drop that page to a much slower 4Hz, or even less.

如果浏览器试图实现 60Hz 的刷新率，那么 UI Render 只需要每秒执行 60 次（每 16.7 ms）。如果浏览器发现『顶层浏览器上下文』无法维持住这个频率，可能会下调到可维持的 30Hz，而不是掉帧。（本规范并不对何时进行 render 做任何规定。）类似的，如果一个顶层浏览器上下文在后台运行，用户代理可能决定将该页面的刷新率降到 4Hz，甚至更低。

由于规范没有做约定，所以浏览器在 render 策略上有充分的自主性。既有可能出现每一轮 eventloop 后都 render 的现象，也有可能出现几十轮 eventloop 都不 render 的情况。

我写了一个简单的测试，[在线测试](https://jsfiddle.net/jin5354/3d99fmr6/)

```javascript
const startingTimePoint = Date.now()

console.log(Date.now() - startingTimePoint, 'A console')

setTimeout(() => {
  console.log(Date.now() - startingTimePoint, 'B setTimeout')
}, 0)
setTimeout(() => {
  console.log(Date.now() - startingTimePoint, 'F setTimeout')
}, 0)

Promise.resolve().then(() => {
  console.log(Date.now() - startingTimePoint, 'C promise')
})

requestAnimationFrame(() => {
  console.log(Date.now() - startingTimePoint, 'D raf')
})

console.log(Date.now() - startingTimePoint, 'E console')

block(200)

function block(time){  //假装我是一个耗时任务
  const now = Date.now()
  while(Date.now() - now < time) {}
}
```

![eventloop-6](/imgs/blog/eventloop-6.png)

在 chrome 下比较稳定，requestAnimationFrame callback 始终在第一个 eventloop 时执行，而在 Firefox 下结果就是可变的，多刷新几次会得到不同的结果。这也表明了不同浏览器的 render 策略是不同的。

# 5. 总结

1. 每个 eventloop 由三个阶段构成：执行一个 task，执行 microtask 队列，可选的 ui render 阶段，requestAnimationFrame callback 在 render 阶段执行。我们平时写的逻辑代码会被分类为不同的 task 和 microtask。
2. microtask 中注册的 microtask 事件会直接加入到当前 microtask 队列。
3. microtask 执行时机『尽可能早』，只要 javascript 执行栈为空，就会执行。一轮 eventloop 中，可能执行多次 microtask。
4. requestAnimationFrame callback 的执行时机与浏览器的 render 策略有关，是黑箱的。

# 6. 闲谈 whatwg 与 w3c

你可能发现文中的规范引用多数来自 whatwg，少数来自 w3c。html 规范目前由两个工作组 whatwg 和 w3c 制定，whatwg 制定的叫『HTML Living Standard』，背后是 Opera、Mozilla、Chrome、Safari 等大佬。 w3c 制定的叫『HTML5』，其为经典的万维网联盟，背靠微软，曾在 html 标准制定上拥有绝对话语权二十余年（目前正惨遭 whatwg 嫌弃）。二者时而分歧，时而合作，搞出了两套 HTML 规范。我们在挖掘规范时，需要综合的来看待。

（本文的论点主要依赖于 whatwg 规范）

# 7. 参考资料

1. [Philip Roberts: What the heck is the event loop anyway? | JSConf EU 2014](https://www.youtube.com/watch?v=8aGhZQkoFbQ&t=3s)
2. [event-loop-processing-model](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
3. [从event loop规范探究javaScript异步及浏览器更新渲染时机](https://github.com/aooy/blog/issues/5)
4. [Promises/A+](https://promisesaplus.com/#notes)
5. [浏览器渲染详细过程：重绘、重排和 composite 只是冰山一角](https://juejin.im/entry/590801780ce46300617c89b8)
6. [Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
7. [从Promise来看JavaScript中的Event Loop、Tasks和Microtasks](https://github.com/creeperyang/blog/issues/21)
8. [Timing of microtask triggered from requestAnimationFrame](https://github.com/whatwg/html/issues/2637)
9. [When will requestAnimationFrame be executed?](https://stackoverflow.com/questions/43050448/when-will-requestanimationframe-be-executed)
10. [Angular 2とZone.jsとテストの話](http://qiita.com/Quramy/items/83f4fbc6755309f78ad2)
11. [Zone.js's support for standard apis](https://github.com/angular/zone.js/blob/e9f68bedcba044cb0be1a4fbf41fb35b62ca9f25/STANDARD-APIS.md)
12. [Writing a JavaScript framework - Execution timing, beyond setTimeout](https://blog.risingstack.com/writing-a-javascript-framework-execution-timing-beyond-settimeout/)
13. [揭开HTML 5制定者的面纱：多方利益的“缠斗体”W3C](http://www.10tiao.com/html/216/201412/202402284/5.html)