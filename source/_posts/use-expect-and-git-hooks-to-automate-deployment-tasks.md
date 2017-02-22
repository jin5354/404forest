title: 使用 expect/git hooks 实现项目在服务器端的自动部署
categories:
  - Code
tags:
  - expect
  - git hooks
  - 自动部署
toc: true
date: 2016-10-28 18:37:11
---

项目在本地被开发，之后肯定要被送到服务器上。每次都用 `scp`/`rsync` 送上去随后重跑服务未免过于繁琐；特别是在公司内网还存在着堡垒机的情况下，如果要把文件送上目标机器，必须要通过堡垒机做中转，每次手打长串命令很麻烦。使用 `expect`/`git hooks `可以简化流程，实现一行指令让项目自动部署在服务器上。

<!-- more -->

## 1. `Git hooks`

通过利用 Git 服务器端钩子（hook）中的 `post-receive` 挂钩，可以实现在 `git push` 流程结束后执行自定义脚本，如部署文件、发送邮件、持续集成、更新系统等。

举例一个典型的部署 node.js 后端服务的流程：项目开发完先在本地 `git push`，随后登录到服务器上，进入服务器端仓库执行 `git pull`， 更新数据，然后做一些操作，比如重新启动服务/启动服务器/启动守护进程之类的...直到部署完毕。使用 `git hooks` 后，你只需一步 `git push`，其他流程将自动完成。

**由于要部署的前端页面一般都在项目中的 dist 文件夹中，而 dist 一般不加入版本控制系统，所以这种方法一般不用来部署前端页面。部署前端页面可以使用下文的 expect 自动部署脚本。**

**另一个注意点是，你应该能直接从本机连接服务器的 git 仓库。公司内网可能会对 git 仓库的访问设限。**

### 1.1 流程图

![git-hook](/imgs/blog/githook.png)

### 1.2 在服务器上创建 git 裸仓库

带有 `--bare` 参数的初始化命令创建的仓库没有工作路径，无法进行编辑提交与更改，这样的仓库称为裸仓库。由于对非裸仓库（non-bare repository）进行分支推送有重写更改的潜在风险，因此远端的中央仓库通常被创建为裸仓库。几乎在所有的 Git 工作方式下，中央仓库都是裸仓库，而开发者的本地仓库都是非裸仓库。

在服务器上找个地方，创建个裸仓库。

```bash
cd ~
git init --bare test.git
```

### 1.3 将服务器 git 裸仓库添加成为本地 git 项目的 remote 源

在本地 git 项目下

```bash
git remote add deploy user@ip_address/root/test.git
```

之后就可以将项目文件 push 进裸仓库了。

```bash
git push deploy master
```

### 1.4 在服务器上创建 git 服务器仓库

在服务器上找个地方创建服务器仓库。同样将裸仓库添加至其 remote 源中。

```
cd ~
mkdir deploy
cd deploy
git init
git remote add deploy ../test.git  # 裸仓库和服务器仓库都在服务器上，这里写相对路径就行。
```

每当本地 `git push` 之后，在服务器仓库就可以运行 `git pull` 拉一份最新数据下来。

```
git pull deploy master
```

### 1.5 配置服务器 git 裸仓库 hook

