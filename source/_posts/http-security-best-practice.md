title: HTTP 安全最佳实践
categories:
  - Code
tags:
  - nginx
  - http
  - https
  - security
toc: true
date: 2017-5-9 18:11:11
---

在上文[《配置 ssllabs A+ 评分站点》](https://www.404forest.com/2017/05/08/get-aplus-score-in-ssllabs-with-nginx-and-letsencrypt/)中，我们已经知道了如何部署一个高 SSL 健壮性的网站。但是上文配置后的站点用 [HTTP Security Report](https://httpsecurityreport.com/) 做检测，只拿到了 53 分。本文继续探讨提高 HTTP 安全性的各种措施。

<!-- more -->

# 1. 连接安全性与加密

## 1.1 SSL/TLS

传输层安全协议（Transport Layer Security / TLS）及其前身安全套接层（Secure Sockets Layer / SSL）为浏览器和服务器提供了端到端的加密手段，为互联网通信提供了安全可靠性保障。没有 TLS，其他安全手段不堪一击。TLS 是 HTTP 安全的基石。

然而 TLS 的部署不是一蹴而就的。协议版本与加密算法需要精心挑选与配置。你需要准备好权威机构签发的证书，并且牢固的保管好加密密钥。[Qualys SSL Labs](https://www.ssllabs.com/ssltest/) 提供了贴心的工具帮你优化 TLS 配置细节。（本博客的相关文章：[Nginx + Let's Encrypt 协力快速配置出 ssllabs A+ 评分的站点](https://www.404forest.com/2017/05/08/get-aplus-score-in-ssllabs-with-nginx-and-letsencrypt/)）

**建议**

- 对所有本地资源和引用资源都要妥善配置 TLS。

**兼容性**

- 所有主流浏览器均支持。

**部署情况占比（Alexa Top 500 站点中）**

- 使用 SSL/TLS：70.6%
- 未使用 SSL/TLS：29.4%

## 1.2 HTTP 严格传输安全 （HTTP Strict Transport Security / HSTS）

HSTS 使浏览器仅允许通过 HTTPS（SSL/TLS）方式连接服务器。这可以避免很多潜在的中间人攻击场景，包括 SSL stripping 攻击（中间人将页面中的 https 链接偷换为 http 链接），session cookie 窃取等。启用 HSTS 还可以阻止浏览器访问证书相关配置存在错误的站点。为 HTTPS 站点设置 HSTS 相关的返回头可以激活浏览器的 HSTS 功能。

HSTS 通过 `max-age` 字段设置过期时间。这个字段的值可以是一个固定秒数，也可以是一个固定日期（一般来说与证书到期的时间相符）。

通过向 [Chromium’s HSTS preload list](https://hstspreload.org) 中提交可以将网站加入主流浏览器内置的默认 HSTS 列表中。

注意 HSTS 也有一些小隐患：它的 `includeSubDomains` 会覆盖所有子域名，可能导致意料之外的覆盖过广的配置。并且，客户端可能出现无法访问的情况：假如客户端的时钟设置不当，造成浏览器认为 SSL 证书还未生效、已过期或者根证书丢失 —— 此时浏览器不会报证书错误，而是完全拒绝网页连接，同时（有可能）显示出只有专家才能看懂的非常晦涩的错误信息。

**建议**

- 设置较长过期时间的 HSTS 响应头，建议半年以上。
- 如：`Strict-Transport-Security: max-age=31536000`

**兼容性**

- 所有主流浏览器均支持。

**方法**

- 在 nginx 配置中， http - server - location block 中添加：
```
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains;preload" always;
```

**部署情况占比（Alexa Top 500 站点中（已部署 HTTPS））**

- 使用 HSTS： 28.4% （其中 86.7% 的站点设定了长过期时间） 例：twitter.com github.com taobao.com
- 部署 HTTPS 但未使用 HSTS： 71.6%

**扩展阅读**

- [HTTP Strict Transport Security | MDN](https://developer.mozilla.org/zh-CN/docs/Security/HTTP_Strict_Transport_Security)

## 1.3 HTTP 公钥固定（HTTP Public-Key Pinning / HPKP）

HTTP 公钥固定要求浏览器只在服务器提供已信任的某几张 SSL/TLS 证书（或者由已信任的中间证书/根证书签发的子证书）时才发起链接。这样，如果 SSL/TLS 证书发生预期之外的变化时，浏览器会拒绝访问。这可以避免多数证书欺诈场景。

举个例子，如果浏览器访问了配置了 HPKP 响应头的网站，那么站点要求浏览器在未来一段时间（过期时间）之内，只有服务器在证书链中存在已信任的证书时，才允许建立连接。这极大的降低了攻击者伪装服务器拦截数据的可能性。

像 HSTS 一样，部署 HPKP 前需要三思。错误的部署会导致用户无法访问你的站点，并且难以修复。

HPKP 不会保护来自本机的攻击。例如，使用 charles、fiddler 等调试工具检查 https 流量时，需要安装并信任调试工具提供的根证书。在 Chrome、Firefox 浏览器中，这种本地导入的根证书不会被 HPKP 策略拦截。这说明了 HPKP 并不保护来自本机的恶意软件的攻击。

**建议**

- 如果你确信你的站点需要 HPKP，先设定一个较短的过期时间做一下试验。一段时间没问题后，再使用长过期时间。一定要设置好备用指纹，提前为证书更换这种场景做好准备。
示例： `Public-Key-Pins: max-age=5184000; pin-sha256="+oZq/vo3Kcv0CQPjpdwyInqVXmLiobmUJ3FaDpD/U6c="; pin-sha256="47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU="`

**兼容性**

- Chrome、FireFox、Opera 支持， IE、EDGE、Safari 不支持。

**方法**

- 使用 openssl 生成证书指纹：
```bash
$ # 检查证书是否符合 x509 规范，顺便通过 CN 字段确认证书在证书链上的位置
$ openssl x509 -in chain.pem -noout -subject
# 确认该证书为 Let's Encrypt Authority X3 中间证书
subject= /C=US/O=Let's Encrypt/CN=Let's Encrypt Authority X3
$ # 生成公钥
$ openssl x509 -in chain.pem -noout -pubkey | openssl asn1parse -noout -inform pem -out public.key
$ # 生成指纹
$ openssl dgst -sha256 -binary public.key | openssl enc -base64
YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=
```

- 生成多个指纹（最少要求两个）后，最后修改 Nginx 配置并重新加载即可。（以下为本站配置）
```
add_header Public-Key-Pins 'pin-sha256="YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg="; pin-sha256="/DPi+1wSZeogvO1OfgffRC6vM2LfvjaCfUV5Q2tqqtY="; max-age=2592000; includeSubDomains';
```

**部署情况占比（Alexa Top 500 站点中（已部署 HTTPS））**

- 使用 HPKP：0.8% 例：Github.com
- 未使用 HPKP: 99.2%

**扩展阅读**

- [HTTP Public Key Pinning 介绍](https://imququ.com/post/http-public-key-pinning.html)

## 1.4 HTTP / HTTPS 内容混合

如果你的站点部署了 HTTPS 服务但页面中的某些资源（图片、js、css）由 HTTP 协议引入，会极大降低 HTTPS 安全性。这会导致 session cookie 等数据的泄露，还容易遭受注入攻击或中间人攻击。

**建议**

- 如果你的站点部署了 HTTPS，确保所有需要的资源都用 HTTPS 引入。

**部署情况占比（Alexa Top 500 站点中（已部署 HTTPS））**

- 全站 HTTPS：95.7%
- 存在混合内容：4.3%

**扩展阅读**

- [Mixed content | MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

# 2. 内容安全性

## 2.1 网页安全政策（Content Security Policy / CSP）

使用 CSP 可以提供一个白名单，明确的告诉浏览器哪些外部资源可以加载和执行。一个完善声明的 CSP 可以极大的加固页面安全性，防御 XSS 等注入式攻击。攻击者即使发现了漏洞也没办法注入第三方脚本，除非他还控制了白名单中的机器。

老项目中引入的资源可能散落在多处，难以整理出一个白名单。对于这种情况，可以使用 CSP 的 `report-only` 模式，该模式下不执行限制，只记录违规操作并上报至服务器。

所有新项目都建议使用 CSP。

**建议**

- 先阻止所有外部资源的引用。
Content-Security-Policy: default-src 'none';
然后逐步放开限制。允许某些域的 js，允许来自本站的 css、font、AJAX，等等
```
Content-Security-Policy: default-src 'none'; script-src 'self' https://code.jquery.com https://www.google-analytics.com; img-src 'self' https://www.google-analytics.com; connect-src 'self'; font-src 'self'; style-src 'self';
```
- 更松一点的配置是：默认情况下所有外部资源仅允许本域。不建议使用 `default-src '*'` 全部放开通行的配置。
```
Content-Security-Policy: default-src 'self';...其他自定义内容
```

**兼容性**

- 所有主流浏览器均支持 CSP 1.0，EDGE 15+ / Chrome 40+ / Safari 10+ / Android 5+ / iOS9.3+ 支持 CSP 2.0，Firefox 31+ 部分支持 CSP 2.0

**方法**

- 修改 Nginx 配置，http - server - location block 中添加：(本站配置)
```
add_header Content-Security-Policy "default-src 'self' *.google-analytics.com *.swiftypecdn.com *.swiftype.com *.gstatic.com *.disqus.com *.disquscdn.com *.google.com *.facebook.com *.pippio.com *.crwdcntrl.net *.bluekai.com *.exelator.com *.narrative.io disqus.com 'unsafe-inline'; img-src * data: blob:";
```

**部署情况占比（Alexa Top 500 站点中）**

- 已部署 CSP: 9.0% 例：zhihu.com （[知乎曾出现过的 XSS 问题，因为部署了 CSP 没有收到影响](http://weibo.com/2451315930/ECckdnjFl?from=page_1005052451315930_profile&wvr=6&mod=weibotime&type=comment)） github.com medium.com
- 未部署 CSP: 91.0%

**扩展阅读**

- [Content Security Policy 介绍](https://imququ.com/post/content-security-policy-reference.html)
- [Content Security Policy Level 2 介绍](https://imququ.com/post/content-security-policy-level-2.html)

## 2.2 Frame Options

Frame Options 控制页面是否允许被 `<iframe>`、`<frame>`、`<object>` 标签引入。禁止引入可以防止“点击劫持（Clickjacking）”式攻击。

其前身 `X-Frame-Options` 是一个非标准响应头。在 CSP 2.0 标准中已经被 `Frame Options` 取代。然而 CSP 2.0 还没普及，所以 `X-Frame-Options` 还在广泛使用中。

**建议**

- 取决于你的站点是否需要在 frame 中被渲染。使用 `deny` 完全禁止引入，或者使用 `sameorigin` 只允许同域引入。避免使用 `allow-from` 字段，因为兼容性很差。
X-Frame-Options: deny

**方法**

- 修改 Nginx 配置，http - server - location block 中添加：(本站配置)
```
add_header X-Frame-Options "deny";
```

**兼容性**

- `X-Frame-Options` 被所有主流浏览器支持。 `Frame-Options` 被所有支持 CSP 2.0 的浏览器支持。（参见 2.1 节）

**部署情况占比（Alexa Top 500 站点中）**

- 已部署 Frame Options：48.3% 例：google.com zhihu.com github.com
- 未部署 Frame Options：51.7%

**扩展阅读**

- [X-Frame-Options 响应头 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/X-Frame-Options)

## 2.3 XSS 保护（XSS Protection）

现在大多数浏览器都内建了跨站脚本攻击（XSS or CSS）保护功能。通常这个选项可以由用户手动在浏览器端关掉。因此，在响应头中显示声明启用 XSS 保护功能比较好。

相反，网站也可以要求浏览器在某些页面主动关掉 XSS 保护功能。最好不要这样做。浏览器提供的 XSS 保护机制不一定好用，但好歹也提高了攻击成本，开了总比不开强。

**建议**

- 添加响应头
- 如：`X-Xss-Protection: 1;mode=block`

**方法**

- 修改 Nginx 配置，http - server - location block 中添加：(本站配置)
```
add_header X-Xss-Protection "1;mode=block";
```

**兼容性**

- 除 Firefox 以外，所有主流浏览器均支持。

**部署情况占比（Alexa Top 500 站点中）**

- 已部署 Xss-Protection：96.1% 例：google.com github.com
- 未部署 Xss-Protection：3.9%

**扩展阅读**

- [X-XSS-Protection | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/X-XSS-Protection)

## 2.4 缓存控制（Cache Control）

指定页面的缓存策略。强烈建议手动指定页面缓存策略，否则会由浏览器和代理来控制是否缓存内容。一个不当的缓存策略可能会导致性能问题和安全问题。

**建议**

- 选择适合站点的缓存策略，并写在 HTTP 响应头中。

**方法**

- 修改 Nginx 配置，http - server - location block 中添加：(本站配置)
```
add_header Cache-Control "no-cache";
```

**兼容性**

- 所有主流浏览器均支持。

**部署情况占比（Alexa Top 500 站点中）**

- 显式指定缓存策略：74.6% 例：google.com baidu.com
- 未显式指定缓存策略：25.4%

**扩展阅读**

- [Cache-Control | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)

## 2.5 Content Type Options

通常浏览器根据响应头的 Content Type 字段分辨资源类型，但假若某些资源 Content Type 是错的或未定义，浏览器会启用 MIME-sniffing 来猜测该资源的类型，解析内容并执行。设想你的站点有图片上传功能，用户上传了一个 html 文档。这时即使服务器端声明该资源的 Content Type 为图片，浏览器依然会按照 html 来渲染并执行其中的脚本内容。通过非标准的 `X-Content-Type-Options` 响应头可以关闭浏览器的资源 MIME-sniffing 功能。

**建议**

- 始终设置该响应头：
- 如：X-Content-Type-Options: nosniff

**方法**

- 修改 Nginx 配置，http - server - location block 中添加：(本站配置)
```
add_header X-Content-Type-Options "nosniff";
```

**兼容性**

- 除 safari 外的所有主流浏览器均支持。

**部署情况占比（Alexa Top 500 站点中）**

- 部署 Content Type Options：21.9% 例： github.com twitter.com
- 未部署 Content Type Options：78.1%

**扩展阅读**

- [X-Content-Type-Options | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)

## 2.6 子资源完整性（Subresource Integrity / SRI）

通常情况下，浏览器都会从其他域内载入资源（比如 CDN）。既然资源托管在第三方服务器，就有被篡改的风险。SRI 通过对资源进行摘要签名的方式，保证外链资源不被篡改。

**建议**

- 为外链的 JavaScript、Style 文件设置 integrity 属性。例：
```html
<link crossorigin="anonymous" href="https://assets-cdn.github.com/assets/frameworks-81a59bf26d881d29286674f6deefe779c444382fff322085b50ba455460ccae5.css" integrity="sha256-gaWb8m2IHSkoZnT23u/necREOC//MiCFtQukVUYMyuU=" media="all" rel="stylesheet">
```
- 假如子资源完整性检查失败，资源就不会载入，往往导致页面无法正常工作。这是一种 “宁为玉碎，不为瓦全” 的策略。请一定要做好降级措施。比如当检查失败时，从本地或从其他域载入资源。

**方法**

- 如果使用 webpack 打包，可以使用 [webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity) 插件在打包时自动加入资源签名。

**兼容性**

- FireFox 43+、Chrome 45+、Opera 32+ 支持 SRI。

**部署情况占比（Alexa Top 500 站点中）**

- 部署 SRI 检查：0.4% 例： github.com
- 未部署 SRI 检查：99.6%

**扩展阅读**

- [Subresource Integrity 介绍](https://imququ.com/post/subresource-integrity.html)

## 2.7 Iframe Sandbox

网页中的 iframe 运行的脚本很可能影响到整个页面。为 iframe 指定 `sandbox` 属性可以对 iframe 中内容行为进行限制。

**建议**

- 为页面中的 iframe 添加合适的 `sandbox` 属性，只给必要的权限。
例：`<iframe src="https://example.com" sandbox="allow-same-origin allow-scripts"></iframe>`

**兼容性**

- 所有主流浏览器均支持。

**部署情况占比（Alexa Top 500 站点中）**

- 未检查到使用 iframe: 79.8%
- 使用 iframe，未使用 sandbox：20.0%
- 使用 iframe 且使用 sandbox：0.2%

**扩展阅读**

- [iframe | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe)

## 2.8 服务器时钟

服务器在所有响应中都会加入时间戳。时间戳不正确，在浏览器中可能不会引发错误，但是在其他系统或服务中可能会引发问题。

**建议**

- 使用网络时间协定（NTP）来保证服务器时钟准确。

**部署情况占比（Alexa Top 500 站点中）**

- 服务器时钟准确： 95.9%
- 服务器时钟不准确： 3.9%
- 不返回时间戳：0.2%

**扩展阅读**

- [What is NTP?](http://www.ntp.org/ntpfaq/NTP-s-def.htm)

# 3. 信息泄露

## 3.1 Server Banner

大多数服务器都会在响应头加入 Server Banner 来标明自己身份和版本号，比如：`server:nginx/1.10.0 (Ubuntu)`。这个头除了暴露服务器信息外，没什么实际用处。把这个响应头整个删掉通常也是没问题的，但是没必要做的这么狠。我们建议把版本号信息消除。这样，在某个版本暴露出 bug 后，可以降低引来他人攻击的可能性。

**建议**

- 消除 Server Banner 中的版本号。保留： `Server: nginx`

**方法**

- 修改 nginx 配置，在 http block 中加入：
```
server_tokens off;
```

**部署情况占比（Alexa Top 500 站点中）**

- 消除版本号：83.0% 例： github.com taobao.com
- 未消除版本号：17.0%

**扩展阅读**

- [How to configure your web server to not disclose it's identity](http://www.acunetix.com/blog/articles/configure-web-server-disclose-identity/)

## 3.2 Web 框架信息

很多 Web 框架都会设置响应头来标示自己身份、版本。这些响应头都是非标准的，而且也不影响页面渲染，只是为了框架自身的宣传。

与 3.1 同理。如果你用的 Web 框架的当前版本爆出漏洞新闻，那么这些响应头信息会让你成为攻击者的靶子。

**建议**

- 删除这些响应头：`X-Powered-By`, `X-Runtime`, `X-Version`, `X-AspNet-Version` 等。

**部署情况占比（Alexa Top 500 站点中）**

- 消除 Web 框架信息：85.7% 例：baidu.com github.com zhihu.com
- 未消除 Web 框架信息：14.3%

**扩展阅读**

- [Shhh… don’t let your response headers talk too loudly](http://www.troyhunt.com/2012/02/shhh-dont-let-your-response-headers.html)

# 4. Cookies

## 4.1 Cookie 安全

Cookies 中往往包含着敏感信息，比如 session ID。这些敏感 Cookie 需要添加 `secure` 字段，使其仅在 HTTPS 连接中被传递，在 HTTP 连接中不被传递。我们建议同时使用 HSTS 和 secure cookie。

session cookie 也应该被标记 `httponly` 字段，防止其被 javascript 访问。这可以阻止 XSS 攻击者窃取 session cookie。不敏感的 cookie 可以不加这个字段。但是呢，除非有明显的 javascrpit 操作需求，我们建议给所有的 cookie 都加入 `httponly` 字段。

**建议**

- 尽可能把所有 cookie 都加上 'secure' 和 'httponly' 字段。
例：`Set-Cookie: Key=Value; path=/; secure; HttpOnly, Key2=Value2; secure; HttpOnly`

**兼容性**

- 所有主流浏览器均支持。

**部署情况占比（Alexa Top 500 站点中）**

- 全 cookie secure: 8.6%
- 非全 cookie secure：91.4%

**扩展阅读**

- [HTTP cookies | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies)

# 5. 结语

本文原文来自[《HTTP Security Best Practice》](https://httpsecurityreport.com/best_practice.html)，我在译的时候同时加入了一些自己搜集整理的资料。

本文中对 Alexa Top 500 网站的数据统计来源自：[Alexa Top 500 Survey](https://httpsecurityreport.com/site_survey.html)，
撰写时数据统计至 2017 年 5 月 9 日。

可以看到，文中列出的措施部分较为严厉，为了安全有可能对可访问性造成损失。实际要部署哪些规则，需要根据网站实际情况选择。

最后附一张本站的 http security report。本站已经提交到 HSTS preload list 中，但是还没审核通过，所以有个小红叉。个人站就是用来折腾的，能上的策略基本都上了。

![HTTP Security Report](/imgs/blog/httpsecurityreport.png)

再看一眼业界标杆[屈老师博客](https://imququ.com)的评分：

![HTTP Security Report2](/imgs/blog/httpsecurityreport2.png)

不服不行。

# 6. 参考

1. [HTTP Security Report](https://httpsecurityreport.com/)
2. [What HPKP is but isn't](https://labs.detectify.com/2016/07/05/what-hpkp-is-but-isnt/)
3. [HTTP Public Key Pinning 介绍](https://imququ.com/post/http-public-key-pinning.html)
4. [Mixed Content - Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Security/MixedContent)
5. [CSP at Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/Security/CSP)
6. [知乎曾出现过的 XSS 问题，因为部署了 CSP 没有收到影响](http://weibo.com/2451315930/ECckdnjFl?from=page_1005052451315930_profile&wvr=6&mod=weibotime&type=comment)
7. [X-Frame-Options at Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/HTTP/X-Frame-Options)
8. [X-XSS-Protection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection)
9. [HTTP Caching Guide from Google Developers](https://httpsecurityreport.com/best_practice.html)
10. [X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)
11. [Subresource Integrity 介绍](https://imququ.com/post/subresource-integrity.html)
12. [HTML5 Rocks - Play safely in sandboxed IFrames](http://www.html5rocks.com/en/tutorials/security/sandboxed-iframes/)
13. [What is NTP?](http://www.ntp.org/ntpfaq/NTP-s-def.htm)
14. [How to configure your web server to not disclose it's identity](http://www.acunetix.com/blog/articles/configure-web-server-disclose-identity/)
15. [Shhh… don’t let your response headers talk too loudly](http://www.troyhunt.com/2012/02/shhh-dont-let-your-response-headers.html)
16. [OWASP Session Management Cheat Sheet - Cookies](https://www.owasp.org/index.php/Session_Management_Cheat_Sheet#Cookies)