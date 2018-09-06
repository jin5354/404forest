title: 预检请求(Preflight request) 与 Content-Type
categories:
  - Code
tags:
  - http
  - cors
toc: false
date: 2018-09-06 08:08:08
---
了解什么是预检请求（Preflight request），浏览器何时发送 OPTIONS 请求，以及常见的 Content-Type。

<!-- more -->

> 注：
> 原始链接: https://404forest.com/2018/09/06/preflight-request-and-content-type/
> 文章备份: https://github.com/jin5354/404forest/issues/68

最近在做一个项目的去 jQuery 化，在用 axios 替代 $.ajax 时，发现之前能成功的请求开始报错了，于是整理相关知识点，得出此文。

![post-1](/imgs/blog/post-1.png)

![post-2](/imgs/blog/post-2.png)

为什么用 axios 替代 $.ajax 后，出现了之前没有的 OPTIONS 请求，而且还报错了？

## 1. 预检请求

### 1.1 什么是预检请求

在 **HTTP访问控制(CORS)** 也就是 **跨域资源共享标准** 中新增了一组 HTTP 首部字段，允许服务器声明哪些源站有权限访问哪些资源。规范要求对那些可能对服务器数据产生副作用的 HTTP 请求方法（特别是 GET 以外的 HTTP 请求，或者搭配某些 MIME 类型的 POST 请求），**浏览器必须首先使用 OPTIONS 方法发起一个预检请求（preflight request）**，从而获知服务端是否允许该跨域请求。**服务器确认允许之后，才发起实际的 HTTP 请求**。

### 1.2 区分简单请求和预检请求

满足以下条件的请求为 **简单请求** :

