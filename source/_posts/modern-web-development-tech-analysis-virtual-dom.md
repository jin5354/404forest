title: 现代前端科技解析 —— Virtual DOM
categories:
  - Code
tags:
  - Modern web development tech analysis
  - 现代前端科技解析
  - vue
  - virtual dom
  - ast
toc: true
date: 2019-03-07 11:20:10
---

本文解析 Virtual DOM 在框架中的实际运用：如何构建一个 Virtual DOM，并基于其构建真实 DOM。当 Virtual DOM 结构发生改变时，如何进行 Diff，并更新真实 DOM。

<!-- more -->

> 注：
> 原始链接: https://www.404forest.com/2019/03/07/modern-web-development-tech-analysis-virtual-dom/
> 文章备份: https://github.com/jin5354/404forest/issues/71

# 1. Virtual DOM 概述

- 什么是 Virtual DOM？

Virtual DOM 是一个 JavaScript 数据结构，可以描述真实 DOM 的组织结构。

- 为什么我们需要 Virtual DOM？

React 中没有数据响应式机制，数据更新后框架不知道具体哪里要做修改，而整个组件全部 DOM 重渲染性能又过差。于是提出了 Virtual DOM 概念，将真实 DOM 结构做一层抽象。数据更新时，React 对前后 Virtual DOM 树进行 Diff（创建 Virtual DOM 树成本可比创建真实 DOM 低的多！），准确找出要修改的部分，进行最小化的真实 DOM 修改，提升性能。

然而 Vue 1.0 就实现了数据响应式机制，数据修改时能准确做到『指哪打哪』，只修改关联的 DOM，为什么在 2.0 中也拥抱了 Virtual DOM 呢？加了这样一个中间层必然有成本，带来了什么好处？

1. HTML 模板的高度抽象。受限于 html 语法限制，我们难以复用 HTML 节点；而使用 Virtual DOM，我们能够用 JS 描述 DOM 节点，从而带来了复用 HTML 模板的能力，提高效率。
2. 剥离 HTML Parser，实现框架瘦身，提高运行效率。Vue 2.0 可以在编译时提前将 template 转换成 render 函数，对应使用 runtime 版本的包，这样做减小了 30% 的打包体积，同时将编译步骤提前，提高了运行时效率。
3. 跨平台。抽象出了 Virtual DOM 数据结构后，就可以适配 DOM 之外的渲染目标，如移动端（Weex）。

# 2. Virtual DOM 实现

## 2.1 Virtual DOM 数据结构

本文实现的 Virtual DOM 参考 Vue，结构简化，如下：

```typescript
interface VNode {
  type?: 'Element' | 'Text' | 'Comment',
  tag?: string,
  data?: VNodeData,
  children?: Array<VNode>,
  text?: string,
  elm?: Node  // 对应的真实 DOM 节点
}

interface VNodeData {
  key?: string,
  ref?: string,
  events?: {
    [key: string]: any
  },
  attrs?: {
    [key: string]: any
  },
  rawAttrs?: {
    [key: string]: any
  },
  directives?: {
    [key: string]: any
  }
}
```

## 2.2 Virtual DOM 生成

