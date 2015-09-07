title: 继续梳理-js中坑坑哒词法作用域、变量及函数声明提升
categories:
  - Code
tags:
  - Javascript
date: 2015-03-22 19:50:00
---
先来题目，猜猜运行结果是什么：
```
console.log(a);
var a = 1;
```
<!-- more -->
第二道：
```
myName = "global";
 
function foo() {
    alert(myName);
    var myName = "local";
    alert(myName);
}
 
foo();
```
OK，再来一道：
```
var x = 0;
var test = function(){
    x=1;
};
test();
console.log(x);
function test(){
    x = 2;
}
test();
console.log(x);
```
最后一道阮老师出的：
```
function a(x,y){
    y = function() { x = 2; };
    return function(){
  	    var x = 3;
	      y();
   	    console.log(x);
    }.apply(this, arguments);
}
 
a(1);
```

公布答案：

第一道：undefined

第二道：undefined  "local"

第三道：1 1

第四道：3

解释答案前，先来看个概念吧：

##### 词法作用域

变量的作用域是在定义时决定而不是执行时决定，也就是说词法作用域取决于源码，通过静态分析就能确定，因此词法作用域也叫做静态作用域。 with和eval除外，所以只能说JS的作用域机制非常接近词法作用域（Lexical scope）。js中，当定义了一个函数后，当前的作用域就会被保存下来，并且成为函数内部状态的一部分。

额外补充知识：

>解释型语言，通过词法分析和语法分析得到语法分析树后，就可以开始解释执行了。这里是一个简单原始的关于解析过程的原理，仅作为参考，详细的解析过程（各种JS引擎还有不同）还需要更深一步的研究
JavaScript执行过程，如果一个文档流中包含多个script代码段（用script标签分隔的js代码或引入的js文件），它们的运行顺序是：
步骤1. 读入第一个代码段（js执行引擎并非一行一行地执行程序，而是一段一段地分析执行的）
步骤2. 做词法分析和语法分析，有错则报语法错误（比如括号不匹配等），并跳转到步骤5
**步骤3. 对【var】变量和【function】定义做“预解析“（永远不会报错的，因为只解析正确的声明）**
步骤4. 执行代码段，有错则报错（比如变量未定义）
步骤5. 如果还有下一个代码段，则读入下一个代码段，重复步骤2
步骤6. 结束

步骤3中的预解析时，将所有的变量的声明语句和函数声明提升到代码的头部，这叫做变量提升和函数声明提升。

第一道题，实际是这样的：
```
//var a;
console.log(a);//undefined
var a = 1;
```
第二道题：
```
myName = "global";
 
function foo() {
    //var myName;
    alert(myName);//undefined
    var myName = "local";
    alert(myName);//"local"
}
 
foo();
```
第三道题：
```
//var test
function test(){
    x = 2;//函数声明也被提到前面来了。
}

var x = 0;
var test = function(){
    x=1;//重写了函数声明~~~
};
test();
console.log(x);
test();
console.log(x);
```
第四道题涉及的是静态作用域。
```
function a(x,y){
    y = function() { x = 2; };
    return function(){
        var x = 3;
        y();
        console.log(x);
    }.apply(this, arguments);
}
 
a(1);
```

根据js的词法作用域，函数y的作用域在定义时确定。所以我们可知，y函数的作用域链包括其自身、函数a()、全局函数。即使将其放在匿名函数中执行，其作用域链也是不变的。所以，在匿名函数中执行时，其要更改的是a()函数中的x变量。然而我们可以看到，匿名函数中重新定义了x。此时的x是属于匿名函数的，所以y()的操作并不能对其生效。

如果我们把题改一改：
```
function a(x,y){
    y = function() { x = 2; };
    return function(){
        x = 3; //去掉var
        y();
        console.log(x);
    }.apply(this, arguments);
}
 
a(1);
```

此时输出为2.因为在匿名函数中并没有重新定义x，而是执行了修改x的值的操作。此时的x即为a()中的x——那么y()函数的操作自然也对其生效了。