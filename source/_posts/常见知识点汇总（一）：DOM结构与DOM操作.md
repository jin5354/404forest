title: 常见知识点汇总（一）：DOM结构与DOM操作
date: 2014-12-08 23:58:41
categories:
  - Code
tags:
  - Javascript
  - Front-end-Developer-Interview-Questions
  - 常见知识点汇总
---

##### 节点关系：

<!-- more -->

![node-relationship](http://my404forest.qiniudn.com/node-relationship.png)

节点关系可用上图概括。

***

##### 节点移动

由图知常见的移动方式：

* someNode.parentNode	_//移动至父节点_
* someNode.firstChild	_//移动至第一个子节点_
* someNode.lastChild	_//移动至最后一个子节点_
* someNode.childNodes[x]	_//移动至第x+1个子节点_
* someNode.nextSibling	_//移动至下一个兄弟节点_
* someNode.previousSibling	_//移动至上一个兄弟节点_

每个节点都有一个名为childNodes的属性，其中保存着一个NodeList对象。访问保存在其中的节点可以通过方括号或者item()来表示。

``` javascript
var firstChild = someNode.childNodes[0];
var firstChild = someNode.childNodes.item(0);
```

**关于NodeList**

> NodeList是一种类数组对象，可以保存一组有序的节点。虽然其可以使用方括号语法来访问，并且这个对象也有length属性，但并不是Array的示例。NodeList是基于DOM结构动态执行查询的结果，能够自动反映DOM结构变化并实时更新，而不是在第一次访问它的某个瞬间拍摄下来的一张快照。
> > 使用Array.prototype.slice()方法可以将NodeList及arguments转换为数组。

**关于子节点**

元素的childNodes属性中包含了它的所有子节点，子节点包括元素、文本节点、注释或处理指令等等，不同浏览器在看待这些节点方面存在显著不同。

``` javascript
<ul id="testlist">
	<li>LI1</li>
	<li>LI2</li>
</ul>
```
若代码为上，在IE中，ul元素有2个子节点，分别为两个li元素；在其他浏览器中，ul元素有5个子节点，包括2个li元素和3个文本节点（表示li元素间的空白符。）

示例：

<pre>
<ul id="testlist">
<li>LI1</li>
<li>LI2</li>
</ul>
<button onclick = "alert(getElementById('testlist').childNodes.length)">number of ul's childNodes</button>
</pre>


如果像下面这样去除空白符：

``` javascript
<ul id="testlist"><li>LI1</li><li>LI2</li></ul>
```

那么在所有浏览器中都会有相同的结果：ul元素有2个子节点，分别为2个li元素。

示例：

<pre>
<ul id="testlist2"><li>LI1</li><li>LI2</li></ul>
<button onclick = "alert(getElementById('testlist2').childNodes.length)">number of ul's childNodes</button>
</pre>


##### 节点操作


###### 创建

**创建元素节点**
``` javascript
var div = document.createElement("div");
```
在IE中，可以传入完整元素标签来创建：
``` javascript
var div = document.createElement("<div id=\"NewDiv\" class=\"box\"></div>");
```

**创建文本节点**
``` javascript
var textNode = document.createTextNode("<strong>Hello</strong> world!");
```

一般情况下每个元素只有一个文本子节点，但是可以为其添加多个，如果两个文本节点是相邻的同胞节点，那么这两个节点中的文本就会连起来显示。中间不会有空格。

**创建注释节点**
``` javascript
var comment = document.createComment("A comment");
```
浏览器不会识别位于</html>标签之后的注释，所以如果要访问注释节点，一定要保证其为<html>元素的后代（即位于<html>和</html>之间）。

**创建文档片段节点**
``` javascript
var fragment = document.createDocumentFragment();
```
**创建特性节点**
``` javascript
var attr = document.createAttribute("align");
```
特性节点不被认为是文档树的部分。相比直接引用特性节点，getAttribute()、setAttribute()、removeAttribute()方法更为常用。

###### 删除节点

**删除元素节点**
``` javascript
document.body.removeChild(thisDiv);
```

**删除特性节点**
``` javascript
thisDIV.removeAttribute('color'); 
thisDIV.removeAttributeNode(color);
```

###### 添加节点
``` javascript
var returnNode = someNode.appendChild(newNode);
```
appendChild()用于向**childNodes列表的末尾**添加一个节点。更新完成之后，appendChild()会返回新增的节点。
若传入appendChild()中的节点已经是文档的一部分，那么结果则是将该节点从原来的位置转移到新位置上。

如果要将节点插入至childNodes列表中某特定位置，可以使用：
``` javascript
insertBefore(要插入的节点,作为参照的节点);
```

###### 替换节点
``` javascript
replaceChild(要插入的节点，要替换的节点);
```

###### 移除节点
``` javascript
removeChild(要移除的节点);
```

###### 克隆节点
cloneNode()用于创建调用这个方法的节点的另一个完全相同的副本。它接受一个布尔值参数，在参数为true时，执行深复制，复制节点及整个子节点树；在参数为false时，执行浅复制，只复制节点本身。复制后的节点副本属于文档所有，为孤儿状态。
``` javascript
var deepList = myList.cloneNode(true);
var shallowList = myList.cloneNode(false);
```
> cloneNode()方法不会复制添加到DOM节点中的Javascript属性，例如事件处理程序等。

###### 查找节点
getElementsByTagName()：返回带有指定标签名的对象的集合。
getElementsByName()：返回带有指定名称的对象的集合。
getElementById() ：返回对拥有指定 ID 的第一个对象的引用。
getElementsByClassName()：返回带有指定类名的对象的集合。（HTML5新增）