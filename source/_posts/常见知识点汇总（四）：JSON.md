title: 常见知识点汇总（四）：JSON
categories:
  - Code
tags:
  - Javascript
  - Front-end-Developer-Interview-Questions
  - 常见知识点汇总
date: 2014-12-19 10:36:41
---
JSON是一种数据格式，而非编程语言。它是基于JavaScript Programming Language, Standard ECMA-262 3rd Edition - December 1999的一个子集。

#####语法

JSON的语法可以表示以下三种类型的值：

* 简单值：使用与js相同的语法，可以在JSON中表示字符串、数值、布尔值和null。但JSON不支持js中的特殊值undefined。
* 对象：对象作为一种复杂数据类型，表示的是一组无序的键值对儿。
* 数组：表示一组有序的值的列表，数组的值也可以是任意类型——简单值、对象或数组。

<!-- more -->
***

######简单值
例如：
数值
``` JSON
5
```
字符串
``` JSON
"Hello World!"
```
js字符串与JSON字符串的最大区别在于：JSON的字符串必须使用双引号（单引号会导致语法错误。）
布尔值和null也是有效的JSON形式。

######对象

与js对象字面量相比，JSON对象区别在于：
1. 没有声明变量
2. 没有末尾分号
3. 对象属性任何时候都必须加双引号

例：
js对象
``` javascript
var object = {
	name: "Nicholas",
    age: 29
};
```
JSON的表示方式：
``` JSON
{
	"name": "Nicholas",
    "age": 29
}
```

######数组

JSON数组也没有变量和分号。

js中的数组字面量：
``` javascript
var values = [25, "hi", true];
```
JSON的表示法：
``` JSON
[25, "hi", true]
```

#####解析与序列化

JSON数据结构可以解析为有用的javascript对象。与XML数据结构要解析成DOM文档并且从中提取数据极为麻烦相比，JSON可以解析为javascript对象的优势极其明显。

IE8+及其他现代浏览器已经定义了全局变量JSON，对于较早版本的浏览器，可以使用一个shim。

JSON对象有两种方法：stringify()和parse()。在最简单的情况下，这两个方法分别用于把js对象序列化为JSON字符串以及把JSON字符串解析为原生javascript值。
``` javascript
var book = {
	title: "Professional Javascript",
    authors: [
    	"Nicholas C. Zakas"
    ],
    edition: 3,
    year: 2011
};

var jsonText = JSON.stringify(book);
```

默认情况下，JSON.stringify()输出的JSON字符串不包含任何空格字符和缩进，所以保存在jsonText中国年的字符串如下所示：

``` JSON
{"title":"Professional Javascript","authors":["Nicholas C Zakas"],"edition":3,"year":2011}
```

序列化时，所有函数及原型成员都会被忽略，值为undefined的任何属性也会被跳过。
将JSON字符串传递给JSON.parser()即可得到相应的js值，例如使用下列代码就可以创建与book类似的对象：
``` javascript
var bookCopy = JSON.parser(jsonText);
```

#####序列化选项
JSON.stringify()除了要序列化的javascript对象外，还可以接收另外两个参数，这两个参数用于指定以不同的方式序列化Javascript对象。第一个参数是个过滤器，可以是一个数组，也可以是一个函数，第二个参数是一个选项，表示是否在JSON字符串中保留缩进。

如果第二个参数是函数，行为会稍有不同。传入的函数接收两个参数，属性（键）名和属性值，根据属性（键）名可以知道应该如何处理要序列化的对象中的属性。

JSON.stringify()方法的第三个参数用于控制结果中的缩进和空白符。

如果JSON.stringify()方法还不能满足对某些对象进行自定义序列化的需求，可以给对象定义toJSON()方法，返回其自身的JSON数据格式。

#####解析选项
JSON.parser()方法也可以接收另一个参数，该参数是一个函数，将在每个键值对儿上调用。

如果还原函数返回undefined，则表示要从结果中删除相应的键；如果返回其它值，则将该值插入到结果中。