title: 万级节点可视化全量渲染优化探究
categories:
  - Code
tags:
  - webgl
  - three.js
  - optimization
  - d3
toc: false
date: 2018-10-12 14:11:08
---
最近接了需求，10w 条社交分享数据做一张社交关系图，为了能宏观分析要全量渲染。本文探讨万级节点流畅渲染的优化手段。

<!-- more -->

> 注：
> 原始链接: https://www.404forest.com/2018/10/12/massive-data-visualization-full-rendering-optimization/
> 文章备份: https://github.com/jin5354/404forest/issues/69

本文代码已封装为组件 `D3-Force-Graph`，仓库地址 [https://github.com/jin5354/d3-force-graph](https://github.com/jin5354/d3-force-graph)。

渲染效果：

![pathTracker-gif1](/imgs/blog/pathTracker-gif1.gif)
![pathTracker-gif2](/imgs/blog/pathTracker-gif2.gif)

<center>GIF</center>

<br />

![pathTracker-15](/imgs/blog/pathTracker-15.png)

<center>局部关系</center>

<br />

![pathTracker-17](/imgs/blog/pathTracker-17.png)

<center>自定义头像、大小等</center>

<br />

<p><iframe height='350' scrolling='no' title='D3-Force-Graph Basic Demo' src='//webgl.run/embed/BkNKwElT7?lazyload=true' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe></p>

<center>小 Demo</center>

<br />

在浏览器端实时渲染一张大数据量的社交关系图并保证流畅体验需要多方面的优化，下面从图形渲染、数据 I/O、数据计算、细节等方面分享一些实战经验。

## 1. 图形渲染

社交分享原始数据格式如下：

```json
{
  "source": "sourceNodeName",
  "target": "targetNodeName"
}
```
10w 条原始数据，经过去重、去无效点、预加工之后可得约 5w 个节点，以及 4w 多条连线。这些数据保存在一个 Object 里，数据格式如下，约占用 10M 内存。

```json
{
  "nodes": ["A", "B", "C", ...],
  "links": [{
    "source": "A",
    "target": "B"
  }, {
    "source": "C",
    "target": "D"
  }, ...]
}
```

### 1.1 选型：d3-force 力导向图布局 + webgl 渲染

如何将这么多的点分布在画布上，并且疏密有致，最好还能安排大型结构体放在中央，散户放外围？力导向算法是一种图布局算法，它可以让点线关系以一种清晰又优美的姿态呈现。这种算法建立在粒子物理学的基础上，将每个节点模拟成原子，在每一帧都通过原子间的斥力（与线的束缚）产生节点的速度与加速度，生成新的位置。经过多次迭代之后，最终得到一个低能量的稳定布局。关于更多力导向算法的知识，可以查阅[d3-force](https://github.com/d3/d3-force)。

有了每个节点的位置，如何绘制点和线？我用 SVG 写了一个 [demo](https://webgl.run/list/H1eLdNjqX)，在我的机器上用 SVG 画 5000 个点就已经降到 10fps 了。可见不依赖硬件加速是无法实现万级节点绘制的。笔者对 three.js 还算熟悉，于是选择 webgl（three.js） 进行渲染。

<p><iframe height='300' scrolling='no' title='5k svg circles - WebGL Run' src='//webgl.run/embed/S1HRDVj9m?lazyload=true' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe></p>

<center>渲染 5k svg circle 示例，很卡</center>

<br />

### 1.2 粒子系统 + LineSegments + BufferGeometry

在 Three.js 中构造物体时，最常使用 `THREE.Geometry` 构造几何体。`Geometry` 是 Three.js 中的一种数据结构，其包含了几何体的顶点位置、颜色等等信息，储存信息时使用了 `THREE.Vector3`, `THREE.Color` 等数据结构，读写非常直观方便，但是性能一般。按照最寻常的思路，对于每个节点，我们需要使用 `THREE.CircleGeometry` 构造一个圆，对于每条线，我们需要使用 `THREE.Line` 构造一条线。

```javascript
// 最初版本
// 每个节点绘制一个圆
this.paintData.nodes.forEach((node) => {
  node.geometry = new THREE.CircleGeometry(5, 12)
  node.material = new THREE.MeshBasicMaterial({color: 0xAAAAAA})
  node.circle = new THREE.Mesh(node.geometry, node.material)
  this.scene.add(node.circle)
})

// 每条线绘制一个线段
this.paintData.links.forEach((link) => {
  link.lineMaterial = new THREE.LineBasicMaterial({color: 0xAAAAAA})
  link.lineGeometry = new THREE.Geometry()
  link.line = new THREE.Line(link.lineGeometry, link.lineMaterial)
  link.line.frustumCulled = false
  this.scene.add(link.line)
})
```

然而实测发现，这样绘制在 5K 节点时系统也会渲染的很吃力。如果要 three.js 绘制 5w 个 circle 对象，4w 多个 line 对象，每个 circle 对象又有 13 个顶点，总计要绘制 70 多 w 的顶点数。想要做优化，必须从减少顶点数，以及减少对象数等方面来着手。

对于区别不大的大量物体，使用[粒子系统](https://threejs.org/docs/#api/en/objects/Points)是一个好选择。在粒子系统里，每个节点只需一个顶点，上面贴一张圆形图案纹理即可。并且使用粒子系统后，可将数万个 circle 对象缩减为 1 个粒子系统对象，极大降低复杂度。

<p><iframe height='300' scrolling='no' title='three.js points 100k nodes' src='//webgl.run/embed/Hk7mY9T9Q?lazyload=true' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe></p>

<center>粒子系统渲染 100k 节点，毫无压力</center>

<br />

对于大量的直线段（无转折），可以使用 [`THREE.LineSegments`](https://threejs.org/docs/#api/en/objects/LineSegments)。`THREE.LineSegments` 使用 `gl.LINES`，可以传入一组顶点，每一对构成一条线段。这样就可以把数万个 line 对象缩减为 1 个 LineSegments 对象，极大降低复杂度。

粒子系统及 LineSegments 的缺点是，假如之后要调整**个别**粒子的颜色或大小，必须手写 GLSL Shaders。

> [D3-Force-Graph](https://github.com/jin5354/d3-force-graph) 支持自定义节点和线条的样式，比如调整[大小](https://github.com/jin5354/d3-force-graph/blob/master/src/shaders/nodes.vs#L7)、[颜色](https://github.com/jin5354/d3-force-graph/blob/master/src/shaders/lines.fs#L4)等，使用 GLSL 语言简单的编写了着色器。受限于篇幅本文不介绍 GLSL，有兴趣的同学可以[查看源码](https://github.com/jin5354/d3-force-graph/tree/master/src/shaders)了解。也可以看下笔者在学习 WebGL 时留下的一系列 Demo: [WebGL tutorial](https://webgl.run/list/H1BtgzNy8)。

`BufferGeometry` 是与 `Geometry` 相似的用来描述几何体的数据结构，其使用二进制数组来存储顶点位置、颜色等信息。Javascript 与显卡进行数据交换时必须使用二进制数据，若是传统文本格式则需要进行格式转化，非常耗时。`BufferGeometry` 可以将二进制数据原封不动送入显卡，显著提高脚本性能。在本文的场景下，万级节点的位置数组，颜色数组均有数M大小，使用 `BufferGeometry` 替换 `Geometry` 是必须的。

使用二进制数组降低了代码的可读性，但显著提升了性能。

```Javascript
// 这是绘制节点的部分代码
// 预准备节点，使用BufferGeometry，位置先统一定到 (-9999, -9999, 0)
point.geometry = new THREE.BufferGeometry()
// 使用二进制数组，每个节点需要 x,y,z 三个坐标确定位置，所以数组长度分配为 节点数 * 3
point.positions = new Float32Array(paintData.nodes.length * 3)
// 使用粒子系统，不再用几何体画圆，而是使用一张带透明背景的圆形图案 png
// 后期为了更高的灵活度，会将各种物体的 material 都替换为 ShaderMaterial
point.material = new THREE.PointsMaterial({
  size: 10,
  map: texture,
  transparent: true
})

// 填充位置的二进制数组，可读性有所下降，只能用下标+1,+2来找x,y,z了
paintData.nodes.forEach((e, i) => {
  point.positions[i * 3] = -9999
  point.positions[i * 3 + 1] = -9999
  point.positions[i * 3 + 2] = 0
})

...
// 绑定位置二进制数组
point.geometry.addAttribute('position', new THREE.BufferAttribute(point.positions, 3))
point.geometry.computeBoundingSphere()

let points = new THREE.Points(point.geometry, point.material)
// 节点加入场景
scene.add(points)

// 绘制线段
line.geometry = new THREE.BufferGeometry()
line.positions = new Float32Array(paintData.links.length * 6) //线段有起点终点，共6个位置
line.material = new THREE.LineBasicMaterial({
  vertexColors: THREE.VertexColors
})

// 所有点初始位置 (-9999, -9999, -0.1)
paintData.links.forEach((e, i) => {
  line.positions[i * 6] = -9999
  line.positions[i * 6 + 1] = -9999
  line.positions[i * 6 + 2] = -0.1
  line.positions[i * 6 + 3] = -9999
  line.positions[i * 6 + 4] = -9999
  line.positions[i * 6 + 5] = -0.1
})

line.geometry.addAttribute('position', new THREE.BufferAttribute(line.positions, 3))
line.geometry.computeBoundingSphere()

line.lines = new THREE.LineSegments(line.geometry, line.material)
scene.add(line.lines)
```

还有一个小技巧是：既然要用二进制数组，那么从逻辑最开始就一直使用二进制数组比较好，比如上段代码的 `Float32Array`。虽然你可以在业务中一直使用普通数组（普通数组比二进制数组多一些 api，还是更方便一点的），直到要将数据传入 three.js 时才调用 `THREE.Float32BufferAttribute` 将其转换，但这对于万级的数据量已经带来了严重的性能损耗。

![pathTracker-4](/imgs/blog/pathTracker-4.png)

<center>调用 Float32BufferAttribute 转换普通数组</center>

<br />

![pathTracker-5](/imgs/blog/pathTracker-5.png)

<center>直接使用二进制数组</center>

<br />

经过这样一番优化之后，绘制一帧耗时已经降到了 50ms 以下，全力绘制可以保证 15 ~ 30fps 的帧率，基本流畅。在布局结束之后，使用 Three.js 的控制插件进行拖拽、平移、缩放等查看操作时，稳定 60fps。

### 1.3 使用 web worker 避免主线程阻塞

在本文的数据量下，`d3-force` 进行每一帧的迭代大概需要 2s。所以我们可以看到这样的效果：

![pathTracker-3](/imgs/blog/pathTracker-3.png)

<center>上图为 5k 节点布局截图，近 200ms 一帧，5w 节点近 2s</center>

<br />

画面每 2s 动一次，看起来卡卡的，而且计算过程中主线程是阻塞的，UI 无反应，给人的体验非常差。我们可以将 d3-force 部分移入 worker 中，保证主线程的流畅。更详细的 demo 可见参考资料中的 [Force-Directed Web Worker](https://bl.ocks.org/mbostock/01ab2e85e8727d6529d20391c0fd9a16)。

```javascript
// main
this.worker = new Worker('worker.js')

// 将节点与线的信息传入 worker
worker.postMessage({
  nodes: nodes,
  links: links
})

// d3-force 每迭代完一次，将位置信息传送回来，执行回调
worker.onmessage = function(event) {
  switch (event.data.type) {
    case 'tick': return ticked(event.data);
    case 'end': return ended(event.data);
  }
}
```

```javascript
// worker.js
// 调用 d3-force 进行布局迭代
importScripts("https://d3js.org/d3-collection.v1.min.js");
importScripts("https://d3js.org/d3-dispatch.v1.min.js");
importScripts("https://d3js.org/d3-quadtree.v1.min.js");
importScripts("https://d3js.org/d3-timer.v1.min.js");
importScripts("https://d3js.org/d3-force.v1.min.js");

onmessage = function(event) {
  var nodes = event.data.nodes,
      links = event.data.links;

  var simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody())
      .force("link", d3.forceLink(links).distance(20).strength(1))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .stop();

  for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
    postMessage({type: "tick", progress: i / n});
    simulation.tick();
  }

  postMessage({type: "end", nodes: nodes, links: links});
}
```

### 1.4 补间动画

将 `d3-force` 布局计算移动到 worker 之后，主线程不再阻塞，但是受限于布局速度，画面还是 2s 动一次。在这 2s 的间隔中，主线程处于空闲，所以我们可以主动加入过渡动画提高流畅度。

![pathTracker-13](/imgs/blog/pathTracker-13.png)

<center>每 2s 渲染一次，主线程大部分时间在空绘制</center>

<br />

![pathTracker-7](/imgs/blog/pathTracker-7.png)

<center>补间原理</center>

<br />

举个例子，假如第 2000ms 时计算出了第一帧，位置 x = 5，4000ms 时计算出第二帧，位置 x = 10，我们就可以在 4000ms 时开始绘制，绘制的目标是：在 2000ms 的时间内 x 从 5 渐变到 10。那么调用执行 rAF 时，若当前时刻在 4400ms，那么当前位置应该在 (4400 - 4000) / 2000 * (10 - 5) + 5 = 6，即在此次执行时绘制 x = 6。由于 d3-force 每帧计算的时间比较稳定，而且越计算到后期速度稍微变快，所以补间策略可以略做调整，但大体思路是不变的。加入补间动画之后可以直接提升动画到 30fps 左右，体验大幅提升。

## 2. 数据 I/O

### 2.1 进度条

由于数据量变大，很多之前无需注意的小地方也成为了瓶颈，比如 10w 条数据大概 10M 左右大小，拉接口，计算，布局都需要一定时间，那么之前无需做 UI 提醒的部分就可以加入进度条。比如布局，`d3-force` 默认会迭代 300 次左右达到稳定状态，在本场景下调整参数改为迭代 50 次即可结束，那也需要 1 ~ 2 分钟。加入进度条可以更友好的提示用户。

![pathTracker-8](/imgs/blog/pathTracker-8.png)

### 2.2 Transferable ArrayBuffer

在将 `d3-force` 迁移到 worker 的过程中，我注意到了一个现象：

![pathTracker-6](/imgs/blog/pathTracker-6.png)

<center>调用 worker.postMessage 时，性能监控里有 100-200ms 的空白</center>

<br />

此时没有在执行什么函数，直觉告诉我这部分应该是主线程和 worker 线程交换数据的 I/O 损耗。在 MDN 上查阅 [postMessage 文档](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage) 发现：`postMessage` 还接收第二个参数，而这个参数只允许是 `Transferable` 类型，包括 `ArrayBuffer`, `MessagePort` and `ImageBitmap`，使用这个参数可以直接将该 Transferable 变量的控制权从主线程移交到 worker 线程。结合 Google 文章 [Workers ♥ ArrayBuffer](https://developers.google.com/web/updates/2011/09/Workers-ArrayBuffer) 的介绍：使用 `ArrayBuffer` 可有非常 easy 的在主线程和 worker 线程间传递二进制数据。换用 `ArrayBuffer` 的性能对比已经有人做过了，借用 [Examining Web Worker Performance](https://www.loxodrome.io/post/web-worker-performance/) 的对比图：

![pathTracker-9](/imgs/blog/pathTracker-9.png)

<center>不使用 Transferable，传递 100000 keys 的 Object 需要 400ms</center>

<br />

![pathTracker-10](/imgs/blog/pathTracker-10.png)

<center>使用 Transferable，传递只需 10ms</center>

<br />

于是将传递的数据进行改写，重构成 ArrayBuffer。这里同样牺牲了可读性（之前用对象描述，现在必须全平铺到数组里，并且 ArrayBuffer 传递字母和汉字很麻烦，最好映射成数字）换取性能。改为 ArrayBuffer 后的性能如下：

![pathTracker-11](/imgs/blog/pathTracker-11.png)

<center>和之前做下对比，I/O 时间基本可以忽略不计了</center>

<br />

## 3. 数据计算

### 3.1 复杂度优化

原始数据总是要预处理的，比如统计最有影响力的（分享数最多）的节点，筛掉没有分享关系的无用节点，进行数据剪裁等等。海量数据情况下，使用合适的算法就很重要了；初版写的很随意，遍历套遍历，复杂度较高，1w 数据还能接受，跑个几百 ms 出来了，10w 数据直接卡住六七秒。后来优化，多用 hashmap，空间换时间，改写了两三版，最终将计算耗时控制在 2s 以内，还算理想。

### 3.2 多 web worker 拆分

将计算过程迁移到 worker 中可以避免阻塞主线程，保证交互的流畅；然而为了最大化加速计算，我们可以拆分至多个 web worker 中，以此充分利用多核性能。[Javascript Web Workers Test v1.4.0](http://pmav.eu/stuff/javascript-webworkers/) 是一个 web worker 测试，测试可知在多核机器上，拆分确实可以显著缩短计算时间。借助浏览器接口 [navigator.hardwareConcurrency](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorConcurrentHardware/hardwareConcurrency) 我们可以获得处理器核心数，然后就可以拆分，比如 8 核机器拆出 7 个 worker 线程可以实现最大化利用核心。计算逻辑的拆分和结果的合并都需要自行设计，本文仅作了调研，由于计算耗时已经较短没有再做拆分工作。

## 4. 细节

### 4.1 避免 Vue 的 Observe

我们知道 Vue 会对 data 下的数据进行 Observe，然而当数据量非常大时，Observe 的耗时也很长，见下图：

![pathTracker-12](/imgs/blog/pathTracker-12.png)

<center>Observe 一个数万元素的数组，花了 90ms</center>

<br />

渲染时经常发生位置数组的赋值、变动等，如果每帧都触发这么个 90ms 的操作肯定是吃不消的，所以建议大数据量的数组和对象，尽量不要放在 data 下，避免 Observe 带来的耗时。

### 4.2 节能

在布局结束后，持续渲染也是很吃性能的，机器风扇会一直转；我们可以让鼠标 hover 在 canvas 上时才开启绘制，鼠标 mouseleave 到其他区域时终止绘制，这样就可以在纯展示时避免消耗机器性能了。

### 4.3 节流

在节点数量庞大时，节点头像的拉取和绘制会成为一个性能问题，一般来说当视野范围很大时，节点很小，图片无需加载，可以设置只有在经过缩放，节点大于一定程度（即场景相机 Z 坐标小于一定值）时才加载视口内头像。『判断视野内有哪些节点并加载』这个操作若在每帧都执行频率太高了，可以使用 throttle 技术限制到每秒执行一次；同时头像物体缓存起来，视野移动时进行动态卸载与加载，避免头像加载过多带来性能问题。

### 4.4 GPU 加速

服务器上头像图片都是方形的，但是绘制时我们想要圆形图像，怎么处理出圆角效果呢？按通常思路，我们可以借助 canvas api，画个圆填充图片，最后导出新图片（见张鑫旭大大文章：[小tip: SVG和Canvas分别实现图片圆角效果](https://www.zhangxinxu.com/wordpress/2014/06/svg-canvas-image-border-radius/)）。但由于我们具有操作片元着色器的能力，于是可以[直接在着色器上进行纹理的修改](https://github.com/jin5354/d3-force-graph/blob/master/src/shaders/image.fs#L23)，这里不但裁成了圆角，顺便还做了描边和抗锯齿。着色器直接运行在 GPU 上，性能很好。如果用软件模拟抗锯齿，开销肯定大得多。

![pathTracker-18](/imgs/blog/pathTracker-18.png)

<center>左：裁剪 + 抗锯齿 + 描边 右：只裁剪 </center>

<br />

一些演示图：

![pathTracker-14](/imgs/blog/pathTracker-14.png)

<center>全景图，还在布局中</center>

<br />

![pathTracker-16](/imgs/blog/pathTracker-16.png)

<center>切换视角</center>

## 5. 参考资料

1. [d3-force](https://github.com/d3/d3-force)
2. [Geometry - three.js docs](https://threejs.org/docs/#api/en/core/Geometry)
3. [BufferGeometry - three.js docs](https://threejs.org/docs/#api/en/core/BufferGeometry)
4. [ArrayBuffer - ECMAScript 6入门](http://es6.ruanyifeng.com/#docs/arraybuffer)
5. [Points - three.js docs](https://threejs.org/docs/#api/en/objects/Points)
6. [LineSegments - three.js docs](https://threejs.org/docs/#api/en/objects/LineSegments)
7. [Force-Directed Web Worker](https://bl.ocks.org/mbostock/01ab2e85e8727d6529d20391c0fd9a16)
8. [Workers ♥ ArrayBuffer  |  Web  |  Google Developers](https://developers.google.com/web/updates/2011/09/Workers-ArrayBuffer)
9. [Examining Web Worker Performance](https://www.loxodrome.io/post/web-worker-performance/)
10. [Worker.postMessage() - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage)
11. [Javascript Web Workers Test v1.4.0](http://pmav.eu/stuff/javascript-webworkers/)
12. [navigator.hardwareConcurrency - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorConcurrentHardware/hardwareConcurrency)
13. [Drawing Anti-aliased Circular Points Using OpenGL/WebGL](https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/)
14. [WebGL tutorial](https://webgl.run/list/H1BtgzNy8)