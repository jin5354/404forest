title: 谈谈网页中的Animation
categories:
  - Code
tags:
  - Javascript
  - html
  - css
  - canvas
  - Animation
date: 2015-08-24 20:47:41
coverImage: velocity.jpg
thumbnailImage: velocity_t.jpg
coverMeta: out
---

一个有关 Animation 的小小分享。

<!-- more -->

<iframe src="//slides.com/jin5354/css3-animations/embed" width="576" height="420" scrolling="no" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

##### 浏览器中的动画类型

###### 声明式

声明式动画，如 CSS3 Animation。 CSS3中的动画大多以 Animation 和 Transition 的形式来组成。

优点：
- 动画与应用分离，易于维护
- 计算消耗小
- GPU硬件加速

缺点：
- 受限于 cubic-bezier 曲线或 keyframes， 动画控制能力弱
- 只能满足基本的动画效果

###### 命令式

命令式动画，如 Javascript 动画、Canvas、WebGL 动画。主要特点是显式调用动画函数。

优点：
- 可以进行逐帧控制，实现一些高级动画效果，如物理模拟
- JavsScript 动画可兼容低等级浏览器

缺点：
- JavaScript 动画性能易出现问题，Canvas 和 WebGL 动画可以使用GPU加速，性能还不错
- 耦合
- Canvas、WebGL 可以实现像素级绘制与图像分析

##### 常见的两种 JavaScript 动画算法

###### 基于帧的动画算法（Frame-based）

- 使用浏览器的定时器 (setInterval/setTimeout)
- 以一定时间间隔执行动画函数
- 时间间隔决定FPS，当时间间隔为(1000/60)毫秒时，FPS为60
- JS定时器存在精度问题
- 性能问题，帧间隔不可控

示例代码：

方块下移400像素，时长1秒

```JavaScript
window.onload = function() {
  
  var div1 = document.getElementById('test1');
  
  var top = 0;
  var endTime;
  var startTime = Date.now();
  var ani1 = setInterval(function(){
    if(top <= 400){
      div1.style.top = top + 'px'; 
      top += 400/60;  
    }else {
      clearInterval(ani1);
      endTime = Date.now();
      console.log(endTime - startTime);
    }
  }, 1000/60);

};
```
可以看到这个动画的执行过程是：
每1/60秒执行1次，每次移动400/60像素，共移动400像素。如果帧间隔能稳定在1/60秒，那么总执行时长就是稳定1秒。
可惜帧间隔是无法稳定的，当你执行别的操作（比如点点面板显示按钮触发一下重绘）还会带来严重的性能损失。最终动画总执行时长总是略多于1秒，性能损失严重时可能达到1.5 ~ 2秒。

###### 基于时间的动画算法(Time-based)

- “弃帧保时”
- 依然可以使用setInterval()/setTimeout()
- 根据动画已进行时间计算进度，由进度决定动画状态
- 终态处理
- 保证时间准确

示例代码：

```JavaScript
window.onload = function() {
  
  var div1 = document.getElementById('test1');
  
  var top = 0;
  var start = null;
  var ani1 = setInterval(function(){
    if(!start) {start = Date.now();}
    var progress = Date.now() - start;
    if(progress <= 1000){
      div1.style.top = progress/1000*400 + 'px';  
    }else {
      div1.style.top = '400px';  
      clearInterval(ani1);
      console.log(progress);
    }
  }, 1000/60);

};
```

这个动画的执行过程：

每1/60秒执行一次，执行时先算出此时刻的动画已进行时长，折算为动画进行百分比，根据百分比决定移动位置。
由于是基于时间的动画算法，执行总时长一定是1秒（误差非常小）。

进化版：使用**requestAnimationFrame**

```JavaScript
window.onload = function() {
  
  var div1 = document.getElementById('test1');
  var div2 = document.getElementById('test2');
  
  var top = 0;
  var start = null;
  var ani1 = setInterval(function(){
    if(!start) {start = Date.now();}
    var progress = Date.now() - start;
    if(progress <= 1000){
      div1.style.top = progress/1000*400 + 'px';   
    }else {
      div1.style.top = '400px';  
      clearInterval(ani1);
      console.log(progress);
    }
  }, 1000/60);
  
  
  var start2 = null;
  function step(timestamp) {
    if (!start2) start2 = timestamp;
    var progress = timestamp - start2;
    div2.style.top = progress/1000*400 + "px";
    if (progress <= 1000) {
      window.requestAnimationFrame(step);
    }else{
      div2.style.top = '400px'; 
    }
  }

  window.requestAnimationFrame(step);
};
```
使用 requestAnimationFrame 浏览器可以优化并行的动画动作，更合理的重新排列动作序列，并把能够合并的动作放在一个渲染周期内完成，从而呈现出更流畅的动画效果。

对比动画可以看到，不使用 requestAnimationFrame 的动画可能存在颠簸效果，使用 requestAnimationFrame 的动画更加平滑。