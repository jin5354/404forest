title: （译）如何使用 Chrome Devtools 中的 Timeline 工具
categories:
  - Code
tags:
  - chrome devtools
  - 性能优化
  - timeline
  - 翻译
toc: true
date: 2016-08-18 16:00:11
---

使用 Chrome Devtools 中的 Timeline 面板可以记录并分析你的页面运行过程中的所有活动。如果你的页面存在性能问题，Timeline 工具是分析问题的最佳入手点。

<!-- more -->

 > 翻译好难！(ง •̀_•́)ง
 > 原文：[How to Use the Timeline Tool - Google Developers](https://developers.google.com/web/tools/chrome-devtools/profile/evaluate-performance/timeline-tool#make-a-recording)

# Timeline 面板概览

Timeline 面板由以下4部分组成：

1. **控制工具**。开启与关闭录制，配置录制时所需捕获的项目。
2. **概览**。提供页面性能的高度总结。更多信息在下方。
3. **帧图**。提供 CPU 堆栈追踪的可视化展现。
    > 你也许会在帧图里看到一到三条垂直的虚线。蓝线代表 `DOMContentLoaded` 事件。绿线代表第一次绘制发生的时间点。红线代表 `load` 事件。
4. **详情**。当选中了某个事件时，这里会显示事件详细信息。如果没有选中任何事件，这里会显示选中的时间段的详情。

![timeline-annotated](/imgs/blog/timeline-annotated.png)

## 概览面板

**概览**面板包括3个图表：

1. **FPS**。即每秒帧数。绿色柱形越高，FPS 越高。FPS 上面的红色方块代表着消耗较长时间的帧，这种状况很可能造成掉帧。
2. **CPU**。即 CPU 资源。这个面积图展现出是哪种事件消耗了 CPU 资源。
3. **NET**。每一个颜色条代表了一个资源。颜色条越长，意味着请求资源花费的时间越长。颜色条浅色部分代表等待时间（Time to first byte（TTFB），从发出请求到接受到回应的第一个字节等待的时间）。深色部分代表传输时间（从开始下载到下载完毕所花费的时间）。
    > 颜色的含义：HTML 文件为蓝色。脚本文件为黄色。样式文件为紫色。图片等媒体文件为绿色。其他资源为灰色。

![overview-annotated](/imgs/blog/overview-annotated.jpg)

# 开始录制

想录制页面的加载（load）过程，先打开 Timeline 面板，随后打开想录制的页面，然后刷新。Timeline 工具会自动录制下页面的刷新加载全过程。

想要录制页面的某个交互细节，先打开 Timeline 面板，随后点击 Record 按钮（黑圆点）或者按快捷键（Mac：`cmd + e`，Linux、Windows：`ctrl + e`）开始录制。录制时录制按钮会变成红色。操作页面，再次点击 Record 按钮或按快捷键结束录制。

当录制完成后，DevTools 会猜测录制的哪一部分最关键，然后自动缩放到该部分。

## 录制时的小 tips

- **录制时间尽量短**。更短的录制能让分析更容易。
- **避免无关的操作**。避免进行无关操作（如鼠标点击等）。例如，如果你只想录制点击登录按钮后发生的事件，那就别去做滚动页面等别的事。
- **禁用浏览器缓存**。当录制网络请求时，最好去 Devtools 设置面板（Devtools 右上角三个点点按钮 -> More tools -> Network conditions -> Disk cache -> Disable cache）里把浏览器缓存禁用掉。
- **禁用浏览器扩展**。Chrome 扩展会对 Timeline 的录制产生干扰。在隐身模式下打开新 Chrome 窗口，或者创建一个新 Chrome 用户来保证浏览环境没有扩展干扰。

# 查看录制细节

当你在**帧图**中选择了一个事件，**详情**面板就会显示该事件的更多信息。

![details-pane](/imgs/blog/details-pane.png)

有些标签，比如 **Summary**，在所有种类事件中都会显示。其他的标签只在特定种类事件中显示。浏览这篇文章 [Timeline 事件参考](https://developers.google.com/web/tools/chrome-devtools/profile/evaluate-performance/performance-reference) 可知每种录制事件的细节。

    > 一共有4种录制事件，Loading events、Scripting events、Rendering events、Painting events。

# 录制时截图

Timeline 面板能在页面加载时截图。这个功能又叫幻灯片。

若要在录制时截图，先在**控制工具**面板中启用 Screenshots 功能。截图会在**概览**面板下面显示。

![timeline-filmstrip](/imgs/blog/timeline-filmstrip.png)

把鼠标悬在截图或者概览面板上可以看到缩放后的录制瞬间的截图。鼠标从左向右移可以模拟页面展现过程。

# 检查 Javascript

想要在录制时捕获 Javascript 堆栈，在**控制工具**面板中启用 JS Profile 功能。功能启用后，你的帧图可以显示出调用了的每一个 Javascript 函数。

![js-profile](/imgs/blog/js-profile.png)

# 检查 painting

想要在录制时获得更多的 Paint 事件信息，在**控制工具**面板中启用 Paint 功能。功能启用后，在帧图中点击一个 Paint 事件，**详情**面板中会显示一个新的 Paint Profiler 标签，其中会展示更多关于该事件的颗粒状的信息。

![paint-profiler](/imgs/blog/paint-profiler.png)

## 渲染设置

打开 Devtools 主菜单， 选择 More tools > Rendering settings 可以看到一些有助于调试 paint 问题的工具。Rendering settings 会紧挨着 Console 抽屉面板打开！一个 Rendering 标签。（通过按 `esc` 来显示或隐藏 Console 抽屉面板）。

![rendering-settings](/imgs/blog/rendering-settings.png)

# 在记录中搜索

当观察事件时，也许你只想关注某一种事件。例如，你可能只需要检查每一个 `Parse HTML` 事件的详情。

在 Timeline 面板按快捷键（Mac：`cmd + f` 或者 Linux/Windows：`ctrl + f`）来打开搜索工具栏。输入你想观察的事件种类名，例如 `Event`。

搜索只会在选中的时间段内进行。时间段以外的事件不会被搜索。

按上下方向键可以按时间顺序切换搜索结果。所以，第一个结果代表的是时间段内被搜索到的最早的事件，最后一个结果代表时间段内被搜索到的最后一个事件。每次切换搜索结果时，你可以在**详情**面板中查看详细信息。按上下方向键与直接在**帧图**中点击事件是等同的。

![find-toolbar](/imgs/blog/find-toolbar.png)

# 缩放时间段

你可以缩放时间段来使分析更容易。帧图也会自动缩放来匹配时间段。

![zoom](/imgs/blog/zoom.png)

想要缩放：

- 在**概览面板**中，用鼠标进行拖拽
- 在时间标尺处调整灰色的滑标。

一旦选择好了时间段，你还可以使用 `W`, `A`, `S`, `D` 来调整区间。

# 存储与读取录制信息

在**概览**和**帧图**面板右击，就可以存储或者读取录制信息。

![save-open](/imgs/blog/save-open.png)