1. 使用的请求方法为 **GET**、**HEAD** 或 **POST**。
2. 只使用 [Fetch 规范](https://fetch.spec.whatwg.org) 中定义的 [跨域安全的请求头](https://fetch.spec.whatwg.org/#cors-safelisted-request-header)，没有人为设置该列表之外的其他请求头。
  - Accept
  - Accept-Language
  - Content-Language
  - Content-Type
  - DPR
  - Downlink
  - Save-Data
  - Viewport-Width
  - Width
3. **Content-Type** 的值仅限于 **text/plain**、**multipart/form-data**、**application/x-www-form-urlencoded**。
4. 请求中的任意 XMLHttpRequestUpload 对象均没有注册任何事件监听器；XMLHttpRequestUpload 对象可以使用 XMLHttpRequest.upload 属性访问。
5. 请求中没有使用 ReadableStream 对象。(Fetch API 里的)

非简单请求即为需要预检的请求。可见现在广泛使用的 `Content-Type: application/json` 格式的 POST 请求，即为需要预检的请求。

## 2. 常见的 POST 提交数据方式

HTTP 请求中的 `Content-Type` 请求头描述了信息体的类型。`Content-Type` 的所有取值可以在该 [IANA 规范](http://www.iana.org/assignments/media-types/media-types.xhtml) 中查到。简单列一下常见的 `Content-Type`，留个大概印象:

- 文本
  - text/css
  - text/csv
  - text/html
  - text/javascript (obsolete)
  - text/plain
  - text/xml
- 图片
  - image/gif
  - image/jpeg
  - image/png
  - image/tiff
  - image/vnd.microsoft.icon
  - image/x-icon
  - image/vnd.djvu
  - image/svg+xml
- 音频媒体
  - audio/mpeg
  - audio/x-ms-wma
  - audio/vnd.rn-realaudio
  - audio/x-wav
- 视频媒体
  - video/mpeg
  - video/mp4
  - video/quicktime
  - video/x-ms-wmv
  - video/x-msvideo
  - video/x-flv
  - video/webm
- multipart
  - multipart/mixed
  - multipart/alternative
  - multipart/related
- 应用数据
  - application/EDI-X12
  - application/EDIFACT
  - application/javascript
  - application/octet-stream
  - application/ogg
  - application/pdf
  - application/xhtml+xml
  - application/x-shockwave-flash
  - application/json
  - application/ld+json
  - application/xml
  - application/zip
  - application/x-www-form-urlencoded

我们最常用的 POST 请求的 `Content-Type` 常使用下面几个取值，仔细了解一下。

### 2.1 application/x-www-form-urlencoded

最常见的提交数据方式，浏览器原生 `<Form>` 表单的默认提交方式。

```
POST http://vd.com/api/meta/getKeyById HTTP/1.1
Content-Type: application/x-www-form-urlencoded

type=0&id=27103
```

数据按照 `key1=val1&key2=val2` 的形式编码，与挂在 URL 上的参数类似，key 和 val 都要进行 `encodeURIComponent`。具有良好的服务器端支持，$.ajax 默认即使用 `Content-Type: application/x-www-form-urlencoded;charset=utf-8` 发送 POST 请求。

这种编码的缺点在于**弱类型**，丢失类型信息。发送一个 `a=false` 到服务器，服务器拿到的 key-value 都是字符串，那么就无法区分我想传过去的到底是布尔量 false 还是字符串 false。如果服务器端需要用户再手动转换，则未免过于麻烦，特别是 false 字符串要转成布尔量默认会转成 true，还得额外写逻辑；若是服务器框架靠『智能推测』自动转成布尔量 false，那万一我真想传字符串 `false` 怎么办？我还要再转回去，又陷入尴尬，只适合用来传类型不敏感的数据。

可以使用 qs 库来方便的进行数据编码。

### 2.2 multipart/form-data

使用浏览器 `<Form>` 表单上传文件，手动设置 `enctype` 为 `multipart/form-data`。许久没用了，直接在屈屈博客上拿个例子：

```
POST http://www.example.com HTTP/1.1
Content-Type:multipart/form-data; boundary=----WebKitFormBoundaryrGKCBY7qhFd3TrwA

------WebKitFormBoundaryrGKCBY7qhFd3TrwA
Content-Disposition: form-data; name="text"

title
------WebKitFormBoundaryrGKCBY7qhFd3TrwA
Content-Disposition: form-data; name="file"; filename="chrome.png"
Content-Type: image/png

PNG ... content of chrome.png ...
------WebKitFormBoundaryrGKCBY7qhFd3TrwA--
```

可以看到除了 `multipart/form-data` 还用 hash 生成了个分隔符 boundary，请求体内用分隔符分割多个文件，每个文件还有 `Content-Disposition`、`Content-Type` 等标识符。主要来用表单上传文件。

### 2.3 application/json

逐渐流行起来的格式，axios post 默认使用 `Content-Type: application/json`。请求体就是一段 json 了。

```
POST http://vd.com/api/meta/getKeyById HTTP/1.1
Content-Type: application/json;charset=UTF-8

{"type":0,"id":27103}
```

既然是 JSON 格式，就可以保留字段的类型信息，至少数字、字符串、布尔量可以区分，个人觉得胜过 `application/x-www-form-urlencoded`。

### 2.4 text/plain

这个就是最 plain 的文本格式了。如果你使用最新的 fetch api，默认就是用 `Content-Type: text/plain`。

实际上，请求头和请求体我们是可以自由控制的，当然是格式保持一致最好。不要出现请求头是 `application/x-www-form-urlencoded`，请求体却发送了个 JSON 过去。某些兼容性强的服务器框架可以『智能』推测出请求体类型并解码，但是换个服务器框架可能就报错了。更换项目中的 http 库时也要留意，可能发送请求的 `Content-type` 类型会发生改变。

## 3. 总结

现在再回头看项目出现的问题就很简单了：之前用 $.ajax 发的是 `Content-Type: application/x-www-form-urlencoded`，是简单请求；改成 axios 后默认发的是 `Content-Type: application/json`，变成了需要预检的请求，于是浏览器先发送了 OPTIONS 请求；服务器端的框架没有自动处理 OPTIONS，所以抛错。解决方法：修改服务器端配置使其支持 OPTIONS，或者本地发请求时手动指定成 `Content-Type: application/json` 都可以。

## 4. 参考资料

1. [HTTP访问控制（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)
2. [Content-Type](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Type)
3. [Fetch Standard - CORS-safelisted request-header](https://fetch.spec.whatwg.org/#cors-safelisted-request-header)
4. [四种常见的 POST 提交数据方式](https://imququ.com/post/four-ways-to-post-data-in-http.html)
5. [What are all the possible values for HTTP “Content-Type” header?](https://stackoverflow.com/questions/23714383/what-are-all-the-possible-values-for-http-content-type-header)
6. [Media Types](http://www.iana.org/assignments/media-types/media-types.xhtml)