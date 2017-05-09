title: Nginx + Let's Encrypt 协力快速配置出 ssllabs A+ 评分的站点
categories:
  - Code
tags:
  - nginx
  - Let's Encrypt
  - blog
  - https
toc: true
date: 2017-5-8 16:24:11
---

免费 SSL 证书服务 Let's encrypt 刚出时，我曾经试着给本站部署过 HTTPS，在 chrome 下成功看到了小绿锁后就没多管了。直到前几天在 Github 上引用本站的图片时，发现图片无法成功显示（Github 使用 camo 服务来代理第三方图片），且 camo 报错 `Error Fetching Resource`，我才发现似乎本站部署 SSL 证书时存在问题。随后在 ssllabs 上检测本站 HTTPS，只得了 C 评分。于是仔细研究了下细节，将评分提到了 A+，并总结成此文。

<!-- more -->

## 1. 关于 ssllabs

[ssllabs](https://www.ssllabs.com/) 是一家非盈利研究组织，致力于收集与研究 SSL 相关文档、工具与讨论。ssllabs 希望引导大家更深层次的理解 SSL 的部署策略，以此促进 SSL 的进步。

ssllabs 提供了网站 SSL 检测工具，从安全、性能等多角度测试网站 SSL 部署情况。

## 2. 快速配置 Let's Encrypt

前提条件：拥有自己的域名和服务器，已安装 Nginx，并且域名的 A Record 指向了当前服务器的 IP 地址。

本文所使用 Linux 环境： Ubuntu 16.04 LTS。

记得去年第一次配置 Let's Encrypt 时，部署步骤还是非常繁碎的。现在已经非常简单了。

### 2.1 安装 `letsencrypt`

```bash
$ sudo apt-get install letsencrypt
```

### 2.2 获取证书

```
$ sudo service nginx stop # 先停止 nginx
$ sudo letsencrypt certonly --standalone
```

此时会出现 `letsencrypt` 的图形化界面：

![letsencrypt1](/imgs/blog/letsencrypt1.png)

输入邮箱地址，下一步：

![letsencrypt2](/imgs/blog/letsencrypt2.png)

同意服务条款，下一步：

![letsencrypt3](/imgs/blog/letsencrypt3.png)

输入服务器域名，在具有 DNS 记录的前提下，可以加上多个二级域名。稍等一会儿，证书就签发完毕，存放在 `/etc/letsencrypt` 文件夹下。

也可以不通过图形界面，直接使用命令行签发证书。

```bash
$ sudo letsencrypt certonly --standalone -d example.com -d www.example.com
```

签发完毕之后，在 `/etc/letsencrypt/live/example.com` 下可以看到4个文件：

- privkey.pem       证书私钥
- cert.pem          证书公钥
- chain.pem         中间证书链
- fullchain.pem     证书公钥 + 中间证书链的合并

## 3. 配置 Nginx

### 3.1 配置 HTTPS 服务

如果你曾经配置好了 HTTP 服务， Nginx 配置文件中应该有类似片段：

```
server {
        listen  80;
        listen [::]:80;
        server_name 404forest.com  www.404forest.com;
        location / {
                root    /root/blog;
                index   index.html;
        }
}
```
在 http block 中再添加一个 server 服务，用于部署 HTTPS：

```
server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name 404forest.com www.404forest.com;
        ssl_certificate /etc/letsencrypt/live/404forest.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/404forest.com/privkey.pem;
        location / {
                root    /root/blog;
                index   index.html;
        }
}
```

**注意在设定 `ssl_certificate`（即公钥）时最好使用 fullchain.pem 而不是 cert.pem。cert.pem 中不包含中间证书链的信息，某些客户端（比如 Github 使用的 camo）在连接时极有可能出现验证身份失败的情况。**

### 3.2 设置证书自动更新

Let's encrypt 签发的证书的有效期为3个月，到期之前我们要续约证书。

手动续约步骤：

```bash
$ sudo service nginx stop
$ sudo letsencrypt certonly --standalone -d 404forest.com -d www.404forest.com
$ sudo service nginx start
```

每3个月都手动续约一次太蛋疼了，还容易忘。我们可以使用 ubuntu 自带的 `cron` 定时任务工具，让 `letsencrypt` 工具每个月都自动更新一次证书，省心省事儿。

首先设置环境变量 EDITOR，`cron` 进程根据它来确定使用哪个编辑器编辑 crontab 文件：

```bash
$ vi ~/.profile
```

在其中加入这么一行，然后保存退出。

```
EDITOR=vi; export EDITOR
```

找个地方创建一个新的 crontab 文件：

```bash
$ vi ~/cron
```

写入定时任务：

```cron
0 4 1 * * sudo service nginx stop && sudo letsencrypt certonly --standalone -d 404forest.com -d www.404forest.com && sudo service nginx start
```

`0 4 1 * *` 这几个参数定义任务执行周期，这里的写法是每个月1号凌晨4点更新证书。参数用法可以查看参考资料中的 crontab 教程。

将文件提交给 cron 进程：

```bash
$ crontab ~/cron
```

检查当前 cron 在跑的任务：

```bash
$ crontab -l
```

如果列出了该定时任务，说明自动更新证书任务提交成功啦。

### 3.2 设置 HTTP 跳转

HTTPS 部署完毕后，我们可以强制将 HTTP 请求跳转到 HTTPS 上来保证安全性。

修改 HTTP 服务：

```
server {
        listen  80;
        listen [::]:80;
        server_name 404forest.com  www.404forest.com;
        return 301 https://$server_name$request_uri;
}
```

### 3.3 配置 DH 密钥交换组

此时我们的站点已经可以通过 HTTPS 访问了，没有问题。用 ssllabs 查一下：

![letsencrypt4](/imgs/blog/letsencrypt4.png)

拿到了 B 评分。下面有个提示：`This server supports weak Diffie-Hellman (DH) key exchange parameters. Grade capped to B。`

> DH 密钥交换算法的作用是使通信双方可以在不安全的通道中建立一个相同的密钥，用于加密通信。

也就是说，当前服务器支持一些安全程度低的 DH 密钥交换算法。我们需要手动配置 Cipher Suites，禁用不安全的 cipher 项。更多细节，可以参考该文： [Guide to Deploying Diffie-Hellman for TLS](https://weakdh.org/sysadmin.html)

首先生成健壮的2048位 DH 组：

```bash
$ openssl dhparam -out dhparams.pem 2048
```

随后配置 nginx，在 http block 中加入：

```
ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA:!DES-CBC3-SHA';

ssl_prefer_server_ciphers on; # 在 TLSv1 握手时，优先使用服务端的配置项
ssl_dhparam /root/dhparams.pem;
```

重启 nginx：

```bash
$ sudo nginx -s reload
```

### 3.4 启用长 HSTS

配置完 DH 密钥交换组，再用 ssllabs 检测，发现4项指标都绿了，评分为 A。我们只要再启用长 HSTS 就可以拿到 A+ 了。

> HSTS: 该字段要求浏览器不能通过 HTTP，而只能通过 HTTPS 访问某个网站。目前所有的主流浏览器都支持 HSTS。

配置 Nginx，修改 server block：

```
server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name 404forest.com www.404forest.com;
        ssl_certificate /etc/letsencrypt/live/404forest.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/404forest.com/privkey.pem;
        location / {
                root    /root/blog;
                index   index.html;
                add_header Strict-Transport-Security "max-age=31536000; includeSubDomains;preload" always;
        }
}
```

通过 3.2 节的配置，当用户以 HTTP 形式访问站点时，会通过 301 重定向到 HTTPS。使用 HSTS 之后，浏览器发现该站点的 response header 中存在 `Strict-Transport-Security` 这一项时，就会自动将站点加入浏览器的 HSTS 列表中。在设定的 `max-age` 秒数之内，当用户以 HTTP 形式访问站点时，浏览器将自动使用 HTTPS 访问站点，连 301 重定向都省了。

**可选：申请将站点加入到浏览器内置 HSTS 列表中：**

我们可以发现，浏览器只有在探测到 Strict-Transport-Security 字段之后，才会将站点加入 HSTS 列表，也就是说在首次访问站点时，依然是允许以 HTTP 形式访问站点的，这就带来了安全隐患。Chrome 浏览器内置了一个 HSTS 列表，其中默认包含了 Google、Twitter 等站点。如果想将自己的站点提交至 Chrome 默认 HSTS 列表中，可以通过这个网站：[HSTS Preload List Submission](https://hstspreload.org)。

将网站提交进内置列表中既意味着安全也意味着风险：假如你的站点的 HTTPS 部署挂掉了，用户是完全不可能通过降级至 HTTP 的形式进行访问的。

![letsencrypt5](/imgs/blog/letsencrypt5.png)

启用长 HSTS 后，顺利拿到 A+ 评分。

## 4. 赠品：部署 HTTP/2

启用 HTTP/2 非常简单，如果你使用 ubuntu 16.04，系统自带的 nginx 就提供了完美支持。如果你使用的系统低于16.04，可以参考 [配置Nginx，开启HTTP/2](https://iyaozhen.com/nginx-http2-conf.html)。

修改 Nginx 配置，在 ssl 后追加 http2 字段即可。

```
server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name 404forest.com www.404forest.com;
        ssl_certificate /etc/letsencrypt/live/404forest.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/404forest.com/privkey.pem;
        location / {
                root    /root/blog;
                index   index.html;
                add_header Strict-Transport-Security "max-age=31536000; includeSubDomains;preload" always;
        }
}
```

![letsencrypt6](/imgs/blog/letsencrypt6.png)

通过 Chrome devtool network 面板可以看到 HTTP/2 已经成功启用。

> HTTP/2 的几大特性：
> 1. HTTP/2 采用二进制格式传输数据而非 HTTP1.1 的文本格式，解析更高效
> 2. HTTP/2 同域名下所有通信在单 TCP 连接上并发完成（多路复用），单连接可承载任意数据的双向数据流，消除多 TCP 连接带来的延时。
> 3. HTTP/2 对这些消息头采取了压缩策略，节省流量（头部压缩）
> 4. HTTP/2 端可以在发送页面HTML时主动推送其它资源，而不用等到浏览器解析到相应位置，发起请求再响应。例如服务端可以主动把JS和CSS文件推送给客户端，而不需要客户端解析HTML时再发送这些请求。(Server Push)

## 5. 参考

1. [Let's Encrypt 入门教程](https://bitmingw.com/2017/02/02/letsencrypt-tutorial/)
2. [crontab 教程](http://linuxtools-rst.readthedocs.io/zh_CN/latest/tool/crontab.html)
3. [Guide to Deploying Diffie-Hellman for TLS](https://weakdh.org/sysadmin.html)
4. [HSTS Preload List Submission](https://hstspreload.org)
5. [How To Set Up Nginx with HTTP/2 Support on Ubuntu 16.04](https://www.digitalocean.com/community/tutorials/how-to-set-up-nginx-with-http-2-support-on-ubuntu-16-04)
6. [一文读懂 HTTP/2 特性](https://zhuanlan.zhihu.com/p/26559480)