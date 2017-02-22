title: 使用 Rx 流式处理数据
categories:
  - Code
tags:
  - Rx.js
  - Rx
toc: true
date: 2017-2-17 15:32:11
---

最近频繁用到 Vue 的计算属性（`computed property`），对其背后 Reactive Programming 的思想很感兴趣。所以去了解了下 RP 思想与它的优秀的 JavaScript 实现：RxJS。这是一篇简单的 Rx 入门文章。

<!-- more -->

## 1. 流（stream）

RP 使用异步数据流（Asynchronous event stream）进行编程。什么是异步数据流？想象一下我们如何使用 DOM 事件来获取 DOM 的状态变化：

HTML:
```html
<input>
```

JavaScript:
```javascript
$('input').on('keyup', handleKeyup)

function handleKeyup(e) {
  ...
}
```

每当 `input` 节点触发 `keyup` 事件时，我们即可获得 `keyup` 事件的 `event` 对象，随后通过 `handleClick` 方法对 `event` 对象进行操作，最终得出 `result`。DOM 事件的监听是持续的，多次触发 `keyup` 事件，这个流程就会多次执行，绘图如下：

![rx2](/imgs/blog/rx2.png)

流（stream）其实就是一个**按时间排序的 Events 序列（Ongoing events ordered in time）**，在 Web 中，流可能就是一系列的鼠标点击事件、也可能是 setInterval 生产的 / websocket 拉来的一系列数据等。Event buses 本质上就是异步事件流（Asynchronous event stream），你可以监听并处理这些事件。在 Rx 中，任何东西都可以是一个流：变量、用户输入、数据结构等。你可以监听流的变动并做出响应。处理流就如同处理一个 Array 一样简单——你可以对流应用 forEach、map、filter、merge 等等操作。除此之外， Rx 还提供了更多令人惊艳的操作符。

监听流也被称为订阅（Subscribing），这里使用的就是观察者模式。

## 2. 观察者模式

观察者模式(Observer Pattern)：定义对象间的一种一对多依赖关系，使得每当一个对象状态发生改变时，其相关依赖对象皆得到通知并被自动更新。

让我们观察一个处理异步请求的场景——从服务器端拉取数据并进行处理，我们已经很擅长使用 Callback 和 Promise 来解决这种问题了：

Callback:
```javascript
function getResultFromServer(term, callback) {
  return $.ajax({
    url: 'http://en.wikipedia.org/w/api.php',
    dataType: 'jsonp',
    data: {
      action: 'opensearch',
      format: 'json',
      search: term,
      _: '1'
    },
    success: (data) => {
      callback(data)
    }
  })
}

getResultFromServer('hello', (data) => {
  console.log(data)
})
```

Promise:
```javascript
function getResultFromServer(term) {
  return $.ajax({
    url: 'http://en.wikipedia.org/w/api.php',
    dataType: 'jsonp',
    data: {
      action: 'opensearch',
      format: 'json',
      search: term,
      _: '1'
    }
  }).promise()
}

getResultFromServer('hello').then(data => {
  console.log(data)
})
```

让我们试一试使用观察者模式来处理这个异步请求：

```javascript
function getResultFromServer(term) {
  return $.ajax({
    url: 'http://en.wikipedia.org/w/api.php',
    dataType: 'jsonp',
    data: {
      action: 'opensearch',
      format: 'json',
      search: term,
      _: '1'
    },
    success: (data) => {
      $(document).trigger('getData', data)
    }
  })
}

$(document).on('getData', (data) => {
  console.log(data)
})

getResultFromServer('hello')
```

从上可知，观察者模式同样可以很好的处理异步请求。同时与 promise 相比可以发现：promise 的 then 方法只能调用一次；而观察者模式其实可以多次订阅事件，当新数据到达时所有订阅者都将收到通知。

## 3. 数据流水线（数据管道）

让我们看一个例子：

![rx4](/imgs/blog/rx4.png)

这是一个每天都被使用数亿次的组件——百度的搜索框。当输入搜索字符时，会拉取预测搜索字段，并以下拉列表的形式展示。这个功能应该如何实现？

略加思考即可得到大致思路：从 DOM 中获取数据 -> 发起 ajax 请求 -> 得到预测搜索字段 -> 渲染为 DOM -> 插入文档流。如下图所示：

![rx5](/imgs/blog/rx5.png)

其实，我们平时所做的每一个需求，都可以抽象成为一系列数据的流动：

- 获取原始数据——加工——得到所需结果

对于可变的数据则为：

- 订阅数据源——观察变化、自动加工——更新结果

