title: React flow：React 渲染流程图解
categories:
  - Code
tags:
  - react
  - fiber
toc: true
date: 2019-06-02 20:28:10
---

本文用图梳理了 react 的工作原理，需配合源码食用。

<!-- more -->

> 注：
> 原始链接: https://www.404forest.com/2019/06/02/react-flow/
> 文章备份: https://github.com/jin5354/404forest/issues/74

总体流程与 Vue 非常相似，毕竟都是 View = f(Model) 思想的界面渲染框架。最大的不同点就是 React 16 后引入的 Fiber 机制，将传统的 Virtual Dom dfs 遍历变成了三向链表的循环遍历。同时将 patch 部分拆为了 render 和 commit 两个阶段。

# 1. 一图胜千言

![react](/imgs/blog/react-flow.png)

# 2. async render

Fiber 机制为我们带来了新的 concurrent mode，可以让任务按优先级执行。不过按作者 [@Andrew Clark 所说](https://twitter.com/acdlite/status/978412930973687808)，虽然从2017年 Fiber 代码刚开始写就包含了这部分内容，源码也能大量见到 scheduler 相关的字样，但 async render 直到今天还在试验阶段，api 未公开，目前的全部渲染依然走 sync 模式。 [React 16.x Roadmap](https://reactjs.org/blog/2018/11/27/react-16-roadmap.html) 表示今年 Q2 会公开 concurrent mode，等正式版出了再写篇原理梳理好了。

# 3. 参考资料

1. [react 源码](https://github.com/facebook/react/)
2. [深入剖析 React Concurrent](https://zhuanlan.zhihu.com/p/60307571)
3. [react16-fiber协调算法](http://echizen.github.io/tech/2019/04-06-react-fiber)
4. [visualization async rendering in React](https://twitter.com/acdlite/status/978412930973687808)
5. [React 16.x Roadmap](https://reactjs.org/blog/2018/11/27/react-16-roadmap.html)
6. [Scheduling in React](https://philippspiess.com/scheduling-in-react/)