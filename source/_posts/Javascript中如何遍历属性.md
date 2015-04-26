title: Javascript中如何遍历属性
categories:
  - Code
tags:
  - Javascript
date: 2015-04-16 23:25:00
---

JS中遍历对象的属性有多种情况。对象的属性即有属于自身的，也有从原型链上继承而来的。并且有的属性是可以枚举的，有的属性是不可枚举的，这由对象属性的可枚举性[[enumerable]]来确定。

遍历时我们可能用到的手段：

1. Object.keys(obj) 遍历某对象的自身的可枚举属性
2. Object.getOwnPropertyNames(obj) 遍历某对象的自身的所有属性
3. for in 遍历某对象的自身和继承的可枚举属性(如果结合hasOwnProperty可过滤继承的属性实现1)
4. 至于遍历某对象的自身和继承的所有属性，需要结合2与3点。