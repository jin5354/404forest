title: 《Css揭秘》简单笔记
categories:
  - Code
tags:
  - Css
  - 读书笔记
toc: true
date: 2016-08-29 18:21:11
---

久闻这本书大名，季度购书时买下了，花了一个下午翻完，简单做点记录。

<!-- more -->

总体来说还不错，不过大多数内容都是“展望未来”的，含有大量不能用于生产环境的新特性，比如 -webkit-clip-path、calc（这货竟然到 Android 5 才完全支持）等等，这些都略读了，所以读的很快。真正有用实用现在就能用的不是很多，但还是有些确实起到了点拨的作用。作为一名实用主义者，给这本书装帧100分，内容80分。

小记一些实用的东西。

### 带有背景色的半透明边框

问题：背景色会延伸到边框下层。

border: 10px solid rgba(255,255,255,0.5);
**background-clip: padding-box;** //浏览器会用内边距的外沿把背景裁剪掉，兼容性出色

### 多重边框

配合使用 border 与 **box-shadow** / **outline**。box-shadow 可以创建无限数量的边框，但行为与边框不一样。需要修改内外边距来额外提供空间。box-shadow 可选属性为 inset。
outline-offset 可以控制 outline 与元素边缘的间距，甚至可以接收负值。outline 不贴合圆角。

### 方边框内圆角

border + border-radius + box-shadow + outline 同时使用，主要利用特性：box-shadow 贴合圆角，outline 不贴合圆角。

### 背景图像于内容区对齐

默认情况下背景图像于 padding-box 左上角对齐。可以修改：

**background-origin**: content-box;

### CSS 创建条纹背景

**background: linear-gradient(#fb3 50%, #58a 50%);**

更好的斜向条纹： background: repeating-linear-gradient(45deg, #fb3, #58a 30px);

### 平行四边形

transform: skewX(-45deg);

内容也跟着倾倒了？对内容应用反向： skewX(45deg);

不愿意使用双层 DOM？ 使用伪元素。

### 菱形图片/六边形题片

clip-path: polygon(50% 0, 100% 50%, 50%, 100%, 0 50%); //这货兼容性不行啊。

### 切角效果

万能的 background: linear-gradient 搭配 background-size/background-repeat

### 画梯形

**transform: perspective(.5em) rotateX(5deg)** //transform 3D 的兼容性不知道有没有坑，用 border 实现梯形肯定没问题，最妥。

### < br > 以外的换行

有一个 Unicode 字符用来换行：0x000A/"\A"，将其用于伪元素中，并设置white-space: pre。

dd::after {
    content: '\A';
    white-space: pre;  //这个非常实用
}

### 调整 tab 宽度

tab-size: 4;  //兼容性一般般，需求不大。一般调整代码缩放展示

### 对指定字符采用指定字体

@font-face {
    font-family: AAA;
    src: url(...);
    unicode-range: U+26; //兼容性很差，但是很有用。
}

### 精确控制列表

table-layuot: fixed 可以给你更多控制权。  //比较实用，css2.1的内容。