Virtual DOM 从何而来？前一篇文章所讲的[现代前端科技解析 —— HTML Parser](https://www.404forest.com/2019/03/05/modern-web-development-tech-analysis-html-parser/) 可以将 template 解析为 AST。但是 AST 中只是模板占位符，还需要结合真实数据才是最终结果。于是 Vue 将 template 解析成 AST 后，又将其转换为 render() 函数。将数据传参进去，生成实时的 Virtual DOM。

```typescript
let ASTElement = parse(template)
let render = compileToFunction(ASTElement)
let vdom = render(data)
```

### 2.2.1 compileToFunction

如何将 AST 转换成 render 函数呢？我们看一个 jsx 转换的例子：

转换前：
```html
<ul className=”list”>
  <li>item 1</li>
  <li>item 2</li>
</ul>
```

转换后：
```javascript
React.createElement(‘ul’, { className: ‘list’ },
  React.createElement(‘li’, {}, ‘item 1’),
  React.createElement(‘li’, {}, ‘item 2’),
)
```

简单来看，我们就是把每个 ASTElement 都替换成一个 `createElement` 函数。函数接收参数，返回 vdom 结果。我们首先实现几个 vdom 创建函数：

```typescript
// VNode class
export class VNode {
  type
  tag
  data
  children
  text
  elm

  constructor(
    type?: 'Element' | 'Text' | 'Comment',
    tag?: string,
    data?: VNodeData,
    children?: Array<VNode>,
    text?: string,
    elm?: Node
  ) {
    this.type = type
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
  }
}

// 创建节点
export function createElementVNode(type, tag, data, children, text) {
  return new VNode(type, tag, data, children, text)
}

// 创建注释节点
export function createCommentVNode(str: string) {
  let node = new VNode('Comment')
  node.data = {}
  node.text = str
  return node
}

// 创建空白注释节点
export function createEmptyVNode() {
  return createCommentVNode('')
}

// 创建文本节点
export function createTextVNode(str: string) {
  let node = new VNode('Text')
  node.data = {}
  node.text = str
  return node
}

// 为 vm 安装一些渲染用函数
// 为了显示 render 函数更方便，这里提供一些简写
function installRenderHelpers(vm) {
  vm._c = createElementVNode
  vm._e = createEmptyVNode
  vm._s = createTextVNode
  vm._m = createCommentVNode
}
```
随后使用 `new Function` 生成 render 函数。具体思路就是递归，对每个 ASTElement 进行转换，转换为 `_c()` 这种创建 vdom 的函数调用。

```typescript
let render = compileToFunctions(ASTElement)

// 将 ast 翻译为 render 函数
function compileToFunctions(ast: ASTElement) {

  let code
  if(!ast) {
    // 如果没传 ast，返回一个 空 div vdom
    code = '_c("div")'
  }else {
    code = genElement(ast)
  }

  return new Function(`with(this) {
    return ${code}
  }`)
}

// 将 ASTElement 转换为 function code string
function genElement(el: ASTElement): string {
  switch(el.type) {
    case('Element'): {
      // 对于有 v-if 和 v-for 指令的元素，先处理 if 和 for 的逻辑
      if(el.data.directives.for && !el.forProcessed) {
        return genFor(el)
      }
      if(el.data.directives.if && !el.ifProcessed) {
        return genIf(el)
      }else {
        let data = genData(el)
        let children = genChildren(el)
        return `_c('Element', '${el.tag}', ${data}, ${children})`
      }
    }
    case('Text'): {
      return genText(el.text)
    }
    case('Comment'): {
      return `_m(\`${el.text}\`)`
    }
  }
}

// 处理 v-if 指令，转换为三元操作符
function genIf(el: ASTElement): string {
  el.ifProcessed = true
  return `(${el.data.directives.if}) ? ${genElement(el)} : _e()`
}

// 处理 v-for 指令，转换为 map 函数
function genFor(el: ASTElement): string {
  el.forProcessed = true
  let result = el.data.directives.for.match(/(\w+)\sin\s(\w+)/)
  let iterator = result[1]
  let data = result[2]
  return `...(() => {
    return ${data}.map(${iterator} => {
      return ${genElement(el)}
    })
  })()`
}

// 更多具体见 https://github.com/jin5354/mini-vue/blob/master/src/Compile.ts
```

此处加入了一些对 `v-if`, `v-for` 等指令的处理。理解起来比较容易，对于 `v-if` 的 dom，转换为三元表达式；对于 `v-for` 的 dom，转换为一个 map 函数。

实例：

转换前：
```html
<div class="container">
  <!-- test -->
  <button v-on:click="clickHandler">click me</button>
   <ul :class="testClass" v-if="show">
     <li v-for="city in arr" >{{city}}</li>
   </ul>
 </div>
