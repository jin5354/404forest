title: 将项目开源到 Github 时，别忘了做些整理工作
categories:
  - Code
tags:
  - Github
  - Open Source
toc: true
date: 2017-4-28 10:59:11
---

项目开源时，别忘了把整理工作做好。

<!-- more -->

## 1. 清除敏感信息

有的文件中可能包含了 SSH 帐号密码，内网机器 IP 等敏感信息。这些信息在开源前必须清除。因为将 Git repo 上传到 Github 公开之后任何人都可以访问完整的 commit history，所以仅仅在某个 commit 中删除掉敏感文件是没有用的。我们必须将敏感文件从整个 History 中消除掉才可以，就像它从未存在过一样。

从历史 commit 中清除文件有两种途径：

- git 的 `filter-branch` 命令，可以修改历史 commit
- 工具 [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) 也可以从历史 commit 中清除文件，相比 `git filter-branch` 效率更高，声称提速 10 - 720 倍

首先访问 [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) 下载 bfg 工具，然后创建要修改的 repo 的 mirror：

```bash
$ git clone --mirror git://example.com/repo.git
```

将下载下来的 `bfg.jar` 与 repo.git 放在同一目录下，随后执行：

```bash
$ java -jar bfg.jar --delete-files ssh.key repo.git
$ cd repo.git
$ git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

处理完毕之后，push
```
$ git push
```

让我们查看曾经包含该文件改动的 commit：

![bfg](/imgs/blog/bfg.png)

ssh.key 文件已经从 commit history 中消失了，仿佛从来没有存在过一样。

## 2. 统一 author 信息

一般来说，我们在 GitHub 上和公司内部 Git 仓库上提交时用的是不同身份。比如我，在 Github 上提交用 Gmail 邮箱身份，在公司内部 Git 仓库上提交时用公司企业邮箱身份。有时也会混用，在公司内网提交代码时没注意，用 Gmail 邮箱身份就提交上去了……

![mixed](/imgs/blog/mixed-author.png)

项目开源后，之后的开发便主要在 Github 上进行，出于洁癖，我们可以将项目中 author 信息进行统一。

首先 clone 一份目标 bare repo:

```bash
$git clone --bare https://github.com/user/repo.git
$cd repo.git
```

随后在 bare repo 下创建 shell 文件：`git-author-rewrite.sh`，将 `$OLD_EMAIL`，`$CORRECT_NAME`，`$CORRECT_EMAIL` 变量替换为待替换的 email、替换后的 author name 和替换后的 email。

```bash
#!/bin/sh

git filter-branch --env-filter '
OLD_EMAIL="your-old-email@example.com"
CORRECT_NAME="Your Correct Name"
CORRECT_EMAIL="your-correct-email@example.com"
if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
```

执行该 shell。
```bash
$ sudo bash git-author-rewrite.sh
```
稍等片刻，author info 修改完毕，push。

```bash
$ git push --force --tags origin 'refs/heads/*'
```

随后再检查项目的 commit history，可以看到 author 信息已经统一了。

## 3. 添加 CI

很多项目免费支持对 Github 上的 repo 添加持续集成功能。其中一个使用广泛的项目就是 [Travis CI](https://travis-ci.org/)。添加 CI 后，每次项目提交后，CI 都会自动进行 build 过程，并将 build 结果向你汇报。可以非常方便有效的监控项目的健康程度。

Travis CI 的添加极为简单：

1. 用 Github 账户登录 [Travis CI](https://travis-ci.org/)，选择自己的目标 repo，将 CI 开关置为 On。
2. 去 repo 根目录下新建个 `.travis.yml`，添加配置项内容：

```yml
sudo: false
language: node_js
node_js: stable
script:
  - npm run lint
  - npm run test
  - npm run build
```
我的项目构建是基于 nodejs 的，每次 build 之前还要过一遍 lint 和 单元测试，所以这样写。意思就是：使用 stable 版本的 node，在项目下跑 `npm run lint`, `npm run test`, `npm run build` 三个命令，如果没有报错，则 build 为 passing。若出错则为 build error。每次提交之后，Travis CI 还会把 build 结果发邮件通知你。

![travis-ci](/imgs/blog/travis-ci.png)

## 4. 添加 coverage 信息

coverage 为项目的单元测试覆盖率信息。如果你的项目有单元测试，且进行了覆盖率统计，那么我们可以将覆盖率信息放到网页上来查看，并且生成一个 badge 展示在项目下。

如何为项目写单测这里不再展开。项目跑完单测，往往会生成一个叫做 lcov.info 的信息文件。coverage 信息获取就靠这个文件了。

[Coveralls](coveralls.io) 也是一个被广泛使用的项目测试覆盖率统计工具，可以监控项目的单测覆盖率情况。使用也极其简单：

1. 用 Github 账户登录 [Coveralls](coveralls.io)，选择自己的目标 repo，将统计开关置为 On。
2. 将 lcov.info 的信息文件传送给 Coveralls。

lcov.info 是在跑单测之后产生的，也就是在执行 `npm run test` 之后产生。所以，我们要将传送信息文件的过程放在 CI 步骤里。

1. 在项目中安装 coveralls: `npm i coveralls --save-dev`
2. 修改 `.travis.yml`：

```yml
sudo: false
language: node_js
node_js: stable
script:
  - npm run lint
  - npm run test
  - npm run build
after_success:
  - cat ./coverage/lcov.info | coveralls
```

这样每次 CI 跑完之后就会自动把单测覆盖率信息送到 Coveralls 了, 在 Coveralls 网站上可以监控代码提交前后单测覆盖率的变动。

## 5. 各种 badge

[http://shields.io/](http://shields.io/#your-badge) 这个网站为项目提供各种各样的 Badge。可以挑选适合的加上。

## 6. 参考资料

1. [git filter-branch](https://git-scm.com/docs/git-filter-branch)
2. [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
3. [Removing sensitive data from a repository](https://help.github.com/articles/removing-sensitive-data-from-a-repository/)
4. [Changing author info](https://help.github.com/articles/changing-author-info/)
5. [how-to-use-travis-ci](https://github.com/nukc/how-to-use-travis-ci)
6. [使用Travis-CI+Coveralls让你的Github开源项目持续集成](https://github.com/icepy/we-writing/issues/33)
