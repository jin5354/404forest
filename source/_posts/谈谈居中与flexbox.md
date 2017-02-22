title: 谈谈居中与flexbox(7.18修订~)
categories:
  - Code
tags:
  - css
  - 布局
  - 居中
  - flexbox
date: 2015-07-18 10:01:00
---

之前的版本主要是自己搜集网上资料整理所得，最近偶然看到大搜车的这篇[有关居中的文章](http://f2e.souche.com/blog/jie-du-cssbu-ju-zhi-shui-ping-chui-zhi-ju-zhong/)，总结的真是详细级了，于是对自己的这篇5月份的文章进行一下补充。

<!-- more -->

###### 谈谈居中

居中分为水平居中与垂直居中。

水平居中常用的解决方案有：

* text-align:center;
* margin-left:auto;margin-right:auto;
* position:relative;left:50%;margin-left:-width;

至于垂直居中，大概常用的就是：

* line-height
* top:50%;margin-top:-height;
* vertical-align: middle;

如果允许使用css3的新特性，flexbox布局以及tranform中的translate都是很好用的。

###### 水平居中

###### 1.文字水平居中

比较简单，一般是父元素设置text-align:center;就够了。

<iframe width="100%" height="300" src="//jsfiddle.net/c05vjL6w/5/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

###### 2.定宽元素水平居中 && 父元素也定宽

父元素左右等padding或子元素左右等margin即可。

###### 3.定宽元素水平居中 && 父元素宽度未知

父元素宽度未知的情况比较常见，比如一般页面的container都限制在960px左右，无论浏览器视口宽度有多大都要保证居中：

* 可以使用margin-left:auto;margin-right:auto;

<iframe width="100%" height="300" src="//jsfiddle.net/td46s77s/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

* 另外一种方式是使用position:absolute;left:50%;margin-left:-宽度一半;

<iframe width="100%" height="300" src="//jsfiddle.net/eq439zqp/2/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

###### 4.未知宽度元素水平居中

* 如果要居中的元素允许转化为inline-block，例如某些按钮，那么可以结合`text-align:center;`来做。父元素设定`text-align:center;`，子元素设为`display:inline-block`。

<iframe width="100%" height="300" src="//jsfiddle.net/eq439zqp/3/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

* 绝对定位+相对定位：父元素使用position:absolution;left:50%;子元素使用position:relative;left:-50%;。

意思是父元素先相对定位至50%处，子元素再左偏父元素的50%；达到居中的效果。

<iframe width="100%" height="300" src="//jsfiddle.net/tp0b9c45/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

* float+双相对定位：父元素使用float,随后使用position:relative;left:50%;定位到中央，子元素使用position:relative;left:-50%;移回。

这里的float和上个方法的absolute的功能都是收缩这个未知宽度元素的宽度，这样子元素的left的百分比数值才会得出正确结果。

* 绝对定位+translateX: position:absolute;left:50%;transform:translateX(-50%);

<iframe width="100%" height="300" src="//jsfiddle.net/hbzk7hyn/1/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

对于定宽元素这几种方法也适用。

###### 垂直居中

###### 1.文字垂直居中

对于一行文字，直接令line-height值===height值即可。

###### 2.定高元素垂直居中 && 父元素也定高

父元素上下等padding或子元素上下等margin即可。

###### 3.定高元素垂直居中 && 父元素高度自适应

* 类似水平居中的方式，position:relative;top:50%;margin-top:-高度一半;
在实验过程中发现出现了重叠外边距问题，给父元素加个overflow激活一下bfc可以解决。

当然，换用绝对定位就不用担心bfc了，父元素position:relative；子元素position:absolute;top:50%;margin-top:-高度一半;最终效果相同。

<iframe width="100%" height="300" src="//jsfiddle.net/3eq1upod/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

* 另一种使用绝对定位的方案：父元素position:relative；子元素position:absolute;top:0;bottom:0;margin:auto;

<iframe width="100%" height="300" src="//jsfiddle.net/njgn35vm/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

* 绝对定位+translateY: position:absolute;top:50%;transform:translateY(-50%);

<iframe width="100%" height="300" src="//jsfiddle.net/hbzk7hyn/2/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

###### 额外补充

* 表格布局

使用table实现居中是非常方便的，单独拿出来说一下。子元素设置display:table-cell;结合text-align:center;vertical-align:middle;即可。

<iframe width="100%" height="300" src="//jsfiddle.net/rtq24yof/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

* absolute + margin：auto，只适合定宽定高哦

子元素：position:absolute;margin:auto;left:0;right:0;top:0;bottom:0;

* text-align:center + vertical-align:middle 利用占位符作为vertical-align:middle的参照，实现水平与垂直居中，父元素需要定高height:inherit;详见参考资料最后一条

* text-align:center + font-size(87.3%) 通过匿名文字节点的高度作为vertical-align:middle的参照，实现水平与垂直居中，父元素需要定高。详见参考资料最后一条

* CSS grid下的水平垂直居中，近IE10/11支持

* 使用button标签自带的水平垂直功能。详见参考资料最后一条

居中这部分坑大无比，情况非常复杂多变，还会有许多特殊情况，随见到随收集。参考资料里会先放一些。

##### flexbox

flexbox是css3中的一个新的布局模式。久闻大名，最近在一个页面中大量应用，写起来真是爽啊——，现在小小总结一下。

详细资料可见页底的参考资料，这里只把干货提炼一下。

要使用flexbox布局，首先要定义伸缩容器(flex containers)与伸缩项目(flex items)。设置display: flex;即可将一个元素定义为伸缩容器，伸缩容器内的元素自动成为伸缩项目。

![伸缩容器与伸缩项目](http://www.html5cn.org/data/attachment/portal/201305/07/100803rzf7jqhxclg7rxjf.jpg)

伸缩容器的常用属性：

设置的flex-direction(row | row-reverse | column | column-reverse)可定义伸缩项目的布局方式。

![由左向右布局](http://www.html5cn.org/data/attachment/portal/201305/07/101117uok0i8dt0infnis1.jpg)

![由上向下布局](http://www.html5cn.org/data/attachment/portal/201305/07/1012029mq90mfm7fg0h9f7.jpg)

默认的情况下，flex items会尝试在一行中显示，通过修改flex-wrap(nowrap | wrap | wrap-reverse)，定义是否换行。

flex-flow是上述两个属性的简写，默认值为row nowrap。

justify-content（flex-start | flex-end | center | space-between | space-around;）定义相对主轴的对齐方式。水平居中一句搞定。

![justify-content](http://images.cnitblog.com/blog/546321/201411/181851356916458.jpg)

align-content（flex-start | flex-end | center | space-between | space-around | stretch）定义相对十字轴的对齐方式。多行情况下垂直方向上剩下的空间的分配方式。

![align-content](http://images.cnitblog.com/blog/546321/201411/181906227696484.jpg)

align-items（flex-start | flex-end | center | baseline | stretch）定义flex item在十字轴（垂直于主轴）的当前行上的默认行为。垂直居中一句搞定。

![align-items](http://images.cnitblog.com/blog/546321/201411/181902471298331.jpg)

很方便的实现水平垂直居中的例子：

<iframe width="100%" height="300" src="//jsfiddle.net/1n4n0j5e/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

伸缩项目的常用属性：

flex-grow（<number>）让flex items根据数值比例自适应分配空间。

![flex-grow](http://images.cnitblog.com/blog/546321/201411/181914466758737.jpg)

flex-shrink（<number>）定义flex items的伸缩能力。

flex-basis（<length> | auto）定义了在有剩余的空间可分布时一个元素的默认大小。

flex（<'flex-grow'> <'flex-shrink'>? || <'flex-basis'>）是 flex-grow, flex-shrink和flex-basis的缩写。默认值是 0 1 auto。

align-self(auto | flex-start | flex-end | center | baseline | stretch;)这个元素与flex items自己的对齐方式有关。

![align-self](http://images.cnitblog.com/blog/546321/201411/181923009256141.jpg)

参考资料：

1. [大小不固定的图片、多行文字的水平垂直居中](http://www.zhangxinxu.com/wordpress/2009/08/%E5%A4%A7%E5%B0%8F%E4%B8%8D%E5%9B%BA%E5%AE%9A%E7%9A%84%E5%9B%BE%E7%89%87%E3%80%81%E5%A4%9A%E8%A1%8C%E6%96%87%E5%AD%97%E7%9A%84%E6%B0%B4%E5%B9%B3%E5%9E%82%E7%9B%B4%E5%B1%85%E4%B8%AD/)
2. [整理：子容器垂直居中于父容器的方案](http://segmentfault.com/a/1190000000381042)
3. [CSS在页面布局中实现div水平居中的方法总结](http://dudo.org/archives/2008053023234.html)
4. [解读CSS布局之-水平垂直居中](http://f2e.souche.com/blog/jie-du-cssbu-ju-zhi-shui-ping-chui-zhi-ju-zhong/)
