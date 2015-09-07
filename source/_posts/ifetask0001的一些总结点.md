title: ifetask0001的一些总结点
categories:
  - Code
tags:
  - html
  - css
  - ifetask
date: 2015-05-25 15:05:00
---

##### 多列高度自适应

这倒是我第一次遇见这种问题，解决方案是使用margin负边距，学习了。

<!-- more -->

![多列高度自适应](http://my404forest.qiniudn.com/多列高度自适应.png)

子元素设置padding-bottom：9999px；margin-bottom：-9999px；先通过padding把盒子扩展到足够高，然后通过margin负边距把它给拉回来，最后父元素设置overflow：hidden隐藏溢出，这样多栏布局中就会以最高栏为其他栏的视觉高度。

关于margin负边距的更多应用可以看[margin负值 – 一个秘密武器](http://www.iyunlu.com/view/css-xhtml/52.html)这篇文章。

##### 媒体查询

设计稿有一点要求：Github ICON距离右侧10px，点击后新打开页面进入Github。页面宽度小于980px时隐藏图标。

点击后新打开页面：给a标签增加target="_blank"。

页面宽度小于980px时隐藏图标就用媒体查询来做吧：

```css
@media (max-width: 980px){
    .icon-github {
        visibility: hidden;
    }
}
```

更多关于媒体查询的可以从参考这篇文章[使用 CSS 媒体查询创建响应式网站](http://www.ibm.com/developerworks/cn/web/wa-cssqueries/)

##### 瀑布流布局

上网查了一些资料，发现瀑布流一般有2种方案：float布局（inline-block布局）、绝对定位布局。pinterest使用绝对定位布局，每个格子位置动态计算而来。

参考资料：[瀑布流布局（基于多栏列表流体布局实现）](http://www.zhangxinxu.com/wordpress/2012/03/%E5%A4%9A%E6%A0%8F%E5%88%97%E8%A1%A8%E5%8E%9F%E7%90%86%E4%B8%8B%E5%AE%9E%E7%8E%B0%E7%9A%84%E7%80%91%E5%B8%83%E6%B5%81%E5%B8%83%E5%B1%80-waterfall-layout/)

##### ul,ol,dl

自己一般是啥都用ul，这次总结一下。ol的好处是在css资源未能加载上时能提供1、2、3这种语义化的信息...

```html
<ul>
    <li>无序列表</li>
    <li>无序列表</li>
    <li>无序列表</li>
</ul>
<ol>
    <li>有序列表</li>
    <li>有序列表</li>
    <li>有序列表</li>
</ol>
<dl>
    <dt>列表头</dt>
    <dd>列表内容</dd>
    <dd>列表内容</dd>
</dl> 
```

##### 时间轴

[时间轴](http://my404forest.qiniudn.com/时间轴.png)

刚看到时仔细想了想怎么实现，后来觉得中轴线还是做在背景比较好。切一个4x1的图片，设置background-repeat:repeat-y;background-position:top center。就好了，物件放在时间轴上面，做好对齐。

##### 日历表

![日历表](http://my404forest.qiniudn.com/日历表.png)

用table做方便一些，日期那里用rowspan。