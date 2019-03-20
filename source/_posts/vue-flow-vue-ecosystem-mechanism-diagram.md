title: Vue flow： Vue 生态工作机制图解
categories:
  - Code
tags:
  - vue
  - vuex
  - vue-router
toc: true
date: 2019-03-20 16:22:10
---

本文用图梳理了 vue、vue-router、vuex 的工作原理，需配合源码食用。

<!-- more -->

> 注：
> 原始链接: https://www.404forest.com/2019/03/20/vue-flow-vue-ecosystem-mechanism-diagram/
> 文章备份: https://github.com/jin5354/404forest/issues/72

深入理解一个框架最好的方法莫过于阅读源码。笔者最近将 vue、vue-router、vuex 的源码过了一遍，小有收获。本篇文章并不会讲解源码，因为网上已经有了多个优秀的源码讲解系列，如 [Vue.js 技术揭秘](https://ustbhuangyi.github.io/vue-analysis/) 或者 [read-vue-source-code](https://github.com/numbbbbb/read-vue-source-code)，重复工作并没有什么意义。不过，上述两系列文章讲解细腻篇幅长，容易看了后面忘前面，来来回回找思路，遂整理图解，望能一图流宏观掌控框架机理，想必是极好的。

含有源码内名词，请搭配[框架源码或源码解析文章](/2019/03/20/vue-flow-vue-ecosystem-mechanism-diagram/#4-参考资料)使用。不过，如果是娴熟的 Vue 使用者，想必不看源码也能理解个七七八八 : )。图片较大，需要右键到新窗口查看。

# 1. vue-router

![vue-router](/imgs/blog/vue/vue-router.png)

# 2. vuex

![vuex](/imgs/blog/vue/vuex.png)

# 3. vue

![vue-flow](/imgs/blog/vue/flow.png)

# 4. 参考资料

1. [vue 源码](https://github.com/vuejs/vue)
2. [vue-router 源码](https://github.com/vuejs/vue-router)
3. [vuex 源码](https://github.com/vuejs/vuex)
4. [Vue.js 技术揭秘](https://ustbhuangyi.github.io/vue-analysis/)
5. [Read Vue Source Code](https://github.com/numbbbbb/read-vue-source-code)
6. [Vue技术内幕](http://hcysun.me/vue-design/)
7. [现代前端科技解析 —— Virtual DOM](https://www.404forest.com/2019/03/07/modern-web-development-tech-analysis-virtual-dom/)
8. [现代前端科技解析 —— HTML Parser](https://www.404forest.com/2019/03/05/modern-web-development-tech-analysis-html-parser/)