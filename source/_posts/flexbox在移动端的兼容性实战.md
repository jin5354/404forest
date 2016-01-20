title: flexbox在移动端的兼容性实战
categories:
  - Code
tags:
  - WebKit
  - CSS
  - 兼容性
  - flex
date: 2015-12-17 16:20:21
---

之前曾经写过文章介绍flexbox布局，这个玩意相比与传统的float布局，简直是大大解放了生产力。但是说到应用于生产的话，flex布局的兼容性实在是让人没信心。PC端彻底没戏，IE10才支持部分混合语法；不过caniuse上查阅到的移动端兼容性还算不错，Android2.1起开始支持旧语法，iOS safari从3.2开始支持旧语法。在v2上查阅了些帖子，很多人说移动端上兼容是坑，不过观察可知，大部分人都没有专门去研究旧语法。flex在移动端表现究竟如何，本文来探讨下这个话题。

<!-- more -->

先来看一眼Caniuse上的资料吧。

|Android|2.1-4.3|4.4+|
| --- | --- | --- |
|支持情况|旧语法(不支持换行)，需要带-webkit-前缀|新语法|

|iOS|3.2-6.1|7.1+|
| --- | --- | --- |
|支持情况|旧语法(不支持换行)，需要带-webkit-前缀|新语法|

可以看到对于旧语法的支持还是不错的，不过旧语法相比与新语法，功能如何，有啥缺陷？看下面这个我整理的表吧。

||新语法 |  旧语法     | 备注|
| ------ | ------------- |---------------| ------|
|开启flexbox|display: flex/inline-flex|display: box/inline-box||
|伸缩性|**flex**|box-flex|旧语法的box-flex只有一个参数，作用等同与flex-grow|
||flex-grow  |/|
||flex-shrink |/|
||flex-basis|/|
|主轴方向与换行的简写|**flex-flow**|/|
|主轴方向|flex-direction|box-direction/box-orient|可以通过box-orient:horizontal + box-direction:normal 达到新版本 flex-direction:row 的效果；|
|换行|flex-wrap|box-lines|
|主轴对齐方式|**justify-content**|box-pack|
|侧轴对齐方式|**align-items**|box-align|
|单个伸缩项目侧轴对齐方式|**align-self**|/|
|伸缩项目行侧轴对齐方式|align-content|/|
|显示顺序|order|box-ordinal-group|

可以看到，旧语法的功能比新语法弱一些，不能支持flex项目的flex-shrink、flex-basis（影响收缩），不支持单个flex项目的侧轴对齐方式，不支持flex项目行侧轴对齐方式。但是依然可以实现大部分功能。

让我们用真机检验一下吧。

#### 兼容性测试报告

测试环境：Android 2.3.7，Android4.1.1，Android4.4，ios6，ios9

Android 4.4+ 与ios9+ 支持新语法，不需要做兼容性即可使用。

表中查阅可知Android 2.1 - Android 4.3 部分支持旧语法，本次使用了2.3.7与4.1.1进行了测试，测试结果如下：

- 需使用带有-webkit-前缀的旧语法；
- 支持主轴方向设置、支持主轴对齐、支持侧轴对齐、支持设置显示顺序
- 不支持换行(box-lines属性无效)，即只能做**单行**
- 支持box-flex属性，但是因为没有flex-basis属性，需要手动指定width: 0%后可以实现等分;
- **总结：虽然部分功能缺失，但水平垂直居中与等分功能已经可以实现**

ios6测试结果同上。水平垂直居中与等分功能已经可以实现，表现稳定。

可以看到，严格遵循规则的话，flex的可用性已经足够高了，足够把我们从之前各种繁琐的花式布局解放出来。想当年，做一个完美的垂直居中要烧多少脑细胞~（见我之前整理的6种花式垂直居中做法），用了flex，一句话就搞定啦。

现在在用flexbox布局（配合sass的mixin做兼容）+lib-flexible库做移动端自适应匹配，基本能做到写一次代码，匹配全部移动机型，生产力飞了起来。

