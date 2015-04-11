title: JS中的模块规范
categories:
  - Code
tags:
  - Javascript
  - 模块化
  - CommonJS
  - AMD
  - CMD
  - require.js
  - sea.js
date: 2015-04-11 12:38:00
---

在介绍JS模块化开发，CommonJS、AMD、CMD规范之前，我们有必要弄清楚一下：**为什么需要模块化开发？**

模块化是指在解决一个庞大的复杂问题或者一系列杂糅问题时，依照一种分类的思维将问题系统分解以之处理。模块化是一种将复杂系统分解为一系列代码结构更合理、可维护性可管理性更高的模块的方式。将系统分解为一组高内聚、低耦合的模块，使得无论多么大的系统，也可以在管理、开发、维护上有理可循。

采用模块化开发之后,理想状态下我们只需完成自己部分的核心业务逻辑代码，其他方面的依赖加载别人写好的模块即可。

#####JS的传统模块开发

JS并不是一种模块化编程语言，它不支持类，更不要提模块了。（ES6将正式支持类和模块，但还需要很长时间才能投入使用。）Javascript社区做了很多努力，在现有的运行环境中，实现"模块"的效果。

1.原始写法：

```javascript
function A(){
    //...
}
function B(){
    //...
}
```

缺点：污染全局变量，无法保证不和其他模块发生变量名冲突，模块成员之间看不出关系。

<!-- more -->

2.对象写法

```javascript
var module1 = new Obejct({
    _count: 0,
    m1: function(){
        //...
    }
    m2: function(){
        //...
    }
});
```

缺点：暴露模块成员，可以被直接修改

3.立即执行函数写法

```javascript
var module1 = (function(){
    var _count = 0;
    var m1 = function(){
        //...
    }
    var m2 = function(){
        //...
    }

    return {
        m1: m1,
        m2: m2
    }
})();
```
这样外部代码就无法读取内部成员。

4.放大模式

```javascript
var module1 = (function(mod){
    mod.m3 = function(){
        //...
    }

    return mod;
})(module1 || {});
```

这段代码为module1模块增添了一个新方法m3，然后返回一个新module1模块。由于在浏览器模块中可能无法知道哪个模块先加载，所以传入参数为(module1 || {})，也就是立即执行函数的参数可以是空对象

5.输入全局变量

独立性是模块的重要特点，模块内部最好不要与程序其他部分直接交互。

```javascript
var module1 = (function($, YAHOO){
    //...
})(JQuery, YAHOO);
```

module1模块需要JQuery和YUI库，就把和两个库（两个模块）当做参数输入module1中。这样做可以保证模块独立性，使得模块中的依赖关系更加明显。

#####CommonJS

CommonJS是服务器端模块的规范，Node.js采用了这个规范。 根据CommonJS规范，一个单独的文件就是一个模块。在CommonJS中，有一个全局性方法require()，用于加载模块。该方法读取一个文件并执行，最后返回文件内部的exports对象。假定有一个数学模块math.js，就可以像下面这样加载。

```javascript
var math = require('math');

math.add(2,3);
```

#####AMD与require.js

AMD是"Asynchronous Module Definition"的缩写，意思就是"异步模块定义"。它采用异步方式加载模块，模块的加载不影响它后面语句的运行。所有依赖这个模块的语句，都定义在一个回调函数中，等到加载完成之后，这个回调函数才会运行。

AMD也采用require()语句加载模块，但是不同于CommonJS，它要求两个参数：

```javascript
require([module], callback);
```

第一个参数[module]，是一个数组，里面的成员就是要加载的模块；第二个参数callback，则是加载成功之后的回调函数。如果将前面的代码改写成AMD形式，就是下面这样：

```javascript
require(['math'], function (math) {
    math.add(2, 3);
});
```
math.add()与math模块加载不是同步的，浏览器不会发生假死。所以很显然，AMD比较适合浏览器环境。

默认时候，一个网页加载多个JS文件很常见的：
```javascript
<script src="1.js"></script>
<script src="2.js"></script>
<script src="3.js"></script>
<script src="4.js"></script>
<script src="5.js"></script>
<script src="6.js"></script>
```

这样的写法有很大的缺点。首先，加载的时候，浏览器会停止网页渲染，加载文件越多，网页失去响应的时间就会越长；其次，由于js文件之间存在依赖关系，因此必须严格保证加载顺序（比如上例的1.js要在2.js的前面），依赖性最大的模块一定要放到最后加载，当依赖关系很复杂的时候，代码的编写和维护都会变得困难。

使用requireJS则可以解决这两个问题：

1. 实现js文件的异步加载，避免网页失去响应；
2. 管理模块之间的依赖性，便于代码的编写和维护。

require.js用法：

先加载：

```javascript
<script src="js/require.js"></script>
```

如果觉得这样加载也可能造成网页失去响应。那么一可以把它放在网页底部加载，二可以这么写：

```javascript
<script src="js/require.js" defer async="true" ></script>
```

async属性表明这个文件需要异步加载，避免网页失去响应。IE不支持这个属性，只支持defer，所以把defer也写上。
加载require.js以后，下一步就要加载我们自己的代码了。假定我们自己的代码文件是main.js，也放在js目录下面。那么，只需要写成下面这样就行了：

```javascript
<script src="js/require.js" data-main="js/main"></script>
```

data-main属性的作用是，指定网页程序的主模块。在上例中，就是js目录下面的main.js，这个文件会第一个被require.js加载。由于require.js默认的文件后缀名是js，所以可以把main.js简写成main。

主模块的写法:下面就来看，怎么写main.js。

