title: 《JS精粹》学习手记
categories:
  - Code
tags:
  - Javascript
  - 《Javascript语言精粹》
date: 2015-04-16 20:24:00
---

#####**第一章-语法**

######注释：/**/包围的块注释对于被注释的代码块是不安全的。例如正则的存在：

```javascript
/*
    var rm_a = /a*/.match(s);
*/
```

######语句：下面这些值在if语句中表达为假：

* false
* null
* undefined
* NaN
* ""
* 0

其他所有值都被当做真，包括true，字符串'false'，和所有的对象。

######扩充类型的功能

蝴蝶书上说可以给类似Function.prototype增加方法来给基本类型扩充功能，实际上是不可取的。修改基本类型构造函数原型是一道高压线，万万不可触及，因为在使用框架和库时，很容易带来不可预知的兼容性问题。

######递归

使用递归可以非常高效的操作树形结构。比如浏览器端的文档对象模型（DOM）。每次递归调用时处理指定的树的一小段。

```javascript
var walk_the_DOM = function(node, func){
    func(node);
    node = node.firstChild;
    while(node){
        walk_the_DOM(node, func);
        node = node.nextSibling;
    }
}
```

######函数柯里化

函数也是值，从而我们可以用有趣的方式去操作函数值。柯里化允许我们把函数与传递给它的参数相结合，产生出一个新的函数。

```javascript
Function.prototype.curry = function(){
    var args = Array.prototype.slice(arguments);
    var that = this;
    return function(){
        return that.apply(null, args.concat(Array.prototype.slice(arguments)));
    }
}
```


