title: 该用async写异步代码了
categories:
  - Code
tags:
  - javascript
  - ES6
  - ES7
  - async
  - promise
  - 异步
toc: true
date: 2016-03-14 20:34:11
---

最近在写一个自动化脚本时，由于需要多个异步任务逐步进行，所以对 ES6 的 generator 和 ES7 的 async 都做了尝试，发现 async 处理异步操作极为优雅好用，记录如下，顺带回顾一下异步处理的进化。

<!-- more -->

## 回调函数

回调函数是我们见过的最多的了，也就是使用 callback。

以下是一段示例代码，主要执行了3项任务：

1. 打开数据库
2. 读取一个叫做 users 的集合
3. 处理这个集合的数据

```
//打开数据
mongodb.open((err,db) => {
    if(err){console.error(err);}

    //读取 users 集合
    db.collection('users',(err,collection) => {
        if(err){
            mongodb.close();
            console.error(err);
        }

        //处理集合数据
        process(collection);
    });
});

```

相信写过数据库相关操作的大家都很熟悉，数据库的增删查改基本都是异步操作。从这里也就能看到回调函数的弊端：层数一多，容易产生 callback hell，可读性急剧下降。（尤其是最后的连成一排的反括号、反花括号和分号的结合体，很容易造成语法错误..）

## Promise

Promise 为了解决这个问题，提出了一种新的语法，允许将回调函数的横向加载，改成纵向加载。ES6 中也原生提供了 Promise 对象。


```
//需要将 mongodb.open、db.collection 都提前 promise 化
mongodb.open()
    .then((db) => {
        return db.collection('users');
    })
    .then((collection) => {
        process(collection);
    })
    .catch((err) => {
        console.error(err);
    });

```

这样写法看起来清楚一些，不过之前的函数每一个都要 Promise 化。纵向排布的代码流被许多 `then` 分割开，还不够优雅。

## Generator

Generator 最大的特点是引入了 yield 语法，这个语法提供了暂停功能。Generator 函数就是一个封装的异步任务，或者说是异步任务的容器。

```
function* gen() {
    let db = yield mongodb.open();
    let collection = yield db.collection('users');
    process(collection);
}

let genPlayer = gen();
genPlayer.next();
genPlayer.next();
genPlayer.next();
```

这种同步式写法非常棒。然而有一个关键的问题是：我们需要自己手动使用 next()来推动流程的进度，这太蛋疼了。我们所想的是，当上一个异步函数执行完毕时自动进入下一个异步函数，也就是能自动推进流程。

## co

co模块是著名程序员 TJ Holowaychuk 于2013年6月发布的一个小工具，用于 Generator 函数的自动执行。其实就是为了弥补上面说到的缺陷的一个语法糖。

```
let co = require('co');
function* gen() {
    let db = yield mongodb.open();
    let collection = yield db.collection('users');
    process(collection);
}

co(gen);
```

这么方便的功能，为什么 Generator 之中没有原生携带呢。（吐槽）

## async

async 函数就是 Generator 函数的语法糖。你想要的功能，这里都有。

```
//需要将 mongodb.open、db.collection 都提前 promise 化
let auto = async function () {
    let db = await mongodb.open();
    let collection = await db.collection('users');
    process(collection);
}
let player = auto();
```

语法上，只是把 * 变成了 async，yield 变成了 await。await 后面跟的可以是 promise 对象或者原始类型值（此时就是同步操作），async 函数执行完毕后返回的也是 promise 对象，这样可以方便多个 async 互相调用。async 带有自动执行器，promise 对象的 resolve/reject 标志着某一个异步流程的结束，通知 async 进入下一个异步任务。

可以看到，使用async的话基本上已经是同步式写法了。

参考：

[异步操作和Async函数](http://es6.ruanyifeng.com/#docs/async)