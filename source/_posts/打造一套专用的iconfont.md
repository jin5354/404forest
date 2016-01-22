title: 打造一套专用的iconfont
categories:
  - Code
  - design
tags:
  - font
  - css
  - iconfont
date: 2016-01-20 18:01:21
---

### 为什么要使用iconfont？

iconfont 是一个解决图标问题的优秀方案。iconfont的优点在于：

1. 矢量性，可以随意改变大小而依旧保持清晰
2. 可定制，由于是字体所以针对字体的CSS属性都可以使用——字号、颜色、透明度可直接修改
3. 兼容性超强，连古老的IE6都已支持，通吃各种浏览器
4. 简单，所以图标均由字体控制，再也不用切各种雪碧图了。有各种网站支持在线生成。
5. 扩展性强，有新图标？直接添加至字体中即可！
6. 已被广泛应用。

缺点：

1. 需要svg设计稿。也就是需要设计师支持。

本站首页左边列表中的各种小图标就都是iconfont。

### 如何制作iconfont？

#### 第一步，输出SVG文件

首先需要将做好的图标输出为SVG文件。如果要制作iconfont的话，对SVG本身存在一些要求，具体可以看[图标制作说明](http://iconfont.cn/help/iconmake.html)。

图标绘制规范：

1. 所有图标请在16X16的AI画布中绘制，（iconfont图标在绘制时均以标准图标大小16像素X16像素绘制，因为在制作成字体时文件需要设置较高的清晰度，所以图标路径也需要等比例放大。）

2. 为了确保图标的清晰显示，在绘制时须避免水平、垂直的边缘出现半个单位。（半个单位的路径会导致图标在最终显示时边缘模糊，不清晰），弧线在绘制时要保证弧度饱满。

3. LOGO（包括图形和字体）类图标要基于基线对齐，同时需要综合考虑LOGO在组合使用时的水平位置关系。

4. 字体或线条类图标绘制完成后，须对对象执行“扩展”操作，以矢量图形输出，未进行“扩展”操作的路径会影响图标的正常显示。

5. 在绘制图形的时候，曲线必须是闭合的。如果曲线是不闭合的在字体转换的过程中是无发转译未闭合曲线的图形的。

6. 在绘制好封闭图形后，要给图形填充颜色。

#### 第二步，制作iconfont字体

![svg](http://7sbmuq.com1.z0.glb.clouddn.com/svg.png)

有了做好的svg文件之后，我们就可以开始制作iconfont字体了！

有很多网站提供好用的在线iconfont制作服务。我一般使用[icomoon](https://icomoon.io/)，如果使用国产服务比如[http://iconfont.cn/](http://iconfont.cn/)当然也可以。

进入icomoon后，点击右上角的icomoon app就进入制作主界面了。通过左上角的import icons，把svg都导进去。

![iconfont](http://7sbmuq.com1.z0.glb.clouddn.com/iconfont.png)

每个set的右边是有设置按钮的，眼睛按钮右侧。可以调换图标位置。满意后点击右下角的generate即可生成字体。

在接下来的预览页面，我们已经可以直接看到iconfont化的字体————以及其所对应的unicode编码。

这时要注意，每个图标都只应对应1个unicode编码，如果某个图标对应了多个unicode编码，说明生成失败————输出的svg文件不合规范。需要重新输出svg。

检查无误，就可以点击download下载了。

打开下载的文件，fonts文件夹中躺着的4个文件就是我们所需要的字体文件了。

![fonts](http://7sbmuq.com1.z0.glb.clouddn.com/fonts.png)

打开看一眼，感觉萌萌哒。

#### 第三步，使用iconfont字体

将字体文件存放妥当后，CSS中引入iconfont字体。（如果使用sass等预处理器解决方案更简单一点，将所有iconfont相关模块抽象成一个iconfont.scss，随后在有iconfont使用需求的项目中直接import即可）

````
@font-face {
  font-family: 'wdiconfont';
  src: url('../../fonts/wdiconfont.eot'); /* IE9 Compat Modes */
  src: url('../../fonts/wdiconfont.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
  url('../../fonts/wdiconfont.woff') format('woff'), /* 所有现代浏览器 */
  url('../../fonts/wdiconfont.ttf')  format('truetype'), /* Safari, Android, iOS */
  url('../../fonts/wdiconfont.svg#svgFontName') format('svg'); /* Legacy iOS */
}
````

CSS中进行配置：
````
.iconfont {
    font-family: "wdiconfont" !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
.icon-chat::before {
    content: '\e900';
}
.icon-cart::before {
    content: '\e901';
}
.icon-wait-confirm::before {
    content: '\e902';
}
.icon-wait-rate::before {
    content: '\e903';
}
....
````

HTML中一般使用i,span之类的标签作为图标载体
````
<span class="iconfont icon-chat"></span>
````

这样配置好之后，网页上就可以正常显示了。

PS: 字体编辑工具：FontLab Studio

当我们已经有一个表现良好的iconfont之后，如果遇到新增图标，删除图标，两个iconfont合并之类的任务，可以使用FontLab Studio解决。