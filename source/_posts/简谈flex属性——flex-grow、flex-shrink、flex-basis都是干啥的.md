title: 理解flex属性——flex-grow、flex-shrink、flex-basis都是干啥的
categories:
  - Code
tags:
  - CSS
  - flex
date: 2015-12-17 16:53:21
---

flex的大部分属性都简明易懂，比如对齐属性justify-content、align-items、align-self之类，然而决定项目本身伸缩性质的flex属性，没有想象中容易理解。这里结合一些常用的布局，把自己的理解写一下。

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

一般的教程，往往告诉你项目都设置成flex:1就能做等分了。如果某个元素设置flex:2，它得到的尺寸会是flex:1的2倍。然而当你在项目中兴高采烈的使用flex：1后，却发现自动生成的-webkit-box-flex: 1;在低版本浏览器中可以识别，但是尺寸却不正常了，这是为啥呢？

一个伸缩项目最终得到的尺寸，是由三个属性共同决定的：flex-grow,flex-shrink,flex-basis。而我们常用的flex: 1，实际上是flex-grow:1;flex-shrink:1;flex-basis:0%的简写。

最终宽度计算如下：
1. 当某行的flex项目宽度小于flex容器宽度时，此时会涉及到多余空间分配，此时显示结果由flex-grow与flex-basis两属性决定。
    某个元素的最终宽度为：初始尺寸 + 多余空间* (元素分配比例/总分配比例)
2. 当某行的flex项目宽度大于flex容器宽度时，此时会涉及到flex项目缩小，此时显示结果由flex-shrink与flex-basis两属性决定。
    某个元素的最终宽度为：初始尺寸 - 压缩空间* (元素分配比例/总分配比例)

这里很重要的一点是：初始尺寸如何得来？根据flex-basis的说明可以知道：默认为0%，即0，如果手动指定为auto，则flex-basis值与元素指定的width值相同；如果元素没有被指定width值，则由内容计算得出。（类似于inline-block中内容自动撑开的宽度）

#### 当某行的flex项目宽度小于flex容器宽度时，此时会涉及到剩余空间分配，此时显示结果由flex-grow与flex-basis两属性决定。

<a class="jsbin-embed" href="http://jsbin.com/fixapu/5/embed">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?3.35.9"></script>

上面是一个简单的例子：父元素宽度300px，3个子元素宽度为50px、60px、40px，此时多余空间为150px。默认情况下(flex初始值：0 1 auto)，3个子元素左对齐,剩余空间不分配。

如果我们给这三个元素均指定为flex:1；结果如下：

<a class="jsbin-embed" href="http://jsbin.com/fixapu/14/embed">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?3.35.9"></script>

这是一个标准的等分情况，此时每个元素的尺寸为 0+300*(1/3) = 100px。当flex=1时，每个元素的初始尺寸为0，则剩余空间为300px，进行三等分。

这里我们可知：使用flex：1能够如此简单的实现不同尺寸元素的等分的关键在于————其指定flex-basis为0，此时元素本身宽度会被忽视。

而在低版本安卓、ios中flex:1不能坐到等分的原因也在这里：旧语法中根本没有flex-basis这个选项——而在计算中一律将flex-basis当做auto在处理。所以当你在使用flex：1时，实际你在使用的是flex-grow:1，flex-basis: auto。这是的结果则是：

<a class="jsbin-embed" href="http://jsbin.com/fixapu/15/embed">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?3.35.9"></script>

此时元素尺寸 = 初始尺寸(50,60,40) + 150 * (1/3) = 100, 110, 90px

#### 当某行的flex项目宽度小于flex容器宽度时，此时会涉及到多出空间进行压缩，此时显示结果由flex-grow与flex-basis两属性决定。

<a class="jsbin-embed" href="http://jsbin.com/fixapu/16/embed">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?3.35.9"></script>

父元素宽度300px，3个子元素宽度为110px、120px、130px，此时多出空间为60px。默认情况下(flex初始值：0 1 auto)，每个元素的尺寸为：

初始尺寸(110, 120, 130) - 60 * (1/3) = 90, 100, 110px

<a class="jsbin-embed" href="http://jsbin.com/fixapu/10/embed">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?3.35.9"></script>

若给这三个元素指定flex-shrink分别为1，3，5 可知：

元素尺寸 = 初始尺寸(110, 120, 130) - 60 * ((1, 3, 5)/9) = 104, 100, 95px;

PS: 由于旧语法中的flex仅支持flex-grow，不支持flex-shrink和flex-basis，所以在旧语法中无法实现收缩（同时由于旧版本移动端浏览器不支持flex的换行，子元素会冲出父容器）。同时由于flex-basis的缺失，初始尺寸一律按照auto情况计算，所以直接写flex：1是无法实现不同初始尺寸元素的等分的，这时需要将所有子元素手动指定width：0；才可以实现等分。
