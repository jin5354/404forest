title: 如何区分js中的各种数据类型
categories:
  - Code
tags:
  - Javascript
date: 2015-01-28 17:35:41
---
题目：如何判断某个变量是以下中的哪种数据类型？

类型为：String、Number、Boolean、Function、Regexp、Date、Null、Undefined、Error、Array。

<!-- more -->

刚看到题时第一直觉是用instanceof和typeof来判断。typeof 可用来区分number、string、boolean、function、undefined。
instanceof可用来判定实例，所以可以来判断Array、RegExp、Date、Error。
判断Null用if (!exp && typeof exp != "undefined" && exp != 0)来判断。

关于null要注意的是：

* typeof null为object;
* null在==运算时等于undefined;
* null与undefined的判断时均会自动转为false;
* null在数值运算中会自动转为0，而undefined会转为NaN。

还有一点，对于String和Number。如果直接创建，不使用构造函数，由于变量不是对象，可以使用typeof判断，不能用instanceof判断。如果用new String()构造函数来创造变量，则可以使用instanceof判断，typeof判断为object。

``` javascript
var a = "text1";
console.log(a);	//"text1"
console.log(typeof a);	//"string"
console.log(a instanceof String);	//false
console.log(a instanceof Object);	//false

var b = new String('text2');	
console.log(b);		//"text2"
console.log(typeof b);		//"object"
console.log(b instanceof String);	//ture
console.log(b instanceof Object);	//ture
```


翻别人答案时发现果然有更简单粗暴的方式：Object.prototype.toString()。这个方法用来返回一个对象的字符串形式。使用call就可以在任意值上调用啦。

不同数据类型的toString()返回值如下~

* 数值：返回[object Number]；
* 字符串：返回[object String]；
* 布尔值：返回[object Boolean]；
* undefined：返回[object Undefined]；
* null：返回[object Null]；
* 对象：返回"[object " + 构造函数的名称 + "]"；

这样已经可以把以上10种区分出来。上文说的两种String和Number都可以得出正确结果；若要分的再细一点，把NaN（默认在Number里）分出来，用isNaN()辅助判断一下即可。

用正则把返回值中的类型信息提取出来：

``` javascript
var ret = Object.prototype.toString.call(val).match(/[A-Z]\w+/)[0];
```

判断函数如下：

``` javascript
var typer = (function(){
  function type(val, expected) {
    var ret = Object.prototype.toString.call(val).match(/[A-Z]\w+/)[0]
    return ret != 'Object' ? 
           ret === expected :
           val.constructor.toString().match(/\b\w+/g)[1] === expected;
  }
  
  return {
    isNumber:    function(x){return type(x,'Number') && !isNaN(x)},
    isString:    function(x){return type(x,'String')},
    isArray:     function(x){return type(x,'Array')},
    isFunction:  function(x){return type(x,'Function')},
    isDate:      function(x){return type(x,'Date')},
    isRegExp:    function(x){return type(x,'RegExp')},
    isBoolean:   function(x){return type(x,'Boolean')},
    isError:     function(x){return type(x,'Error')},
    isNull:      function(x){return type(x,'Null')},
    isUndefined: function(x){return type(x,'Undefined')}
  }
})()
```