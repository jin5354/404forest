title: 使用pi-gpio控制树莓派GPIO
categories:
  - Code
tags:
  - Javascript
  - Nodejs
  - Raspberry Pi
date: 2015-09-08 10:49:41
coverImage: gpio.png
thumbnailImage: gpio-t.jpg
coverMeta: out
---

尝试使用pi-gpio来控制树莓派GPIO，踩坑一晚，特此记录。

<!-- more -->

#### 一、在pi上安装新版本的nodejs

我如果直接用`sudo apt-get install nodejs`安装得到的nodejs发现是0.6版本的，npm版本才1.x，太落后了，各种无法使用，所以使用了其他方法。

```
//Adding the Package Repository
curl -sLS https://apt.adafruit.com/add | sudo bash
sudo apt-get install node
```

```
pi@raspberrypi ~ $ node -v
v0.12.6
```

使用这种方法安装的nodejs起码到了0.12版，足够用了。
也可以寻找为arm平台准备的debian用源码，自行编译。

#### 二、安装gpio-admin

gpio-admin是一个命令行工具，可以让你在命令行下export或unexport树莓派的GPIO引脚。

```
git clone git://github.com/quick2wire/quick2wire-gpio-admin.git
cd quick2wire-gpio-admin
make
sudo make install
sudo adduser $USER gpio
```
随后注销用户并重新登录。

gpio-admin这里有坑。

#### 三、安装pi-gpio

在工程目录里，运行

```
sudo npm install pi-gpio
```

#### 四、跑代码

当你兴高采烈的按照例程写完代码之后，跑起来会发现open时直接报错：

```
failed to change group ownership of /sys/devices/virtual/gpio/
```

这是因为raspbian系统内核更新到3.18.x后移动了gpio的存放位置，我们需要相应修改gpio-admin的配置。

打开之前clone下来的quick2wire-gpio-admin/src/gpio-admin.c文件，将第30行左右的

```
int size = snprintf(path, PATH_MAX, "/sys/devices/virtual/gpio/gpio%u/%s", pin, filename);
```

修改为

```
int size = snprintf(path, PATH_MAX, "/sys/class/gpio/gpio%u/%s", pin, filename);

```
然后重新编译安装quick2wire-gpio-admin。

好，让我们再跑一次。

这次又报错：

```
[Error: ENOENT, open '/sys/devices/virtual/gpio/gpio17/value']...
```
看来又变成pi-gpio的路径出错了，我们又要改pi-gpio的配置。

在node_modules文件夹下找到pi-gpio.js，打开，修改第7行

```
sysFsPath = "/sys/class/gpio"
```

看起来0.0.7版本的pi-gpio尝试着自动匹配路径，它分为了sysFsPathOld和sysFsPathNew，判断内核版本高于3.18.x时使用新地址，否则使用老地址。

但是在我电脑上它并没有使用新地址，依然在用老路径。所以直接改

```
sysFsPathOld = "/sys/class/gpio"
```

把new和old地址都改成这个。

再运行一次，终于可以正常跑通了。

我只想测试个倾斜传感器能否正常联通，查了一晚上issue....

参考资料：

1. [Installing node.js](https://learn.adafruit.com/node-embedded-development/installing-node-dot-js)
2. [pi-gpio](https://github.com/rakeshpai/pi-gpio)
3. [quick2wire-gpio-admin](https://github.com/quick2wire/quick2wire-gpio-admin)
4. [failed to change group ownership of /sys/devices/virtual/gpio/gpio22/direction: No such file or directory #5](https://github.com/quick2wire/quick2wire-gpio-admin/issues/5)
5. [changed path for exporting pins #6](https://github.com/quick2wire/quick2wire-gpio-admin/pull/6)