简单讲如下图所示：

![rx6](/imgs/blog/rx6.png)

我们所看到的每一个页面，背后都是一条条的数据加工流水线。让我们看一下使用 Rx 来解决上文需求的代码：

```javascript
let app$ = Rx.Observable
            .fromEvent(document.querySelector('input'), 'keyup')  //观察 keyup 事件触发时的 event 对象流
            .pluck('target', 'value')   //拿到 event.target.value 值，即输入内容
            .switchMap((term) => Rx.Observable.fromPromise(getResultFromServer(term))) //发起请求，并观察响应结果数据流，使用其替换掉当前流
            .do(generateDOM) //根据结果生成 DOM 并插入文档
            .subscribe()   //开始订阅，打开流水线开关
```

可以看到，使用 Rx 写出的是一串链式操作代码，将该业务需求简明易懂的抽象成了一条数据流水线。该需求的原始数据来源、加工过程、最终输出结果都被封装到了一起，实现了优雅、高内聚的业务逻辑抽象。这种思考方式提高了代码的抽象层级，你可以只关注定义了业务逻辑的那些相互依赖的事件，并非纠缠于大量的实现细节。

现在的页面往往存在着各种各样的实时 Events 来给用户提供具有较高交互性的体验，复杂度的增加对代码的可读性、可维护性带来了新的挑战。而 Rx 则是一个新的工具来帮助我们应对复杂度问题。

## 4. 强大的异步处理

通过上面的例子，我们已经可以看到 Rx 对于抽象业务逻辑的能力。然而 Rx 的功能远远不止于此，它提供的一系列操作符可以非常方便的实现强大的异步处理功能。

上一步我们编写的搜索框只实现了最基本的 Autocomplete 功能。假设我们要对其进行优化：

1. 只有在 500ms 内没有输入新内容时才发送请求，避免在连续快速输入时发送出过多请求，避免无用请求（即 debounce）；
2. 按下方向键、alt 键等也会触发 keyup 事件，此时不应发送新请求，过滤掉这种情况；
3. 从服务器拉取数据不成功时，自动重试最多3次。
4. 避免 Promise 竞态问题（假设用户输入内容“小说”，随后改成“动画”，由于网络原因“动画”的候选结果先返回，“小说”的候选结果后返回，用户最终看到的是“小说”的响应结果）（问题的根源在于 Promise 无法取消）。

如果不借助 Rx，实现上述3个需求还是比较繁琐的。实现 debounce 功能需要自己定义计时器，在每次 keyup 事件触发后进行时间监测；实现 2 功能需要缓存上一次请求时的搜索内容，发送新请求时进行内容对比，内容有变化时再发送请求；Promise 的超时重试也需要一定代码量。

使用 Rx 的操作符，只需这样写：

```javascript
let app$ = Rx.Observable
            .fromEvent(document.querySelector('input'), 'keyup')
            .pluck('target', 'value')
            .debounceTime(500)  // 加入 debounce 特性，停止输入 500ms 之后再发送请求
            .distinctUntilChanged() //内容不变时不再继续流水线
            .switchMap((term) => Rx.Observable.fromPromise(getResultFromServer(term)).retry(3)) // 对 Promise 加入重试3次操作，switchMap 后前面的请求会被自动 cancel 掉，天然避免竞态问题
            .do(generateDOM)
            .subscribe()
```

借助 debounceTime、distinctUntilChanged、retry 操作符，上述4个功能的实现就非常简单。这个示例仅为 Rx 强大功能的冰山一角。Rx 中共有百余个操作符，帮助你应对各种异步处理操作。

## 5. 结语

本文通过一个简单的示例来展示 Rx 强大的逻辑抽象能力和异步处理能力。Rx 可以与框架同时使用，有对应的库来做 binding 工作： [rx-react](https://github.com/fdecampredon/rx-react), [vue-rx](https://github.com/vuejs/vue-rx)。实时性强、异步操作多的场景下更适合使用 Rx。更多 API 可以查阅参考资料中的 ReactiveX 文档。 Enjoy Rx！

## 6. 参考资料

1. [RxJS](https://github.com/Reactive-Extensions/RxJS)
2. [ReactiveX](http://reactivex.io/)
3. [流动的数据——使用 RxJS 构造复杂单页应用的数据逻辑](https://github.com/xufei/blog/issues/38)
4. [The introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)
5. [构建流式应用—RxJS详解](https://github.com/joeyguo/blog/issues/11)
6. [vue-rx example](https://github.com/vuejs/vue-rx/blob/master/example/wiki-search.html)