常见情况的兼容性写法，包括PC端与移动端：
[更多详细请参考该mixin](https://github.com/mastastealth/sass-flex-mixin/blob/master/_flexbox.scss)

```
/* 父元素-flex容器 */
.flex {
    display: -webkit-box;      /* OLD - iOS 6-, Safari 3.1-6 */
    display: -moz-box;         /* OLD - Firefox 19- (buggy but mostly works) */
    display: -ms-flexbox;      /* TWEENER - IE 10 */
    display: -webkit-flex;     /* NEW - Chrome */
    display: flex;             /* NEW, Spec - Opera 12.1, Firefox 20+ */
}
/* 子元素-等分 */
.flex1 {
    -webkit-box-flex: 1;      /* OLD - iOS 6-, Safari 3.1-6 */
    -moz-box-flex: 1;         /* OLD - Firefox 19- */
    -webkit-flex: 1;          /* Chrome */
    -ms-flex: 1;              /* IE 10 */
    flex: 1;                  /* NEW, Spec - Opera 12.1, Firefox 20+ */
}
/* 父元素-横向排列（主轴） */
.flex-h {
    /* 09版 */
    -webkit-box-orient: horizontal;
    /* 12版 */
    -webkit-flex-direction: row;
    -moz-flex-direction: row;
    -ms-flex-direction: row;
    -o-flex-direction: row;
    flex-direction: row;
}
/* 父元素-换行 */
.flex-hw {
    /* 09版 */
    /*-webkit-box-lines: multiple;*/
    /* 12版 */
    -webkit-flex-wrap: wrap;
    -moz-flex-wrap: wrap;
    -ms-flex-wrap: wrap;
    -o-flex-wrap: wrap;
    flex-wrap: wrap;
}
/* 父元素-主轴方向居中 */
.flex-hc {
    /* 09版 */
    -webkit-box-pack: center;
    /* 12版 */
    -webkit-justify-content: center;
    -moz-justify-content: center;
    -ms-justify-content: center;
    -o-justify-content: center;
    justify-content: center;
    /* 其它取值如下：
        align-items     主轴原点方向对齐
        flex-end        主轴延伸方向对齐
        space-between   等间距排列，首尾不留白
        space-around    等间距排列，首尾留白
     */
}
/* 父元素-纵向排列（主轴） */
.flex-v {
    /* 09版 */
    -webkit-box-orient: vertical;
    /* 12版 */
    -webkit-flex-direction: column;
    -moz-flex-direction: column;
    -ms-flex-direction: column;
    -o-flex-direction: column;
    flex-direction: column;
}
/* 父元素-侧轴居中） */
.flex-vc {
    /* 09版 */
    -webkit-box-align: center;
    /* 12版 */
    -webkit-align-items: center;
    -moz-align-items: center;
    -ms-align-items: center;
    -o-align-items: center;
    align-items: center;
}
/* 子元素-显示在从左向右（从上向下）第1个位置，用于改变源文档顺序显示 */
.flex-1 {
    -webkit-box-ordinal-group: 1;   /* OLD - iOS 6-, Safari 3.1-6 */
    -moz-box-ordinal-group: 1;      /* OLD - Firefox 19- */
    -ms-flex-order: 1;              /* TWEENER - IE 10 */
    -webkit-order: 1;               /* NEW - Chrome */
    order: 1;                       /* NEW, Spec - Opera 12.1, Firefox 20+ */
}
/* 子元素-显示在从左向右（从上向下）第2个位置，用于改变源文档顺序显示 */
.flex-2 {
    -webkit-box-ordinal-group: 2;   /* OLD - iOS 6-, Safari 3.1-6 */
    -moz-box-ordinal-group: 2;      /* OLD - Firefox 19- */
    -ms-flex-order: 2;              /* TWEENER - IE 10 */
    -webkit-order: 2;               /* NEW - Chrome */
    order: 2;                       /* NEW, Spec - Opera 12.1, Firefox 20+ */
}
```

参考资料：

1. [CSS3参考手册 » 属性列表 » 新弹性盒模型属性 »](http://css.doyoe.com/properties/flex/index.htm)
2. [CSS3参考手册 » 属性列表 » 旧伸缩盒属性](http://css.doyoe.com/properties/flexible-box/index.htm)
3. [sass-flex-mixin](https://github.com/mastastealth/sass-flex-mixin/blob/master/_flexbox.scss)
4. [flexbox布局的兼容性](http://www.ayqy.net/blog/flexbox%E5%B8%83%E5%B1%80%E7%9A%84%E5%85%BC%E5%AE%B9%E6%80%A7/)
5. [CSS3 Flexbox属性与弹性盒模型](http://gejiawen.github.io/2015/05/20/css3-flexbox-guide/)
6. [Flexbox兼容性语法汇总](http://www.cnblogs.com/WhiteCusp/p/4257398.html)
7. [浅谈flexbox的弹性盒子布局](http://www.alloyteam.com/2015/05/xi-shuo-flexbox-dan-xing-he-zi-bu-ju/)