title: 玉泉通过ipv6来使用shadowsocks
categories:
  - Code
tags:
  - ipv6
  - shadowsocks
  - GFW
date: 2015-10-13 02:35:41
---

今年暑假期间GFW大升级，在机器学习、数据挖掘、深度包检测等装备全面部署下的GFW火力大大提升，导致杭州电信环境下shadowsocks可用性大幅降低，在Linode、DO、conoha等家的vps上架设的shadowsocks被打击严重，难以正常使用。试用ipv6，发现效果还可以，可能功夫网gfw对ipv6的针对力度还不大。下面说一下流程。

<!-- more -->

首先你需要分配到一个ipv6地址。

据说玉泉的有线网络会自动分配一个ipv6地址，我是一直使用无线（ZJUWLAN）的，有线的情况不清楚，不过到底有没有拿到ipv6访问后文的网址就知道了。其实我个人感觉用ZJUWLAN + 自建VPN方式通用性大一点，寝室教室都能用。如果你说wifi信号不好，那就没办法了..

第一步，使用ZJUWLAN的话，通过自建VPN方式登录。（不能使用网页认证方式登录，那种方式拿不到ipv6）

在偏好设置-网络中，新建一个l2tp的vpn，按图配置。点击鉴定设置，密码中填入VPN密码。高级中，确保“通过VPN连接发送所有流量”为非勾选状态。

![ss-ipv6-1](http://7sbmuq.com1.z0.glb.clouddn.com/ss-ipv6-1.png)

这时在接入ZJUWLAN后，连接这个VPN就可以接入外网了。偶尔会出鉴定失败什么的错误，多试几次就可以上了。

这里如果有问题可以参考下98的这个帖子 [网络问题日经帖之终结帖！](http://www.cc98.org/dispbbs.asp?boardid=226&id=4551270)

第二步，点击左边的 + 号，新建一个6 to 4连接，什么也不用配置，直接点应用。正常情况下立刻就能看到一个ipv6地址了。

![ss-ipv6-2](http://7sbmuq.com1.z0.glb.clouddn.com/ss-ipv6-2.png)

点击左边的齿轮，选择设定服务顺序，把VPN(L2TP)拖动到最上方。

第三步，访问[test-ipv6](http://www.test-ipv6.nl/)，看看是不是一路绿灯。

![ss-ipv6-3](http://7sbmuq.com1.z0.glb.clouddn.com/ss-ipv6-3.png)

![ss-ipv6-4](http://7sbmuq.com1.z0.glb.clouddn.com/ss-ipv6-4.png)

看一下自己vps的ipv6地址，ping6一下试试。

![ss-ipv6-5](http://7sbmuq.com1.z0.glb.clouddn.com/ss-ipv6-5.png)

如果都能正常连接表示离成功就八九不离十了。我第一次配置时，ipv6地址获取成功，但是不能访问ipv6网站，也不能ping通自己vps的ipv6地址。我也没什么头绪，后来放置一天再尝试就正常了。囧。神奇玉泉。

第四步，微调一下服务器端ss，开启对ipv6的监听。

方式非常简单：如果使用json配置文件，改server一行为：
```
“server”:”::”
```
表示同时监听ipv4和ipv6；

如果使用命令行形式启动ss，添加“-s ::”启动就可以了。

最后一步别忘了，本地ss客户端改一下ipv6地址。

![ss-ipv6-6](http://7sbmuq.com1.z0.glb.clouddn.com/ss-ipv6-6.png)

Enjoy！

![ladder](http://7sbmuq.com1.z0.glb.clouddn.com/ladder.png)

PS： 感谢v2ex上遇到的[xiangtianxiao](http://www.v2ex.com/member/xiangtianxiao)同学的分享。