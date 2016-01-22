title: 说说遇到的那些跨域，access control、jsonp、cookie、iframe
categories:
  - Code
tags:
  - 跨域
  - javascript
  - CORS
  - jsonp
date: 2016-01-22 10:38:21
---

想当年在学生时代时，自己一个人抱着前端书啃，写demo，也没个后端搭档，自然也没实际遇到过什么跨域问题，看书上讲的跨域问题和解决方案都是囫囵吞枣。现在工作了，各种跨域问题接触了个七七八八，今天再拎出来说一说。本文不求全，只说一些实用方案。

<!-- more -->

### 什么是同源（域、origin）策略？

如果两个页面拥有相同的协议（protocol），端口（如果指定），和主机，那么这两个页面就属于同一个源（origin）。

下表给出了相对http://store.company.com/dir/page.html同源检测的示例:

URL 结果  原因
http://store.company.com/dir2/other.html  成功
http://store.company.com/dir/inner/another.html 成功
https://store.company.com/secure.html 失败  协议不同
http://store.company.com:81/dir/etc.html  失败  端口不同
http://news.company.com/dir/other.html  失败  主机名不同

### 资源请求跨域

#### 使用CORS

CORS背后的基本思想就是使用自定义的HTTP头部让浏览器与服务器进行沟通，从而决定请求或响应是应该成功还是失败。

服务器端需要支持CORS，通过配置Access-Control-Allow-Origin来实现。

浏览器在发起请求时要注意语法：比如在使用XHR时，URL路径应使用绝对路径而非相对路径。IE9及以下浏览器应换用XDomainRequest进行跨域操作。

iconfont字体文件若缓存在cdn上，会出现跨域问题，可以使用这种方式解决。

#### 使用jsonp

当使用ajax请求跨域内容时，jsonp是最流行、最实用的解决方案。jsonp利用了script标签可以引入外部js资源的特点。

服务器端需要支持jsonp。返回一个由指定callback函数名包裹的json数据。例：

```
callback({
  data: 'test',
  result: '0'
})
```

jsonp的执行方式是：动态生成一个script标签，将url填入src中，将script标签append入body。由于script标签下载js资源无跨域限制，所以数据得到下载。随后由本地定义的callback函数对数据进行处理。

如果使用jsonp或zepto等库，其$.ajax方法均对jsonp做了处理，我们指定数据类型为jsonp后可以直接使用，免去了我们手动生成插入script标签的过程。

### cookie 跨域操作

跨顶级域名的cookie操作需要一定的hack手段，可以参考[这里](http://www.admin10000.com/document/291.html);

通过在创建cookie时设置domain参数，二级域名网页中可以直接写入顶级域名的cookie。例如，在a.404forest.com中可以直接读写404forest.com的cookie。可以通过将cookie写入公共的父域，实现跨子域名cookie读写。

### iframe 数据传递

跨顶级域名的iframe跨域操作需要一定的hack手段，可以参考[这里](http://www.cnblogs.com/snandy/p/3900016.html);

如果iframe跨自域名，需要先将父子iframe的document.domain均设置为相同的父级域名。随后父页面通过iframe的contentDocument或document属性访问到文档对象，进而可以取得子页面的信息；子页面可以通过parent访问到父页面。

### 其他

上面几种均是自己用过的，整理一些其他方案：

使用window.name来进行跨域：window对象有个name属性，该属性有个特征：即在一个窗口(window)的生命周期内,窗口载入的所有的页面都是共享一个window.name的，每个页面对window.name都有读写的权限，window.name是持久存在一个窗口载入过的所有页面中的。

使用HTML5的window.postMessage方法跨域：

window.postMessage(message,targetOrigin) 方法是html5新引进的特性，可以使用它来向其它的window对象发送消息，无论这个window对象是属于同源或不同源，目前IE8+、FireFox、Chrome、Opera等浏览器都已经支持window.postMessage方法。

参考资料：

1. [JavaScript 的同源策略](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policyV)
2. [js中各种跨域问题实战小结（一）](http://www.cnblogs.com/skylar/p/4094509.html)
3. [跨域iframe的高度自适应](http://www.cnblogs.com/snandy/p/3900016.html)
4. [关于Cookie跨域的问题](http://www.admin10000.com/document/291.html)
