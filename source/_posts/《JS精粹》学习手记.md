title: 《JS精粹》学习手记
categories:
  - Code
tags:
  - Javascript
  - 《Javascript语言精粹》
date: 2015-04-16 20:24:00
---

<!-- more -->

##### **第一章-语法**

###### 注释：/**/包围的块注释对于被注释的代码块是不安全的。例如正则的存在：

```javascript
/*
    var rm_a = /a*/.match(s);
*/
```

###### 语句：下面这些值在if语句中表达为假：

* false
* null
* undefined
* NaN
* ""
* 0

其他所有值都被当做真，包括true，字符串'false'，和所有的对象。

###### ||与&&

a&&b a为true，返回b。a不为true，返回a。
a||b a为true，返回a。a不为true，返回b。

###### 调用模式

**方法调用模式**

当一个函数被保存为对象的一个属性时，我们称它为一个方法。当一个方法被调用时，this被绑定到该对象。

**函数调用模式**

当一个函数并非对象的属性时，那么它就是被当做一个函数来调用的。以此模式来调用函数时，this被绑定到全局对象。

**构造器调用模式**

如果一个函数前面带上new来调用，那么背地里将会创建一个连接到该函数的prototype成员的新对象，同时this会被绑定到那个新对象上。

**Apply调用模式**

apple方法让我们构建一个参数数组传递给调用函数。它也允许我们选择this的值。apply方法接受两个参数，第一个是要绑定给this的值，第二个是参数数组。

###### 扩充类型的功能

蝴蝶书上说可以给类似Function.prototype增加方法来给基本类型扩充功能，实际上是不可取的。修改基本类型构造函数原型是一道高压线，万万不可触及，因为在使用框架和库时，很容易带来不可预知的兼容性问题。

###### 递归

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

###### 函数柯里化

函数也是值，从而我们可以用有趣的方式去操作函数值。柯里化允许我们把函数与传递给它的参数相结合，产生出一个新的函数。

```javascript
Function.prototype.curry = function(){
    var args = Array.prototype.slice(arguments);
    var that = this;
    return function(){
        return that.apply(null, args.concat(Array.prototype.slice(arguments)));
    }
}

function add(a, b){
    return a+b;
}

var add1 = add.curry(1);
add1(5);//6
```

###### 毒瘤

**全局变量**

全局变量就是在所有作用域中都可见的变量。因为一个全局变量可以被程序的任意部分任意时间更改，它们使得程序的行为变的极度复杂。在程序中使用全局变量降低了程序的可靠性。

**Unicode**

JavaScript的字符是16位的。

**null**

简单的检测null:  `my_value === null`

typeof不能分辨出null，它的返回值是object。但是除了null所有对象值均为真，从而可以判断：

```JavaScript
if(!my_value && typeof my_value === 'object') //为null
```

**判断是否是有效数字**

var isNumber = function(num){
    return typeof num === 'number' && isFinite(num);//isFinite函数可以过滤NaN和无限数字
}