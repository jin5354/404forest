title: 收集整理《JS高程》中用以解决IE兼容性问题的JS代码
categories:
  - Code
tags:
  - Javascript
  - 兼容性
date: 2015-04-03 20:26:00
---

大坑，边看边填。

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
var eventUtil = {
    addHandler: function(){
        ...
    },
    removeHandler: function(){
        ...
    },
    getEvent: function(event){
        return event?event:window.event;
    },
    getTarget: function(event){
        return event.target || event.srcElement;
    },
    preventDefault: function(){
        if(event.preventDefault){
            event.preventDefault();
        }else{
            event.eturnValue = false;
        }
    },
    stopPropagation: function(){
        if(event.stopPropagation){
            event.stopPropagation();
        }else{
            event.cancelBubble = true;
        }
    }
}
```

####在文本框中选择部分文字

######兼容性问题：

* 除IE8及之前版本外，其他浏览器都实现了setSelectionRange()方法
* 在IE8及之前版本中，若要在文本框中选择部分文字，必须先使用createTextRange()方法在文本框上创建一个范围，使用collapse()方法折叠到文本框的开始位置，然后使用moveStart()和moveEnd()将范围移动到位。

```
textbox.value = "Hello World!";

function selectText(textbox, startIndex, endIndex){
    if(textbox.setSelectionRange){
        textbox.setSelectionRange(startIndex, endIndex);
    }else if(textbox.createTextRange){
        var range = textbox.createTextRange();
        range.collapse(true);
        range.moveStart("character", startIndex);
        range.moveEnd("character", startIndex - endIndex);
        range.select();
    }
    textbox.focus();
}
```

####获取字符编码

######兼容性问题

* 在IE8及之前版本浏览器中，在event的keyCode属性中保存字符的ASC2编码。
* 在其他浏览器中，在event的charCode属性中保存字符的ASC2编码，keyCode通常等于0或者所按键的键码。

```
var eventUtil = {
    getCharCode: function(event){
        if(typeof event.charCode == "number"){
            return event.charCode;
        }else{
            return event.keyCode;
        }
    }
}
```

####操作剪切板

######兼容性问题：

* 访问剪切板使用对象clipboardData；在IE中此为window对象的属性，时刻可访问；在FF、safari、chrome中为event属性，只有处理剪切板事件期间才可访问。

```
var eventUtil = {
    getClipboardText: function(event){
        var clipboardData = event.clipboardData || window.clipboardData;
        return clipboardData.getData("tetx");
    },
    setClipboardText: function(event, value){
        if(event.clipboardData){
            return event.clipboardData.setData("text/plain", value);
        }else if(window.clipboardData){
            return window.clipboardData.setData("text", value);
        }
    }
}
```