```
转换后：
```javascript
function render() {
  with(this) {
    return _c('Element', 'div', {attrs: {class: 'container',},events: {},}, [
      _s(`
      `),
      _m(` test `),
      _s(`
      `),
      _c('Element', 'button', {attrs: {},events: {click: clickHandler},}, [
        _s(`click me`)
      ]),
      _s(`
      `),
      // v-if
      (show) ? _c('Element', 'ul', {attrs: {class: testClass,},events: {},}, [
        _s(`
        `),
        // v-for
        ...(() => {
          return arr.map(city => {
            return _c('Element', 'li', {attrs: {},events: {},}, [_s(city)])
          })
        })(),
        _s(`
      `)]) : _e(),_s(`
      `)
    ])
  }
}
```
这样就完成了 render 函数的转换。如果对 Vue 中更详实的 `compileToFunctions` 函数感兴趣，可以查阅源码中的 [CodeGen 部分](https://github.com/vuejs/vue/blob/52719ccab8fccffbdf497b96d3731dc86f04c1ce/src/compiler/codegen/index.js)。

## 2.3 创建真实 DOM

执行编译好的 render 函数，就可以获得 Virtual DOM。基于 Virtual DOM 生成真实 DOM，不难，主要还是深度遍历。核心代码：

```typescript
// 根据 VNode 创建真实 dom，并附着在 VNode.elm 属性上
function createDOM(node: VNode) {
  let $node: Node
  if(node.type === 'Element') {
    $node = document.createElement(node.tag)
    node.children.forEach(e => {
      $node.appendChild(createDOM(e))
    })
    updateProps($node, node.data.attrs, {})
    updateEvents($node, node.data.events, {})
  }
  if(node.type === 'Text') {
    $node = document.createTextNode(node.text)
  }
  if(node.type === 'Comment') {
    $node = document.createComment(node.text)
  }
  node.elm = $node
  return $node
}
```
对 Virtual DOM 根节点调用 createDOM 方法之后，就获得的真实 DOM appendChild 即可。

## 2.4 Diff 算法

Vue 中的 Virtual DOM 算法是基于 [snabbdom](https://github.com/snabbdom/snabbdom) 的一个轻量实现。diff 只在同层级之间进行比较，网上解读 diff 的文章已经足够多了，这里限于篇幅也不再贴出代码，diff 核心代码 100 行左右即可搞定，有兴趣可以看[我自己实现的版本](https://github.com/jin5354/mini-vue/blob/master/src/vdom.ts)。由于 Virtual DOM 对应的真实 DOM 节点已经挂在自己的 elm 属性下面，边遍历就可以边进行真实 DOM 的修改。

diff 思路如下：

![vdom1](/imgs/blog/vdom1.png)

几种常见情况的 diff 过程：

![vdom2](/imgs/blog/vdom2.png)

Vue 中的 diff 源码可见 [patch 部分](https://github.com/vuejs/vue/blob/6fe07ebf5ab3fea1860c59fe7cdd2ec1b760f9b0/src/core/vdom/patch.js)，思路是一致的。

# 3.参考资料

1. [Vue 的理念问题](https://zhuanlan.zhihu.com/p/23752826)
2. [Vue CodeGen](https://github.com/vuejs/vue/blob/52719ccab8fccffbdf497b96d3731dc86f04c1ce/src/compiler/codegen/index.js)
3. [Vue patch](https://github.com/vuejs/vue/blob/6fe07ebf5ab3fea1860c59fe7cdd2ec1b760f9b0/src/core/vdom/patch.js)
4. [snabbdom](https://github.com/snabbdom/snabbdom)
5. [解析vue2.0的diff算法](https://github.com/aooy/blog/issues/2)