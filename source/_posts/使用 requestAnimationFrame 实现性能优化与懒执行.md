title: 使用 requestAnimationFrame 实现性能优化与懒执行
categories:
  - Code
tags:
  - requestAnimationFrame
  - 性能优化
  - 懒执行
toc: true
date: 2016-08-15 16:00:11
---

去年在[《谈谈网页中的 Animation 》](/2015/08/24/谈谈网页中的Animation/)中曾经提到了 requestAnimationFrame 这个 API，非常适合用来做流畅的动画效果。其实除了做动画的优化，requestAnimationFrame 也可以做其他方面的性能优化。

<!-- more -->

### JS 懒执行

requestAnimationFrame 的执行时机是在页面重绘之前，我们知道浏览器中 JS 的执行是会阻塞页面渲染的，所以 requestAnimationFrame 的执行时机同样代表着当前 JS 线程的空闲。这样的话，在一些 JS 负荷较重的页面，我们可以通过对 JS 任务区分优先级，实现关键任务的优先加载，非关键业务的懒加载。

例如一个店铺首页页面，由多个JS模块构成：店铺信息、店长信息、商品详情、导航条……等等。为了缩短首屏可交互时间，优化体验，我们可以把首屏出现的3个模块定为“关键模块”，立刻加载并渲染；其他模块推送到懒加载序列，等待空闲时再运行。相比与所有模块一同加载并渲染，首屏模块先加载先展现，可以有效缩短首屏的等待时间。

```javascript
try {
    for (var i = 0; i < componentList.length; i++) {

        if(/601|602|701|702|703|801|802|803|/.test(componentList[i].sectionId)){
            loadComponent(componentList[i].sectionId);
        }else {
            window.requestAnimationFrame(function(){   //直接这么写真的好么？请看下文
                loadComponent(componentList[i].sectionId);
            });
        }
    };
} catch (e) {
    VTrace.report('error');
}
```

### 函数防抖（Debouncing）与节流（Throttling）

这是一个比较常被提起的话题，有时我们会写出一些高频率事件（常见于 mouseover、resize 事件或者 scroll 事件）：

拿常见的 lazyload（图片懒加载）举个例子：

```javascript
LazyLoad = {
    // ... 省略掉无关的代码 ...
    processScroll: function(){
        for (var i = 0; i < LazyLoad.images.length; i++) {
            if (LazyLoad.elementInViewport(LazyLoad.images[i])) {
                (function(i){
                    LazyLoad.loadImage(LazyLoad.images[i]);
                })(i)
            }
        };
    }
}

window.addEventListener('scroll', LazyLoad.processScroll);
```

上面是 lazyload 的一段必备逻辑：在滚动时，判断懒加载的图片有没有出现在视口中，如果出现了，那么真正加载图片。scroll 事件就是一个非常常见的高频率事件。当浏览器滚动时，一秒可以触发 scroll 事件几十上百次，若 scroll 绑定的事件内部处理较复杂，耗时较多，非常容易出现 CPU 占用率飙升，网页 FPS 突降的现象。

使用防抖（Debouncing）处理，代码如下：

```javascript
LazyLoad = {
    // ... 省略掉无关的代码 ...
    timer: null,
    processScroll: function() {
        if(LazyLoad.timer){
            clearTimeout(LazyLoad.timer);
            LazyLoad.timer = null;
        }
        LazyLoad.timer = setTimeout(function(){
            for (var i = 0; i < LazyLoad.images.length; i++) {
                if (LazyLoad.elementInViewport(LazyLoad.images[i])) {
                    (function(i){
                        LazyLoad.loadImage(LazyLoad.images[i]);
                    })(i)
                }
            };
        },200);
    },
}

window.addEventListener('scroll', LazyLoad.processScroll);
```

每次滚动后不是立即执行操作，而是使用 setTimeout 延时 200ms 后执行；如果连续多次触发 scroll 事件，后执行的操作会取消并重置计时器，也就是说连续滚动时不会执行操作，停手后的 0.2s 之后会执行操作。