如果我们的代码不依赖任何其他模块，那么可以直接写入javascript代码。

```javascript
    // main.js
    alert("加载成功！");
```

但这样的话，就没必要使用require.js了。真正常见的情况是，主模块依赖于其他模块，这时就要使用AMD规范定义的的require()函数。

```javascript
    // main.js
　　require(['moduleA', 'moduleB', 'moduleC'], function (moduleA, moduleB, moduleC){
　　　　// some code here
　　});
```

require()函数接受两个参数。第一个参数是一个数组，表示所依赖的模块，上例就是['moduleA', 'moduleB', 'moduleC']，即主模块依赖这三个模块；第二个参数是一个回调函数，当前面指定的模块都加载成功后，它将被调用。加载的模块会以参数形式传入该函数，从而在回调函数内部就可以使用这些模块。
require()异步加载moduleA，moduleB和moduleC，浏览器不会失去响应；它指定的回调函数，只有前面的模块都加载成功后，才会运行，解决了依赖性的问题。

假定主模块依赖jquery、underscore和backbone这三个模块，main.js就可以这样写：

```javascript
require(['jquery', 'underscore', 'backbone'], function ($, _, Backbone){
    // some code here
});
```

使用require.config()方法，我们可以对模块的加载行为进行自定义。

require.js加载的模块，采用AMD规范。也就是说，模块必须按照AMD的规定来写。具体来说，就是模块必须采用特定的define()函数来定义。如果一个模块不依赖其他模块，那么可以直接定义在define()函数之中。

假定现在有一个math.js文件，它定义了一个math模块。那么，math.js就要这样写：

```javascript
// math.js
　　define(function (){
　　　　var add = function (x,y){
　　　　　　return x+y;
　　　　};
　　　　return {
　　　　　　add: add
　　　　};
　　});
```

加载方法如下：

```javascript
// main.js
　　require(['math'], function (math){
　　　　alert(math.add(1,1));
　　});
```

如果这个模块还依赖其他模块，那么define()函数的第一个参数，必须是一个数组，指明该模块的依赖性。

加载非规范的模块:是可以的，这样的模块在用require()加载之前，要先用require.config()方法，定义它们的一些特征。详见参考资料。

#####CMD与sea.js

在CMD中，一个模块就是一个文件，格式为：`define(factory);`

全局函数define，用来定义模块。参数factory可以是一个函数，也可以为对象或者字符串。当factory为对象、字符串时，表示模块的接口就是该对象、字符串。

其与 AMD 规范用法不同。require 是 factory 的第一个参数。require(id);接受模块标识作为唯一的参数，用来获取其他模块提供的接口：

```javascript
define(function(require, exports ){
    var a = require('./a');
    a.doSomething();
});
```

require是同步往下执行的，需要的异步加载模块可以使用 require.async 来进行加载：

```javascript
define(function(require, exports, module) { 
    require.async('.a', function(a){
        a.doSomething();
    });
});
```
更多见参考资料，这里主要注意AMD与CMD的异同。

sea.js 核心特征：

1. 遵循CMD规范，与NodeJS般的书写模块代码。
2. 依赖自动加载，配置清晰简洁。

`seajs.use`用来在页面中加载一个或者多个模块

```javascript
// 加载一个模块 
seajs.use('./a');
// 加载模块，加载完成时执行回调
seajs.use('./a'，function(a){
    a.doSomething();
});
// 加载多个模块执行回调
seajs.use(['./a','./b']，function(a , b){
    a.doSomething();
    b.doSomething();
});
```
其define 与 require 使用方式基本就是CMD规范中的示例。

#####AMD与CMD的区别

这些规范的目的都是为了 JavaScript 的模块化开发，特别是在浏览器端的。目前这些规范的实现都能达成浏览器端模块化开发的目的。

区别：

1.对于依赖的模块，AMD 是提前执行，CMD 是延迟执行。不过 RequireJS 从 2.0 开始，也改成可以延迟执行（根据写法不同，处理方式不同）。CMD 推崇 as lazy as possible.
2.CMD 推崇依赖就近，AMD 推崇依赖前置。看代码：

```javascript
// CMD
define(function(require, exports, module) {
    var a = require('./a')
    a.doSomething()
    // 此处略去 100 行
    var b = require('./b') // 依赖可以就近书写
    b.doSomething()
    // ...
})

// AMD 默认推荐的是
define(['./a', './b'], function(a, b) { // 依赖必须一开始就写好
    a.doSomething()
    // 此处略去 100 行
    b.doSomething()
    // ...
})
```

3.AMD 的 API 默认是一个当多个用，CMD 的 API 严格区分，推崇职责单一。比如 AMD 里，require 分全局 require 和局部 require，都叫 require。CMD 里，没有全局 require，而是根据模块系统的完备性，提供 seajs.use 来实现模块系统的加载启动。CMD 里，每个 API 都简单纯粹。



**参考资料**

1. [Javascript模块化编程（一）：模块的写法](http://www.ruanyifeng.com/blog/2012/10/javascript_module.html)
2. [Javascript模块化编程（二）：AMD规范](http://www.ruanyifeng.com/blog/2012/10/asynchronous_module_definition.html)
3. [Javascript模块化编程（三）：require.js的用法](http://www.ruanyifeng.com/blog/2012/11/require_js.html)
4. [JavaSript模块规范 - AMD规范与CMD规范介绍](http://blog.chinaunix.net/uid-26672038-id-4112229.html)
5. [与 RequireJS 的异同 #277](https://github.com/seajs/seajs/issues/277)