进入服务器上 test.git/hooks 文件夹，里面已经提供了一些示例钩子文件。这些示例文件去掉 `.smaple` 后缀名后才会生效。这里我们使用 `post-receive` 这个钩子，该钩子在每次接收完新 push 后执行。更多的钩子介绍可以查看这篇文章：[How To Use Git Hooks To Automate Development and Deployment Tasks](https://www.digitalocean.com/community/tutorials/how-to-use-git-hooks-to-automate-development-and-deployment-tasks)。

```bash
cd test.git
cd hooks
vi post-receive
```

编辑脚本内容，在这里我们可以运行部署文件（让服务器仓库自动 pull 数据，发邮件，重启服务器...等等操作）

```bash
#!/bin/sh

cd /root/deploy
unset GIT_DIR
git pull deploy master # 让服务器仓库自动 pull 数据
exit 0
```

请注意 `unset GIT_DIR` 这句指令一定要写，否则会报 `remote: fatal: Not a git repository: '.'`错误。`post-receive` 钩子会默认把 `$GIT_DIR` 设置为 `.`，这会导致问题，详见 [Git checkout in post-receive hook: “Not a git repository '.'”](http://stackoverflow.com/questions/10507942/git-checkout-in-post-receive-hook-not-a-git-repository)。

最后为该脚本文件提权。

```bash
chmod +x post-receive
```

钩子配置完毕。

### 1.6 测试流程

现在自动部署的流程已经搭建完毕。在本地 git 项目做修改，`git push` 之后，可以看到 log 如下：

![git-hook](/imgs/blog/pushhook.png)

可以看到返回的 log 里已经包含了执行钩子时的日志。在这里就可以清晰的看到钩子执行后，服务器仓库已经自动 pull 新数据下来啦。

## 2. expect

expect 是 linux 下的一个命令，可以帮助你自动化处理 ssh/ftp 登录后在服务器上的操作。

以下以部署一个前端单页项目为例，说明下 expect 如何实现自动将待部署文件送上堡垒机，再送上内网服务器。

### 2.1 expect 语法

expect 语法非常简单，只有4个指令：

- spawn： 启动新的进程
- send： 像子进程发送字符串
- expect： 等待从进程接收指定字符串
- interact： 允许用户交互

### 2.2 一个简单的登录ssh示例

```bash
spawn ssh root@133.130.89.54
expect "password"
send "hahaha\r"
interact
```

代码与实际流程是一一对应的：

1. spawn ssh root@133.130.89.54  ——  使用 ssh 命令登录服务器
2. expect "password"  —— 等待屏幕上出现 “password” 字样 （此时屏幕显示的是 “root@133.130.89.54's password:” 即要求输入密码的提示）
3. send "hahaha\r" —— 输入密码 然后按回车 "\r"即为回车的意思
4. interact 的意思即为停止脚本动作，允许用户进行交互。不加这行，脚本运行完就直接退出了。

其实很简单，只要搞懂 expect 命令如何使用：即**等待屏幕出现指定字样后再执行下一步操作**。

### 2.3 自动部署示例

拿一个典型的前端项目举例，部署流程如下：

1. 在项目目录执行 `npm run build`；
2. 将 dist 文件夹打包成 zip；
3. 将 zip 包由本地传至堡垒机；
4. 登录堡垒机；
5. 将 zip 包由堡垒机传至服务器；
6. 登录服务器；
7. 解压缩 zip 包至指定位置，部署完毕。

代码如下：（分为两个脚本执行，本地操作由 shell 脚本执行，ssh 登录之后的操作由 expect 脚本执行）

upload.sh:

```bash
npm run build
cd dist
zip -r public *
cd ..
rsync -rvP dist/public.zip example@10.x.x.xxx:/home/example/
echo "upload to 10.x.x.x done."
rm public.zip
/usr/bin/expect ./expect.exp  #执行 expect 脚本
```

expect.sh
```bash
spawn ssh @10.x.x.xxx  #由于配置了 ssh 认证免密码登录，不需要输密码
send "scp /home/example/public.zip root@10.x.xx.xx:/root/fe-platform-backend\r"
expect "total" #scp命令执行完毕，屏幕会出现含 "total" 字样的提示
send "ssh root@10.x.xx.xx\r"
expect "bash"
send "unzip -o /root/fe-platform-backend/public.zip -d /root/fe-platform-backend/public\r"
expect "inflating" #scp命令执行完毕，屏幕会出现含 "inflating" 字样的提示
send "rm /root/fe-platform-backend/public.zip\r"
expect "bash" #最后再加一个 expect 是为了看到 rm 操作是否成功，否则运行完 send 会直接退出
```
### 2.4 其他辅助语法

在编写 expect 脚本时，你可以使用 `set` 来设置变量，使用 `[expr]` 来执行表达式，使用 `if`/`for`/`while` 写判断和循环。这些语法可以帮助你完成功能更多更复杂的脚本。[语法文档](http://www.thegeekstuff.com/2011/01/expect-expressions-loops-conditions/)

## 3. 参考文章

1. [建立 Git 仓库](http://www.ituring.com.cn/article/179426)
2. [用 Git Hooks 进行自动部署](https://ourai.ws/posts/deployment-with-git-hooks/)
3. [How To Use Git Hooks To Automate Development and Deployment Tasks](https://www.digitalocean.com/community/tutorials/how-to-use-git-hooks-to-automate-development-and-deployment-tasks)
4. [Git checkout in post-receive hook: “Not a git repository '.'”](http://stackoverflow.com/questions/10507942/git-checkout-in-post-receive-hook-not-a-git-repository)
5. [Expect Script Tutorial: Expressions, If Conditions, For Loop, and While Loop Examples](http://www.thegeekstuff.com/2011/01/expect-expressions-loops-conditions/)
6. [Linux expect详解](http://www.jellythink.com/archives/1470)

