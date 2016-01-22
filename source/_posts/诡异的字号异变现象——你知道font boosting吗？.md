title: 诡异的字号异变现象——你知道font boosting吗？
categories:
  - Code
tags:
  - CSS
  - lib-flexible
  - font-boosting
date: 2016-01-22 15:48:11
---

最近在写一个移动端项目时，其中的一个页面出现了诡异的问题：浏览器显示的字号与 css 指定的字号不符。定义字号为28px，显示出来却为33px，具体示例图如下：

<!-- more -->

![font-boosting](http://7sbmuq.com1.z0.glb.clouddn.com/font-boosting.jpg)

而且并非是局部元素字号异常，整个页面大多数的字号都产生了混乱。写了这么多年 css 代码，头一次遇到这种问题。由于当时是在此页面上增加了 dom 结构，增加前页面显示正常，所以优先怀疑是增加的部分产生了问题。但是令人诧异的是，增加的部分产生了问题为什么会影响了全局，这是怎么回事！

一点一点排查。我们写css时，只要选择器限定的准确，是不会影响到其他部分的。这里的选择器使用没有出现问题。随后又想到，影响全局的又一个理由可能是 html 标签书写错误，比如`<span>abc</span>`手误或者误操作写成了`<span>abc<span>`， 这种未正常闭合的标签，可能导致浏览器对接下来的dom结构构建异常。查了一遍，html也没有问题。

所写的页面是使用lib-flexible适配方案的，改变了dpr查看页面渲染结果，惊讶的发现，在dpr=1的情况下，页面显示正常！只有在dpr=2和dpr=3的情况下，这个问题才会出现。后来不停的对新增代码进行删改，缩小目标范围，意图找到触发错误的地点，然而发现触发条件十分刁钻：只有在某些特定的dom结构，某一行的文字大于一定数量时才会出现这个问题。

没能清楚确定下来渲染错误产生的原因，只能暂时想方法避免：给p标签内加入`white-space: nowrap`可以使字号恢复正常（white-space是控制是否折行的，与字号有什么关系？）。容器换用flex布局`@include flexbox`也可以解决问题。暂时采取后者，给所有容器换用了flex布局，临时解决了这个问题。当时是觉得触发了chrome浏览器的bug，上网试图搜了搜，无果。

### font-boosting

后来，在查询lib-flexible的issues时，碰巧发现有人遇到了相同问题，在回答里看到了真实原因“Font Boosting”，又称“Text Autosizer”。是 Webkit 给移动端浏览器提供的一个特性：当我们在手机上浏览网页时，很可能因为原始页面宽度较大，在手机屏幕上缩小后就看不清其中的文字了。而 Font Boosting 特性在这时会自动将其中的文字字体变大，保证在即不需要左右滑动屏幕，也不需要双击放大屏幕内容的前提下，也可以让人们方便的阅读页面中的文本。

意思就是：在移动端页面缩放情况下(initial-scale!=1)，chrome有可能重新调整字号。

使用lib-flexible布局的移动端页面，如果使用默认配置，在dpr=2或dpr=3的情况下，会修改initial-scale为0.5和0.333来扩大页面的CSS像素数至于物理像素数相同，以期实现苹果retina屏下的“物理1px”。而将initial-scale修改为小于1的值恰巧类同于缩放操作，满足了font-boosting触发条件之一。

但是其他同样使用lib-flexible布局的页面就不会出现这个问题，触发font-boosting的详细条件到底是什么？感兴趣的同学可以阅读这篇文章[Chromium's Text Autosizer](https://docs.google.com/document/d/1PPcEwAhXJJ1TQShor29KWB17KJJq7UJOM34oHwYP3Zg/edit)

Ali的mingelz同学分享了他的研究：

简单说来，Font Boosting 的计算规则伪代码如下：
```
multiplier = Math.max(1, deviceScaleAdjustment * textScalingSlider * systemFontScale * clusterWidth / screenWidth);
if (originFontSize < 16) {
    computedFontSize = originFontSize * multiplier;
}
else if (16 <= originFontSize <= (32 * multiplier - 16)) {
    computedFontSize = (originFontSize / 2) + (16 * multiplier - 8);
}
else if (originFontSize > (32 * multiplier - 16)) {
    computedFontSize = originFontSize;
}
```

其中变量名解释如下，更具体的说明可以参考上边的两个链接。

- originFontSize: 原始字体大小
- computedFontSize: 经过计算后的字体大小
- multiplier: 换算系数，值由以下几个值计算得到
- deviceScaleAdjustment: 当指定 viewport width=device-width 时此值为 1，否则值在 1.05 - 1.3 之间，有专门的计算规则
- textScalingSlider: 浏览器中手动指定的缩放比例，默认为 1
- systemFontScale: 系统字体大小，Android设备可以在「设备 - 显示 - 字体大小」处设置，默认为 1
- clusterWidth: 应用 Font Boosting 特性字体所在元素的宽度（如何确定这个元素请参考上边两个链接）
- screenWidth: 设备屏幕分辨率（DIPs, Density-Independent Pixels），如 iPhone 5 为 320

### 解决方案

1. Font Boosting 仅在未限定尺寸的文本流中有效，给元素指定宽高，就可以避免 Font Boosting 被触发
2. 可通过指定max-height来避免触发。比如 html * {max-height:1000000px;}
3. 指定initial-scale = 1。
```
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- 或 -->
<meta name ="viewport" content ="initial-scale=1, maximum-scale=1, minimum-scale=1">
```

参考资料：

1. [Font Boosting #10](https://github.com/amfe/article/issues/10)
2. [(FontBoosting) Text Autosizing for mobile browsers (master bug)](https://bugs.webkit.org/show_bug.cgi?id=FontBoosting)
3. [how to override font boosting in mobile chrome](http://stackoverflow.com/questions/13430897/how-to-override-font-boosting-in-mobile-chrome)