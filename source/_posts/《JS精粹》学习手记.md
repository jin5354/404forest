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

######