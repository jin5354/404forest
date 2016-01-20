title: 在mac下配置wine环境——自己wine一个小游戏
categories:
  - Code
tags:
  - wine
  - wineskin
  - mac
  - windows
date: 2015-10-12 21:55:41
---

当我们想要在 mac 上运行 labview 等 windows 下的大型软件时，使用 PD 等虚拟机可以很好的解决需求；然而如果我们只想玩些同人小游戏什么的，再开一个操作系统就觉得有点累赘了，这时我们可以选择[wine](https://www.winehq.org/)，更加轻量的执行 windows 应用。

<!-- more -->

wine 的另一个好处时可以将 windows 应用打包成 APP，这样就可以直接拷贝给别人玩儿了！

下面是踩过很多坑后总结出来的比较方便的在 mac 上配置 wine 的流程。

# 准备工作

1. 安装 Xcode

   [从 Mac Apple Store 安装](https://itunes.apple.com/us/app/xcode/id497799835)
   找百度网盘下的都是坏孩子哼！

2. 安装 XQuzrtz

    在[这里](http://xquartz.macosforge.org/)下载安装。

3. 安装 homebrew

    ```
    $ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    ```
    温馨提示：homebrew 的源可选择使用[清华大学TUNA镜像源](http://mirrors.tuna.tsinghua.edu.cn/help/#homebrew)提升速度

# 安装 wine

1. 安装 wine

    ```
    brew install wine
    ```

2. 安装 winetricks

    ```
    brew install winetricks
    ```

# 运行应用程序

现在我们已经可以执行 windows 应用程序啦。终端下输入

```
wine setup.exe
```

就可以执行 setup.exe 咯。

执行

```
msiexec /i setup.msi
```
可以执行msi格式的安装程序。

# 安装常用库

虽然理论上我们已经可以跑 windows 应用程序了，但是游戏还不能玩哦。因为很多依赖都没有安装，比如 .NET Framework，比如 DirectX9，比如 VCRUNTIME 等等。这时候我们需要 winetricks 来帮助我们安装库。

```
winetricks dotnet35 d3dx9 xna31
```
东方幕华祭主要需要这三个库。已有库的列表可通过``winetricks list``来查询。加参数``-q``可以静默安装。

不过 winetricks 这东西内置了复杂的 conflict 系统，有冲突时就不给安装。。比如先装完 .net 2.0再装 .net 3.5会报错。只能选择直接装 .net 3.5。

到这里至少东方幕华祭已经可以运行了，不过不能完美运行。可以进行正常的单人游戏，但是在 music room 等地方会报错，没办法。。。   

wine 有一份应用程序的[兼容性文档](https://appdb.winehq.org/)，在装软件时可以先来查阅一下，会有兼容性评级和一些安装说明，**十分好用**！

# 打包

简易的 wineskin 小教程！

1. [下载 wineskin](http://wineskin.urgesoftware.com/tiki-index.php?page=Downloads)

2. 安装 engine 和 wrapper。不过 wineskin 自带下载没速度，还是到[mediafire](https://www.mediafire.com/folder/8p4vcab6414gv/)下载吧。
    下载时注意版本要和wine对应哦！

3. 点击 Create new blank wrapper，输入文件名创建新包，弹出的提示都选 cancel，先不安装。

4. 在 wrapper 里，运行 wineskin.app

5. 选择 Advanced, tool 里有 winetricks 来装常用库，Configuration 中的 Windows EXE 中输入的应用程序路径就是最终打包成品 APP 双击运行的应用。如果有安装程序的话，路径填进去，选择 Test Run 跑一下。最后再把启动 exe 填进去。

PS. 如果之前在 wine 中装过程序了，直接把``~/.wine``下的 ``driver_c`` 文件夹彻底拷贝到 ``wrapper/Content/Resources`` 下，然后指定下 exe 路径就可以直接拿来用。

wine 坑多坑大，很多程序不能完美运行，报错是免不了的，不要慌，google 多查一查！解决不了的，还是打开 PD 吧。