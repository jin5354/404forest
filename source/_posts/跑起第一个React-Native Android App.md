title: 跑起第一个React-Native Android App
categories:
  - Code
tags:
  - javascript
  - android
toc: true
date: 2016-03-19 20:34:11
---

毕设要产出一个安卓上的 APP，于是打算尝试下 React-Native。本文主要记录环境搭建过程，把踩的坑写一下。

<!-- more -->

## 准备工作

1. 安装 [homebrew](http://brew.sh/)

2. 安装 Git `brew install git`。在 mac 上，如果你已经安装了 `Xcode`，那么 Git 已经安装好了。

3. 安装 [nodejs](https://nodejs.org/) 4+ 版。 

4. 安装 watchman `brew install watchman`

5. 安装 flow `brew install flow`

6. 安装最新的 [JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

## 安装与配置 Android Studio

之前已经用过几次 Android Studio 了，印象不是很好：一是墙的问题，下载 SDK，下载 gradle 都非常慢，体验很差；二是程序本身性能也不佳，下面长期跑一些不明所以的 process，进 preferences 时很容易卡死。这次打算彻底重装一下。

### 清理旧版本 Android Studio

执行以下命令：

```
rm -Rf /Applications/Android\ Studio.app
rm -Rf ~/Library/Preferences/AndroidStudio*
rm ~/Library/Preferences/com.google.android.studio.plist
rm -Rf ~/Library/Application\ Support/AndroidStudio*
rm -Rf ~/Library/Logs/AndroidStudio*
rm -Rf ~/Library/Caches/AndroidStudio*
```

如果要删除所有 projects：

```
rm -Rf ~/AndroidStudioProjects
```

如果要删除 gradle 相关文件：

```
rm -Rf ~/.gradle
```

如果要删除安卓虚拟机(AVD)等等：

```
rm -Rf ~/.android
```

删除 android sdk 相关：

```
rm -Rf ~/Library/Android*
```

### 安装 Android Studio

来到[官方网站](http://developer.android.com/sdk/index.html)下载软件本体。

下载之后初次运行，会因为网络问题（墙）获取 sdk 仓库时报错，这个时候虽然提醒你设置 proxy，但是我设置了之后无效，依然报错。查了一下，这样处理：

在应用程序中，进入 Android Studio，修改 bin 目录下的 `idea.properties` 文件，在文件最后追加 `disable.android.first.run=true`。

### 安装 sdk

这时由于没有 sdk，新建项目时会要求指定 sdk 路径。我们先手动下载一下 sdk tools。可以来[镜像站](http://www.androiddevtools.cn/)下载 SDK tools。下载后解压缩，将其中的所有内容移动到`~/Library/Android/sdk/`下。（最好放在这个路径。）terminal 中进入，`cd` 到 tools 文件夹下，执行：

```
./android sdk
```

这时我们就能看到 SDK Manager 界面了。

不过因为伟大的墙，我们并不能 fetch 到什么资源.....于是继续使用镜像资源：

在 Preferences 中，设置 Proxy。HTTP Proxy Server 可以使用 `android-mirror.bugly.qq.com`，Port 使用 `8080`。这个是腾讯提供的镜像站，也可以使用其他站，挑选一个网速比较快的。把 `others` 中的 `Force..` 一项勾上。

![proxy](/imgs/blog/2016-3-19-1.png)

退出重新进入，此时就能获取到资源列表了。

按照 React-Native 官网上的说明，把这些包安装上：

![AndroidSDK1](https://facebook.github.io/react-native/img/AndroidSDK1.png)
![AndroidSDK2](https://facebook.github.io/react-native/img/AndroidSDK2.png)

在 Android Studio 中指定好 sdk 的路径。这些包都安装好，应该可以正常新建一个空项目了。

### 指定 sdk 路径

在 MAC 上，向你的 shell 的配置文件中添加：export ANDROID_HOME=sdk路径。

## 安装 Genymotion

1. 前去 [Genymotion官网](https://www.genymotion.com/)，注册个帐号，下载仅限个人使用的免费版。

2. 在主界面点击 `Add` 添加虚拟机，还是因为伟大的墙，你在下载时可能会遇到 `server return HTTP Code 0` 的迷之情况。这时配置 proxy：

 ![genymotion](/imgs/blog/2016-3-19-2.png)

3. 这时应该能成功下载了。按照自己的需求装好虚拟机。

## 安装与配置 React-Native

以下命令，建议都加上sudo执行。

1. 安装 react-native-cli。

 ```
 $ npm install -g react-native-cli
 ```

2. 创建 React Native project。

 ```
 $ react-native init AwesomeProject
 ```

3. 尝试运行：

 在运行之前，先打开一个 genymotion 的虚拟机。

 ```
 $ cd AwesomeProject
 $ react-native run-android
 ```

然后就是报错与改错时间...

- 报错： `permission denied, open '~/.babel.json'`。

修改 `.babel.json` 的权限，执行 `sudo chown 你的用户名 ~/.babel.json`。

- 报错： `Error: query failed: synchronization failed: Permission denied`。

修改项目文件夹的权限，执行 `sudo chmod 777 AwesomeProject`。

- 报错： `SDK location not found.`

这里要指定 SDK location。这里很奇怪的一点是：我明明在zsh中指定了 ANDROID_HOME，但是依然会报错。所以换用另一种方法：

在 AwesomeProject/android 下面新建文件 `local.properties`，内容为 `sdk.dir=sdk路径`，例如我的是 `sdk.dir=/Users/jin/Library/Android/sdk`。

- 报错： `ailed to find Build Tools revision 23.0.1`。

虽然 sdk manager 里面 Build Tools 已经出到 23.0.2 了，但是不行哦，你还是要安装一个 23.0.1 版。

这些坑都踩完之后，终于见到了 `BUILD SUCCESSFUL` 的提示。这时去虚拟机的程序里面看一看把， 一个叫做 AwesomeProject 的 APP 已经躺在里面了。运行起来：

![rn](/imgs/blog/2016-3-19-3.png)

enjoy！

参考资料：

1. [How to completely uninstall Android Studio](http://stackoverflow.com/questions/17625622/how-to-completely-uninstall-android-studio)
2. [Getting Started](https://facebook.github.io/react-native/docs/getting-started.html#content)
3. [Android Setup](https://facebook.github.io/react-native/docs/android-setup.html)
