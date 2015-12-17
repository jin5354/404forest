title: 理解flex属性——flex-grow、flex-shrink、flex-basis都是干啥的
categories:
  - Code
tags:
  - CSS
  - flex
date: 2015-12-17 16:53:21
coverImage: code.jpg
thumbnailImage: code-small.jpg
coverMeta: out
---

flex的大部分属性都简明易懂，比如对齐属性justify-content、align-items、align-self之类，然而决定项目本身伸缩性质的flex属性，没有想象中容易理解。这里结合一些常用的布局，把自己的理解放一下。

<!-- more -->

### flex项目的弹性设置

先介绍一下flex属性。

flex是一个复合属性，它的语法如下:

```
flex: none | auto | initial | [  <flex-grow>   <flex-shrink> ? ||  <flex-basis> ]

```
- 如果缩写「flex: 1」, 则其计算值为「1 1 0%」
- 如果缩写「flex: auto」, 则其计算值为「1 1 auto」
- 如果「flex: none」, 则其计算值为「0 0 auto」
- 如果「flex: 0 auto」或者「flex: initial」, 则其计算值为「0 1 auto」，即「flex」初始值

flex条目由3个css属性来确定，分别是flex-basis、flex-grow和flex-shrink。他们的相关说明如下:

|属性|可选值|默认值|含义|备注|
|---|---|---|---|---|
|flex-basis|length, percentage, auto| auto |弹性条目的初始主轴尺寸|在「flex」属性中该值如果被省略则默认为「0%」,在「flex」属性中该值如果被指定为「auto」，则伸缩基准值的计算值是自身的 <' width '> 设置，如果自身的宽度没有定义，则长度取决于内容。|
|flex-grow|integer|1|当容器有多余的空间时，这些空间在不同条目之间的分配比例|在「flex」属性中该值如果被省略则默认为「1」，不能取负值|
|flex-shrink|integer|1|当容器的空间不足时，各个条目尺寸缩小的比例|在「flex」属性中该值如果被省略则默认为「1」，不能取负值|

Example： flexbox等分布局

![pic](http://cdn.alloyteam.com/wp-content/uploads/2015/05/%E5%9B%BE%E7%89%871.png)

一般的教程，往往告诉你项目都设置成flex:1就能做等分了。设置flex:2，得到的尺寸是flex:1的2倍。然而当你在项目中兴高采烈的使用flex：1后，却发现自动生成的-webkit-box-flex: 1;浏览器可以识别，但是尺寸却不正常了，这是为啥呢？

一个伸缩项目最终得到的尺寸，是由三个属性共同决定的：flex-grow,flex-shrink,flex-basis。而我们常用的flex: 1，实际上是flex-grow:1;flex-shrink:1;flex-basis:0%的简写。

让我们先看一下作用最广泛的flex-grow的说明：当容器有**多余的空间**时，这些空间在不同条目之间的分配比例；

举个例子：现在一个flex容器中有3个flex项目。flex容器宽500px。3个flex项目分别宽50、100、150px。这样的话，多余空间则为500-300=200px。这200px空间将根据flex项目的flex-grow值，按份数分配。比如3个flex项目均为flex:1，则每个项目再分配200*1/3，即66.6px。