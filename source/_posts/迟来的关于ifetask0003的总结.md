title: 迟来的关于ifetask0003的总结
categories:
  - Code
tags:
  - Javascript
  - html
  - css
date: 2015-07-14 23:44:41
metaAlignment: left
---

不好意思，很久没有更新blog了。ifetask0003大概6月下旬完成，后来面临期末考试等杂七杂八的事项，一直没能拿出时间写文。

ifetask0003是一个webapp的应用，在写之前我曾犹豫过要不要使用angular这种框架，后来看要求说不推荐使用框架，那么也就自己纯js实现一下吧。

时间拖了有点久了，现在看了看，也没回忆起多少，大概就这2点：

<!-- more -->

**平稳退化**

编写这个webapp时用到了一些html5的标签，比如上方的标题用header简直再合适不过了。而对于兼容性则使用html5shiv来处理。

提到这些，是想表达我的一个观点：技术，在有shim方案的情况下，能用新的就用新的。之前在公司的一个项目中，有一个小小的打分模块：

![配图-分数](http://7sbmuq.com1.z0.glb.clouddn.com/配图-分数5A7CC9C3-7991-413B-AB29-72486750C643.png)

背后的圆环要根据分数显示。同事跟我讲，之前做过这个东西了，可以拿来复用，我看了下之前是通过CSS做的，很复杂，两张图片交叠，高级浏览器使用CSS3的旋转，低级浏览器好像是使用了什么数学函数，结果IE7还不支持，蛋疼菊紧。

其实这个东西一眼看上去就可以用canvas做的。canvas的shim方案大佬谷歌有提供：excanvas。这个库的功能是在低版本IE将canvas转变为VML对象进行绘制。当然，过于复杂的操作是不支持，不过画个弧，设置个线宽，设置个颜色还是小轻松的——而且学习成本非常低廉。于是最终用canvas + excanvas，不需要其他学习成本，顺利实现IE7+的圆弧绘制。

这也是我逐渐感悟到的：熟悉IE6、IE7的各种bug各种缺陷各种hack有个卵用，这些浏览器逐渐都被淘汰，现在为了掌握各种奇技淫巧所花的时间最后终将成为无用的沉默成本。能用高级技巧+shim就要抛弃低级的奇技淫巧，能用ES6+babel就大胆用ES6，开发者的时间应该花费在美好的事物上，而不是给IE擦屁股。

**数据结构**

很明显这个webapp有这种树形结构：分类-子分类-具体任务，于是我建了个总object，下属cates-cateChilds-tasks。

而相对应的则有解析数据结构并显示的函数，renderCates(),renderTasks(),renderDetail()。这里就提到了数据传递的问题。比如我把某个任务设置成“已完成了”，那么对应分类列表和任务列表都要有更新，也就是重新渲染。重新render的话，参数去哪里找呢？这里我用的方法就是在每次渲染时，把此次渲染的参数写在对应wrapper的data-*中，以后在这里存取数据。

在公司做后台开发时，很多时候也有这种需求，大概也就两种方式：①把数据存在某个稳定的dom元素的data-*中，②干脆js中新建个变量存储。
这两种方法我都不甚满意，在操作时会产生大量存-取-存-取这种非常无聊的“脏代码”，严重增加了代码冗余度。

也许angular这种MVVM框架的数据绑定适合解决这种问题吧……我了解的不多，就不多说了。


ifetask0004打算找时间补一下，恩，就最近！