这样做可以将多次的、连续的调用合并为一次。有效的防止了频繁触发事件带来的性能问题。缺点时：当用户一直滚动不放时，函数就一直不执行，用户就一直看不到图片。最佳做法是：高频率调用函数时，不能执行太频繁，但也不能一直不执行，至少要每 X 毫秒执行一次。这就是节流（Throttling）。

```javascript
LazyLoad = {
    // ... 省略掉无关的代码 ...
    timer: null,
    baseTimeStamp: null,
    processScroll: function() {
        var now = Date.now();
        if(!LazyLoad.baseTimeStamp) LazyLoad.baseTimeStamp = now;
        if(now - LazyLoad.baseTimeStamp > 200) {
            LazyLoad.loadImages();
            LazyLoad.baseTimeStamp = now;
            clearTimeout(LazyLoad.timer);
            LazyLoad.timer = null;
        }else {
            clearTimeout(LazyLoad.timer);
            LazyLoad.timer = null;
            LazyLoad.timer = setTimeout(LazyLoad.loadImages, 200);
        }
    },
    //抽出操作函数来复用..
    loadImages: function() {
        for (var i = 0; i < LazyLoad.images.length; i++) {
            if (LazyLoad.elementInViewport(LazyLoad.images[i])) {
                (function(i){
                    LazyLoad.loadImage(LazyLoad.images[i]);
                })(i)
            }
        };
    }
}

window.addEventListener('scroll', LazyLoad.processScroll);
```

上面代码就实现了节流（Throttling），即使用户一直滚动不放手，也会每 200ms 执行一次，完美实现高频率事件的性能优化。

这个 200ms 是由我们掌控的，一般会设置一个保守一点的数字。如果想榨干浏览器性能，可以使用 requestAnimationFrame 来做节流，让浏览器自动在空闲时执行操作，可以在性能优化的前提下，尽量多执行操作，增强用户体验。（0.2秒毕竟也要顿一下...）

