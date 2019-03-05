title: 现代前端科技解析 —— HTML Parser
categories:
  - Code
tags:
  - Modern web development tech analysis
  - 现代前端科技解析
  - vue
  - parser
  - ast
toc: true
date: 2019-03-05 21:32:11
---

无论是 Vue 中的 Template 还是 React 中的 JSX，使用框架时，我们都是把 HTML 写在了 JavaScript 里，随后框架解析 HTML 字符串，得到 AST，继而生成 virtual dom。本文解析如何实现一个 HTML Parser，并且简单支持识别 Vue 中的事件、指令。

<!-- more -->

> 注：
> 原始链接: https://www.404forest.com/2019/03/05/modern-web-development-tech-analysis-html-parser/
> 文章备份: https://github.com/jin5354/404forest/issues/70

# 1. 明确 AST 格式

查看 Vue 中解析 Template 得到的 AST 格式，可见源码 [ASTElement](https://github.com/vuejs/vue/blob/dev/flow/compiler.js#L99)。可以看到 Vue 中的 ASTElement 拥有巨多的属性，如 DOM 相关的 tag、attrsList、children、text 等，也有 Vue 相关的 key、static、hasBindings、if 等等。本文实现一个简版的 Parser，定义结果 ASTElement 格式如下：

```typescript
type ASTRoot = ASTElement[]

interface ASTElement {
  // 将元素分为 Element、Text、Comment 三种节点
  type: 'Element' | 'Text' | 'Comment',
  children: ASTElement[],
  // 标签名
  tag: string,
  // 文本内容，Text、Comment 节点有，Element 节点为空
  text: string,
  // 解析后的 attrs 数据
  data: ASTElementData | null,
  parent: ASTElement | ASTRoot
}

interface ASTElementData {
  key? : string,
  ref? : string,
  // 存放 v-on:click 这种事件
  events?: {
    [key: string]: any
  },
  // 存放原生 attrs
  attrs?: {
    [key: string]: any
  },
  // 存放全部 attrs
  rawAttrs?: {
    [key: string]: any
  },
  // 存放 v-if 这种指令
  directives?: {
    [key: string]: any
  }
}

type parse = (html: string) => ASTRoot
```
本文所实现的 parser 接收的 html string 支持多个根节点，返回一个 `ASTRoot`，即 `ASTElement` 数组。举例：

```typescript
//输入：
let template = `<div class="container">
 <p>Text1</p>
</div>`
parse(template)
// 输出：
// 节省篇幅，简略展示
[{
  type: 'Element',
  tag: 'div'
  data: {
    rawAttrs: {
      class: 'container'
    },
    attrs: {
      class: 'container'
    }
  },
  children: [
    {
      type: 'Text',
      text: '\n'
    },
    {
      type: 'Element',
      tag: 'p',
      children: [{
        type: 'Text',
        text: 'Text1'
      }]
    },
    {
      type: 'Text',
      text: '\n'
    }
  ]
}]
```
# 2. 解析字符串

## 2.1 解析的总体思路

一个经典的 HTML Parser 出自 2004 年 Erik Arvidsson 编写的 [SimpleHtmlParser](http://erik.eae.net/simplehtmlparser/simplehtmlparser.js)。Vue 中的 [html-parser](https://github.com/vuejs/vue/blob/6ad99796c747987142c21b45c9361cca60e54e68/src/compiler/parser/html-parser.js) 也是基于此代码改写而成。本文实现的 parser 将按照 SimpleHtmlParser 的思路编写。

我们使用一个栈 `stack` 来维护节点的层级关系，使用变量 `parent` 代指当前的父节点。处理模板字符串时，逐次判断当前节点是否是注释节点，亦或是新进入元素节点、或是遇到节点闭合，最终判断文本节点。每确定当前节点身份，对应生成 AST 节点添加到 parent 节点，维护层级栈（入栈或出栈），并裁掉已处理的节点，继续 parse 剩下的部分，直到模板字符串全部被处理完。详细处理过程如下图所示：

![parse1](/imgs/blog/parse1.png)

以上文例子为例，处理全流程如下：

![parse2](/imgs/blog/parse2.png)

## 2.2 解析自定义 attrs

使用正则可以匹配出某个元素的全部 attrs。对于我们自定义的 v-on，v-if 等指令，无论是使用正则，还是简单的使用 startswith 都可以进行判断。

```typescript
// 处理 attr，解析出 key ref 指令 事件等
function processAttrs(nodeData, attrMap) {
  Object.keys(attrMap).forEach(k => {
    if(k === ':key') {
      nodeData.key = attrMap[k]
    }else if(k === 'key') {
      nodeData.key = '`' + attrMap[k] + '`'
    }else if(k === 'ref') {
      nodeData.ref = attrMap[k]
    }else if(k.startsWith('v-')) {
      if(k.slice(2, 5) === 'on:') {
        nodeData.events[k.slice(5)] = attrMap[k]
      }else {
        nodeData.directives[k.slice(2)] = attrMap[k]
      }
    }else {
      nodeData.attrs[k] = attrMap[k]
    }
  })

  nodeData.rawAttrs = attrMap
}
```

## 2.3 解析实现

按照上述思路，代码实现如下：

```typescript
const START_TAG_REG = /^<([^<>\s\/]+)((\s+[^=>\s]+(\s*=\s*((\"[^"]*\")|(\'[^']*\')|[^>\s]+))?)*)\s*\/?\s*>/m
const END_TAG_REG = /^<\/([^>\s]+)[^>]*>/m
const ATTRIBUTE_REG = /([^=\s]+)(\s*=\s*((\"([^"]*)\")|(\'([^']*)\')|[^>\s]+))?/gm

export class ASTElement {
  type
  children
  tag
  text
  data
  parent

  constructor(
    type: 'Element' | 'Text' | 'Comment',
    children: ASTElement[],
    tag: string,
    text: string,
    data: ASTElementData | null,
    parent: ASTElement | ASTRoot
  ) {
    this.type = type
    this.children = children
    this.tag = tag
    this.text = text
    this.data = data
    this.parent = parent
  }
}

export default function parse(source: string): ASTElement[] {

  let result = {
    children: []
  }
  let stack = []
  let parent: any = null

  stack.push(result)
  parent = result

  while(source.length > 0) {

    // 判断一些节点，如果都不符合按照文本处理
    // 判断接下来要处理的是不是注释 <!-- 开头
    if(source.startsWith('<!--')) {
      // 找注释结尾的位置，找到了，就提取出注释节点
      let endIndex = source.indexOf('-->')
      if(endIndex !== -1) {
        // console.log(`发现注释节点${source.substring(4, endIndex)}`)
        parent.children.push(new ASTElement('Comment', [], '', source.substring(4, endIndex), {}, parent))
        source = source.substring(endIndex + 3)
        continue
      }
    }
    // 判断是不是 end Tag
    else if(source.startsWith('</') && END_TAG_REG.test(source)) {
      let left = RegExp.leftContext
      let tag = RegExp.lastMatch
      let right = RegExp.rightContext

      //console.log(`发现闭合标签 ${tag}`)
      let result = tag.match(END_TAG_REG)
      let name = result[1]

      if(name === parent.tag) {
        stack.pop()
        parent = stack[stack.length - 1]
        // console.log('闭合，出栈')
      }else {
        throw new Error('闭合标签对不上，html 语法出错')
      }
      source = right
      continue
    }
    // 判断是不是 start Tag
    else if(source.charAt(0) === '<' && START_TAG_REG.test(source)) {
      let left = RegExp.leftContext
      let tag = RegExp.lastMatch
      let right = RegExp.rightContext

      let result = tag.match(START_TAG_REG)
      let tagName = result[1]
      let attrs = result[2]
      let attrMap = {}
      let nodeData: ASTElementData = {
        attrs: {},
        events: {},
        directives: {},
        rawAttrs: {}
      }

      // 抽取 attributes
      if(attrs) {
        attrs.replace(ATTRIBUTE_REG, (a0, a1, a2, a3, a4, a5, a6) => {
          let attrName = a1
          let attrValue = a3 || null
          if(attrValue && attrValue.startsWith('"') && attrValue.endsWith('"')) {
            attrMap[attrName] = attrValue.slice(1, attrValue.length - 1)
          }else if(attrValue && attrValue.startsWith("'") && attrValue.endsWith("'")) {
            attrMap[attrName] = attrValue.slice(1, attrValue.length - 1)
          }else {
            attrMap[attrName] = attrValue
          }
          return ''
        })
      }

      processAttrs(nodeData, attrMap)

      // console.log(`发现元素节点${tag}`)
      let element = new ASTElement('Element', [], tagName, '', nodeData, parent)
      parent.children.push(element)
      // 如果不是自闭合 tag，入栈
      if(!tag.endsWith('/>')) {
        stack.push(element)
        parent = element
      }
      source = right
      continue
    }

    // 确认为文字模式，开始识别文本节点
    // console.log('开始识别文字')
    let index = source.indexOf('<', 1)
    if(index == -1) {
      if(parent.children[parent.children.length - 1] && parent.children[parent.children.length - 1].type === 'Text') {
        parent.children[parent.children.length - 1].text += source
      }else {
        parent.children.push(new ASTElement('Text', [], '', source, {}, parent))
      }
      source = ''
    }else {
      if(parent.children[parent.children.length - 1] && parent.children[parent.children.length - 1].type === 'Text') {
        parent.children[parent.children.length - 1].text += source.substring(0, index)
      }else {
        parent.children.push(new ASTElement('Text', [], '', source.substring(0, index), {}, parent))
      }
      source = source.substring(index)
    }
  }
  return result.children
}

// 处理 attr，解析出 key ref 指令 事件等
function processAttrs(nodeData, attrMap) {
  Object.keys(attrMap).forEach(k => {
    if(k === ':key') {
      nodeData.key = attrMap[k]
    }else if(k === 'key') {
      nodeData.key = '`' + attrMap[k] + '`'
    }else if(k === 'ref') {
      nodeData.ref = attrMap[k]
    }else if(k.startsWith('v-')) {
      if(k.slice(2, 5) === 'on:') {
        nodeData.events[k.slice(5)] = attrMap[k]
      }else {
        nodeData.directives[k.slice(2)] = attrMap[k]
      }
    }else {
      nodeData.attrs[k] = attrMap[k]
    }
  })

  nodeData.rawAttrs = attrMap
}
```


# 3.参考资料

1. [vue parser](https://github.com/vuejs/vue/blob/6ad99796c747987142c21b45c9361cca60e54e68/src/compiler/parser/html-parser.js)
2. [simple-html-parser](http://erik.eae.net/simplehtmlparser/simplehtmlparser.js)
