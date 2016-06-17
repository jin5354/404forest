title: 为Alfred3编写一个汇率转换workflow——CurrencyConvert
categories:
  - Code
tags:
  - alfred
  - workflow
  - ruby
toc: true
date: 2016-06-16 10:15:11
---

打算使用 Alfred3 来替换 spotlight，但是网上找了一圈竟然没有好用的汇率转换 workflow，有一些适配 Alfred2 的放到 Alfred3 下面工作不正常，于是自己动手写了一个，顺便作为 ruby 的练手。

<!-- more -->

Alfred2 版本输出结果列表时使用 xml 语言，Alfred3 开始官方推荐使用json作为结果输出格式，所以该workflow不向下兼容v2版本。

[Github仓库](https://github.com/jin5354/alfred3-workflow-CurrencyConvert)
[Download](https://github.com/jin5354/alfred3-workflow-CurrencyConvert/releases)

### 功能

1. 调用 [fixer.io](fixer.io) 的接口，支持30+种货币
2. 支持基本的几个货币符号，如$,￥,£
3. 自定义主显的货币单位和基准货币单位

### 截图

输入 'cy' 来查看基准货币单位的最新汇率。回车将汇率数值发送到剪贴板。

![ss1](/imgs/blog/currencyconvert-ss1.png)

输入 'cy money' 来换算货币。回车将金额数值发送到剪贴板。

![ss2](/imgs/blog/currencyconvert-ss2.png)

输入 'add-cy' 和 'remove-cy' 来调整主显的货币单位。输入 'base-cy' 更改基准货币单位。

![ss3](/imgs/blog/currencyconvert-ss3.png)

### 杂谈

1. 包管理是门大学问。

2. ruby 语法糖真多，Array, String 下挂了七八十个方法.....好厉害

3. 电信网真的差，传 Github release 文件死活也传不上去，后来换成移动手机开热点才可以

参考：

1. [workflows](https://www.alfredapp.com/help/workflows/)
2. [Alfred workflow 开发指南](http://myg0u.com/python/2015/05/23/tutorial-alfred-workflow.html)