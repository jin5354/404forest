title: 老生常谈——BFC与haslayout
categories:
  - Code
tags:
  - BFC
  - haslayout
  - HTML
  - CSS
date: 2015-03-18 19:21:00
---
#####关于Layout

“Layout”是一个 IE/Win 的私有概念，它决定了一个元素如何显示以及约束其包含的内容、如何与其他元素交互和建立联系、如何响应和传递应用程序事件/用户事件等。
这种渲染特性可以通过某些 CSS 属性被**不可逆转**地触发。而有些 HTML 元素则默认就具有“layout”。
微软的开发者们认为元素都应该可以拥有一个“属性(property)”(这是面向对象编程中的一个概念)，于是他们便使用了 hasLayout，这种渲染特性生效时也就是将 hasLayout 设成了 true 之时。

当我们说一个元素“得到 layout”，或者说一个元素“拥有 layout” 的时候，我们的意思是指它的微软专有属性 hasLayout 为此被设为了 true 。使用object.currentStyle.hasLayout可获取到ture值，否则将获取到false。一个“layout元素”可以是一个默认就拥有 layout 的元素或者是一个通过设置某些 CSS 属性得到 layout 的元素。
而“无layout元素”，是指 hasLayout 未被触发的元素，比如一个未设定宽高尺寸的干净 div 元素就可以做为一个“无layout祖先”。
给一个默认没有 layout 的元素赋予 layout 的方法包括设置可触发 hasLayout = true 的 CSS 属性。参考默认 layout 元素以及这些属性列表。没有办法设置 hasLayout = false ， 除非把一开始那些触发 hasLayout = true 的 CSS 属性去除。

下列元素应该是默认具有 layout 的:
```
<html>, <body>
<table>, <tr>, <th>, <td>
<img>
<hr>
<input>, <button>, <select>, <textarea>, <fieldset>, <legend>
<iframe>, <embed>, <object>, <applet>
<marquee>
```

<!-- more -->

下列 CSS 属性和取值将会让一个元素获得 layout：

* display: inline-block
* height: (除 auto 外任何值)
* width: (除 auto 外任何值)
* float: (left 或 right)
* position: absolute
* zoom: (除 normal 外任意值)
* writing-mode: tb-rl

IE7特有的触发Layout的属性

* min-height: (任意值)
* min-width: (任意值)
* max-height: (除 none 外任意值)
* max-width: (除 none 外任意值)
* overflow: (除 visible 外任意值，仅用于块级元素)
* overflow-x: (除 visible 外任意值，仅用于块级元素)
* overflow-y: (除 visible 外任意值，仅用于块级元素)
* position: fixed

具有“layout” 的元素如果同时也 display: inline ，那么它的行为就和标准中所说的 inline-block 很类似了：在段落中和普通文字一样在水平方向和连续排列，受 vertical-align 影响，并且大小可以根据内容自适应调整。这也可以解释为什么单单在 IE/Win 中内联元素可以包含块级元素而少出问题，因为在别的浏览器中 display: inline 就是内联，不像 IE/Win 一旦内联元素拥有 layout 还会变成 inline-block。

#####关于BFC

BFC，块格式化上下文( Block formatting context )，是指初始化块级元素定义的环境。在CSS中，元素定义的环境有两种，一种是块格式化上下文( Block formatting context )，另一种是行内格式化上下文( Inline formatting context )。

触发条件如下：

* 浮动元素（float除了none）
* 绝对定位元素(absolute/fixed)
* 设置了’display’ 属性为 “inline-block”，”table-cell”， “table-caption” 的元素
* 设置了overflow 非 “visible”的元素