title: 收集整理《JS高程》中用以解决IE兼容性问题的JS代码
categories:
  - Code
tags:
  - Javascript,兼容性
date: 2015-04-03 20:26:00
---

####跨浏览器中的事件处理程序与事件对象

######兼容性问题：

* DOM2级事件处理程序使用addEventListener()与removeEventListener()来添加与移除
* DOM0级和2级事件处理程序的作用域为所属元素作用域
* 而IE事件处理程序使用attachEvent()和detachEvent()，只能添加到冒泡阶段，作用域为全局作用域

跨浏览器的事件处理程序：

```
var eventUtil = {
    addHandler: function(element, type, handler){
        //先检查DOM2级事件处理程序，再检查IE事件处理程序，最后使用DOM0级事件处理程序
        if(element.addEventListener){
            element.addEventListener(type, handler ,false);
        }else if(element.attachEvent){
            element.attachEvent("on"+type, handler);
        }else{
            element["on"+type] = handler;
        }
    },
    removeHandler: function(element, type, handler){
        if(element.removeEventListener){
            element.removeEventListener(type, handler ,false);
        }else if(element.detachEvent){
            element.detachEvent("on"+type, handler);
        }else{
            element["on"+type] = null;
        }
    }
}
```

<!-- more -->

######兼容性问题：

* 指定事件处理程序时DOM0级和2级都会传入event对象。事件处理程序内部，对象this始终等于currentTarget,target为事件实际目标。阻止特定事件的默认行为，使用preventDefault()方法。阻止事件传播使用stopPropagation()。
* 在IE中，若使用DOM0级事件处理程序，event对象作为window对象一个属性存在。若使用IE事件处理程序，event对象会传入事件处理函数。在IE的event对象中，srcElement为事件实际目标。阻止特定事件的默认行为，将returnValue值设为false。阻止事件传播，将cancelBubble设置为true。不能认为this始终指向事件目标。

跨浏览器的事件对象：

```

```