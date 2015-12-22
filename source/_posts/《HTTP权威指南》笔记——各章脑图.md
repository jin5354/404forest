title: 《HTTP权威指南》笔记——各章脑图
categories:
  - Code
tags:
  - HTTP
  - HTTPS
  - TCP
date: 2015-09-06 10:11:41
---

《HTTP权威指南》看起来厚厚的600多页，读起来确意外的轻松。不过对于这种工具书，通读一遍之后往往有种“学了好多新知识，但啥也没记住”的感觉。于是速读了第二遍并做了些笔记。

<!-- more -->

PS. 众所周知前几天shadowsocks项目被爆破了，我在linode上搭的ss也屡遭针对，后来不得已试着切换到了conoha东京机房，但是ss在使用了不到1天后依然被墙。后来尝试其他姿势，lantern时断时续的根本不好用，日本机房的VPS几乎都无法搭可行的ss了，后来试着用squid搭了个https代理，结果真的是秒封（笑），搭建完之后上了一下youtube，就30秒不到，就再也ping不通服务器了。现在在蹭同学搬瓦工的ss，速度不理想，勉强用用，唉，真惨。

不过前几天因为兴趣倒是研究了些shadowsocks、VPN的原理，正好也看了些HTTP、TCP知识，打算写篇有关翻墙的文整理一下。大概包括常用的翻墙手段的原理，以及针对某些梯子的GFW的封锁手段。

***

##### HTTP概述

![HTTP概述](http://7sbmuq.com1.z0.glb.clouddn.com/HTTP概述.png)

##### URL与资源

![URL与资源](http://7sbmuq.com1.z0.glb.clouddn.com/URL与资源.png)

##### HTTP报文

![HTTP报文](http://7sbmuq.com1.z0.glb.clouddn.com/HTTP报文.png)

##### 连接管理

![连接管理](http://7sbmuq.com1.z0.glb.clouddn.com/连接管理.png)

##### 代理

![代理](http://7sbmuq.com1.z0.glb.clouddn.com/代理.png)

##### 缓存

![缓存](http://7sbmuq.com1.z0.glb.clouddn.com/缓存.png)

##### 网关、隧道、中继

![网关、隧道、中继](http://7sbmuq.com1.z0.glb.clouddn.com/网关、隧道、中继.png)

##### 客户端识别与Cookie

![客户端识别与Cookie](http://7sbmuq.com1.z0.glb.clouddn.com/客户端识别与Cookie.png)

##### HTTP认证

![HTTP认证](http://7sbmuq.com1.z0.glb.clouddn.com/HTTP认证.png)

##### 安全HTTP

![安全HTTP](http://7sbmuq.com1.z0.glb.clouddn.com/安全HTTP.png)

##### HTTP实体与编码

![HTTP实体与编码](http://7sbmuq.com1.z0.glb.clouddn.com/HTTP实体与编码.png)