requestAnimationFrame 只会将操作延迟到下次重绘前执行，并不会主动做节流；所以网上某些参考资料的实例代码是错误的，如：[http://www.ghugo.com/requestanimationframe-best-practice/](http://www.ghugo.com/requestanimationframe-best-practice/)中所说的：

```
var $box = $('#J_num2'),
    $point = $box.find('i');

$box.on('mousemove',function(e){
  requestAnimationFrame(function(){
    $point.css({
      top : e.pageY,
      left : e.pageX
    })
  })
});
```
仔细一看，mousemove 事件每秒被触发的次数依旧是数十次，这只是把这几十次的操作延迟到下一帧操作之前执行而已，使用 rAF 只能算做了个延时，并没有减少函数执行次数。真正做到节流，需要引入一个“锁”来控制。

```
var $box = $('#J_num2'),
    $point = $box.find('i');

var locked = false;

$box.on('mousemove',function(e){
  if(!locked){
    requestAnimationFrame(function(){
      changeCSS(e);
    });
    locked = true;
  }else {
    return;
  }
});

function changeCSS(e) {
  $point.css({
    top : e.pageY,
    left : e.pageX
  })
  locked = false;
}
```
引入一个 locked 变量表示当前能否响应操作；如果能，执行 rAF 后锁住，此时不再响应新请求；在 rAF 注册的函数执行完毕后解锁。这样即可保证一帧内只用 rAF 注册一次函数。

### 将 JS 打碎，分帧操作，避免阻塞 UI

[http://www.ghugo.com/requestanimationframe-best-practice/](http://www.ghugo.com/requestanimationframe-best-practice/)中的用法4提到了这一点，然而示例代码也有同样的问题：

```
//页面中有4个模块，A、B、C、D，在页面加载时进行实例化，一般的写法类似于：

$(function(){
    new A();
    new B();
    new C();
    new D();
})

//使用raf可将每个模块分别初始化，即每个模块都有16ms的初始化时间

$(function(){
    var lazyLoadList = [A,B,C,D];
    $.each(lazyloadList, function(index, module){
        window.requestAnimationFrame(function(){new module()});  //不太对
    });
})

```

同理，直接在循环里面使用 rAF 只是瞬间注册了多个操作，这些操作会全部累积起来到下一帧重绘前执行，实际上阻塞了下一帧。这种写法与不使用 rAF 的写法相比，只增加了一帧。要真的做到分帧操作，要这么写：

```
$(function(){
    var lazyLoadList = [A,B,C,D];

    var load = function() {
      var module = lazyLoadList.shift();
      if(module) {
        new module();
        window.requestAnimationFrame(load); //写个递归
      }
    }

    window.requestAnimationFrame(load);
})
```

在第一节中提出的问题也就很好回答了：既然都打算使用懒执行了，直接加入递归实现分帧操作是最好的选择。

### 测试

构建一个测试，看一看效果如何：

首先在页面上用 rAF 不停的跑一个修改UI的操作，触发 chrome timeline 面板对 frame 的持续记录。假设我们有个 JS 操作密集的页面，比如要串行加载许多模块：

```
function module(time) {   //构建耗时函数
    var startTime = Date.now();
    while(Date.now() - startTime < time){}
}

module(20);
module(15);
module(10);
module(10);
module(16);
module(5);
module(15);
module(18);
module(7);
module(30);
module(13);
module(10);
module(2);
module(9);

```
执行效果如下：

![rAF-test1](/imgs/blog/rAF-test1.png)

执行时狠狠的阻塞了一下，fps陡降至6，页面明显停顿一下。

试用一下 rAF 分帧执行：

```
var lazyLoadList = [
    function(){
        module(20);
    },function(){
        module(15);
    },function(){
        module(10);
    },function(){
        module(10);
    },function(){
        module(16);
    },function(){
        module(5);
    },function(){
        module(15);
    },function(){
        module(18);
    },function(){
        module(7);
    },function(){
        module(30);
    },function(){
        module(13);
    },function(){
        module(10);
    },function(){
        module(2);
    },function(){
        module(9);
    }
];

var load = function() {
    var module = lazyLoadList.shift();
    if(module) {
        module();
        window.requestAnimationFrame(load); //写个递归
    }else {
        return;
    }
};

window.requestAnimationFrame(load);

```

跑跑看结果：

![rAF-test2](/imgs/blog/rAF-test2.png)

虽然帧率也会下降，但是最低也能保证 20fps 以上(受限于那几个执行时间为20ms以上的模块)，页面不会赶到明显的顿卡，使用 rAF 可以比较有效的将阻塞“稀释”掉。进一步的优化则是要针对执行时间达到 20ms 以上的模块，尝试打碎逻辑；使每个模块的执行时间保证在 16.7ms 以内是最佳的。

> requestAnimationFrame最主要的意义，是降帧而非升帧，以防止丢帧。它的目的更类似于垂直同步，而非越快越好。
> MSDN: 帧率不等或跳帧会使人感觉你的站点速度缓慢。如果降低动画速度可以减少跳帧并有助于保持帧率一致，它可以使人感觉站点速度更快。
> 阅读更多：http://creativejs.com/resources/requestanimationframe/

### rAF polyfill 附录

rAF 在部分浏览器上还是需要使用polyfill，下面记录一个被广泛使用的版本：

```
// https://gist.github.com/miksago/3035015
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
})();
```

### 参考文章

1.[requestAnimationFrame最佳实践](http://www.ghugo.com/requestanimationframe-best-practice/)
2.[实例解析防抖动（Debouncing）和节流阀（Throttling）](http://jinlong.github.io/2016/04/24/Debouncing-and-Throttling-Explained-Through-Examples/)
3.[淘宝首页性能优化实践](http://www.barretlee.com/blog/2016/04/01/optimization-in-taobao-homepage/)
4.[聊一聊淘宝首页和它背后的一套](http://www.barretlee.com/blog/2016/06/02/thing-about-taobao-homepage/)
5.[naf.js](https://gist.github.com/miksago/3035015)