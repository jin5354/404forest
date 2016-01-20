title: 《WebKit技术内幕》——脑图笔记
categories:
  - Code
tags:
  - WebKit
date: 2015-10-25 19:48:41
---

最近把《WebKit技术内幕》这本书读了一遍。这本书其实更适合浏览器开发工程师来看，对于我这种前端工程师来说，可能没必要深究某处实现的细节，书中有的地方如果能讲的更抽象些就更好了。这里把脑图存一下档。

<!-- more -->

一开始还是细读，读到后面发现涉及到具体类的实现部分蛮晦涩的，于我收益也不大，于是变成跳读了。 

比较涨姿势的地方还是网页资源加载与渲染的流程~

PS. 找配图可真难，特别是文章上方的大图，蛋疼~

***

##### 浏览器与浏览器内核

![浏览器与浏览器内核](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-浏览器与浏览器内核.png)

##### HTML网页与结构

![HTML网页与结构](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-HTML网页与结构.png)

##### Webkit架构和模块

![Webkit架构和模块](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-Webkit架构和模块.png)

##### 资源加载和网络栈

![资源加载和网络栈](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-资源加载和网络栈.png)

##### HTML解释器和DOM模型

![HTML解释器和DOM模型](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-HTML解释器和DOM模型.png)

##### CSS解释器和样式布局

![CSS解释器和样式布局](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-CSS解释器和样式布局.png)

##### 渲染基础

![渲染基础](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-渲染基础.png)

##### 硬件加速机制

![硬件加速机制](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-硬件加速机制.png)

##### JavaScript引擎

![JavaScript引擎](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-JavaScript引擎.png)

##### 插件与JavaScript扩展

![插件与JavaScript扩展](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-插件与JavaScript扩展.png)

##### 安全机制

![安全机制](http://7sbmuq.com1.z0.glb.clouddn.com/WebKit-安全机制.png)