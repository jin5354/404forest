title: 现代前端科技解析 —— 数据响应式系统 (Data Reactivity System)
categories:
  - Code
tags:
  - Modern web development tech analysis
  - 现代前端科技解析
  - data reactivity system
toc: true
coverImage: traceon.png
coverSize: partial
coverMeta: out
date: 2017-6-28 13:29:11
---

现代前端框架都引入了数据的响应式系统：模型层（Model）只是普通的 JavaScript 对象，修改它则自动更新视图（View），这让状态管理简单而直观。 Vue、Meteor Tracker、Mobx 中的数据响应式系统原理基本相同，本文将对其进行解析，并从零开始一步步实现一个与框架解耦的数据响应式系统。

<!-- more -->

> 注：
> 原始链接: https://www.404forest.com/2017/06/28/modern-web-development-tech-analysis-data-reactivity-system/
> 文章备份: https://github.com/jin5354/404forest/issues/60
> 本文内容所对应的 Vue2.0 源码: https://github.com/vuejs/vue/tree/dev/src/core/observer
> 本文构建的数据监测库（附注释和 100% 测试）：https://github.com/jin5354/leaf-observable

# 1. 何为数据响应式系统

## 1.1 抛砖引玉

先看一个 Vue 官网上再熟悉不过的双向绑定示例：

![reactivity-system-1](/imgs/blog/reactivity-system-1.png)

这个示例展现了 model -- view 数据双向绑定的便利。先思考一下，这两个方向的绑定要如何实现？

`input` 数据 view --> model 绑定，我们可以通过事件响应来做到：

```javascript
let data = {
  message: 'Hello!'
}
let $input = document.querySelector('input')
$input.addEventListener('change', (e) => {  // addEvent 之后每次 input 数据 change，都会自动执行回调函数
  data = e.target.value
})
```

凭借浏览器内建的 DOM event，我们得以在 input 数据变化时及时得到通知并改变 model。然而 model --> view 绑定似乎并没有方便的手段，若想保证 model 改变时 view 跟随改变，我们只能在每次执行 model 变化操作的地方，手动执行 render 函数重新渲染 view。

如果能有类似事件响应的方便 API 就好了！就像这样：

```javascript
let data = {
  message: 'Hello!'
}
watch(data, render) // watch 之后每次 data 改变，都会自动执行回调函数 render
data.message = 'New Message!' //自动触发 render 函数！
```
如果数据的变动能自动发出通知并得到响应，我们就称其为响应式的数据。接下来我们从实现一个基本的 watch 函数开始，逐步构建一个数据响应式系统。

## 1.2 ES6 前，数据追踪的基础设施：Object.defineProperty

JavaScript 中对象的每个属性都拥有一个**属性描述对象**，用来定义该属性的行为。`Object.defineProperty` 是 ES5.1 规范中提供的方法，用来修改对象属性的属性描述对象，文档可参见 [MDN-Object.defineProperty()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)。通过 `Object.defineProperty` 函数，我们可以通过定义对象属性的存取器（getter/setter）来劫持数据的读取，实现数据变动时的通知功能。

例：

```javascript
let o = {
  a: 1
}

let value = o['a']

// 设置 o.a 的属性描述对象
Object.defineProperty(o, 'a', {
  enumerable: true,
  configurable: true,
  get() {           //设置 o.a 的 getter，每次访问 o.a 时执行
    console.log('a 属性被访问到了！')
    return value
  },
  set(newValue) {   //设置 o.a 的 setter，每次修改 o.a 时执行
    console.log('a 属性被修改了，新值为:', newValue, ',旧值为：', value)
    value = newValue
  }
})

o.a       // 输出：a 属性被访问到了！
o.a = 2   // 输出：a 属性被修改了，新值为: 2 ,旧值为： 1

```

getter/setter 劫持了数据的读写操作，使我们可以在数据读写时得到通知并执行自定义的操作，构成了数据响应式系统的基石。Object.defineProperty 方法不支持 IE9 以下浏览器且无法被 polyfill，这也是 Vue 等框架不支持 IE9 以下浏览器的原因。

# 2. 数据的响应化

Object.defineProperty 方法一次只能定义一个键值的属性描述对象。我们可以很轻松的写出针对一个键值的监测函数：

[查看在线示例](https://jsfiddle.net/jin5354/6mqtabfL/)

```javascript
let o = {
  a: 1
}

function watch(obj, key, callback) {
  let value = obj[key]
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      return value
    },
    set(newValue) {
      if(newValue === value) {
        return
      }else {
        let oldValue = value
        value = newValue
        callback(newValue, oldValue)  // setter 中触发回调函数，并将新值与旧值作为参数传入
      }
    }
  })
}

//『使数据响应化』和『添加回调函数』两个操作现在是耦合在一起的
watch(o, 'a', (newValue, oldValue) => {   // 使 o.a 响应化
  console.log('属性被修改了，新值为:', newValue, ',旧值为：', oldValue)
})

o.a = 2   // 输出： 属性被修改了，新值为: 2 ,旧值为： 1
o.a = 3   // 输出： 属性被修改了，新值为: 3 ,旧值为： 2
```

## 2.1 递归遍历整个对象

为了让整个对象响应化，我们需要遍历对象中的所有键并为其应用 Object.defineProperty 方法。对于键值为对象的情况，递归进去处理。同时，为了让 『使数据响应化』和『添加回调函数』两个操作解耦，我们引入 Dep 和 Watcher 类，使用订阅/发布模式向响应式数据注册回调函数。

![reactivity-system-2](/imgs/blog/reactivity-system-2.png)

[查看在线示例](https://jsfiddle.net/jin5354/aLbg4ja2/)

```javascript
// Dep 类，保存数据源的所有订阅，并在接收到数据源的变动通知后，触发所有订阅
class Dep {
  constructor() {
    this.subs = []
  }

  addSub(sub) {  // 添加订阅
    this.subs.push(sub)
  }

  notify(newValue, oldValue) {
    this.subs.forEach(sub => {
      sub.update(newValue, oldValue) // 触发订阅
    })
  }
}

const globalDep = new Dep()

// Watcher 类，每个 Watcher 为一个订阅源
class Watcher {
  constructor(callback) {
    this.callback = callback
  }

  update(newValue, oldValue) {
    this.callback(newValue, oldValue)  // 被触发后执行回调
  }
}

// 使一个对象响应化
function observify(value) {
  if(!isObject(value)) {
    return
  }
  Object.keys(value).forEach((key) => {
    defineReactive(value, key, value[key])  // 遍历每个键使其响应化
  })
}

function isObject(value) {
  return typeof value === 'object' && value !== null
}

//为对象的一个键应用 Object.defineProperty
function defineReactive(obj, key, value) {
  observify(value) // 递归
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      return value
    },
    set: (newValue) => {
      if(newValue === value) {
        return
      }else {
        let oldValue = value
        value = newValue
        observify(newValue)
        globalDep.notify(newValue, oldValue) // 变动时通知 Dep
      }
    }
  })
}

let o = {
  a: 1,
  c: {
    d: 1
  }
}

//『使数据响应化』和『添加回调函数』两个操作已被解耦，解耦后可以方便的多次添加订阅
// 使数据响应化
observify(o)
// 添加订阅
globalDep.addSub(new Watcher((newValue, oldValue) => {
  console.log('发生改变！新值：', newValue, "，旧值：", oldValue)
}))

o.a = 2  // 输出：发生改变！新值： 2 ，旧值： 1
o.c.d = 4  // 输出：发生改变！新值： 4 ，旧值： 1

// 可以再添加一个订阅
globalDep.addSub(new Watcher((newValue, oldValue) => {
  console.log('新订阅')
}))

o.a = 3 // 输出：发生改变！新值： 3 ，旧值： 2
        // 输出：新订阅

```

## 2.2 数组的特殊响应化处理

我们已经清楚：变动能够通知全是凭借 setter 的能力，在数据被修改时执行自定义操作。然而我们操作数组时往往使用 `push`、`pop`、`shift` 等函数来操作——很遗憾，调用这些函数修改数组内容并不会触发 setter。

为了能监测到这些函数操作带来的变动，我们需要『偷梁换柱』：用自制的变异函数替代这些原生函数。首先使用 `Object.create` 创建一个原型为 `Array.prototype` 的对象，拿到 Array 实例方法；然后在该对象上定义同名的变异函数，shadow 掉原生函数；随后将要响应化的数组的原型指向该对象，欺骗数组使用变异函数。

[查看在线示例](https://jsfiddle.net/jin5354/cz7f99bc/)

```javascript
import _ from 'lodash'

// 数组响应化
function observifyArray(arr) {
  const aryMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'] //需要变异的函数名列表
  let arrayAugmentations = Object.create(Array.prototype) // 创建一个 __proto__ 到 Array.prototype 的 arrayAugmentations 对象
  aryMethods.forEach(method => {    // 在 arrayAugmentations 对象上将需要变异的函数重写
    arrayAugmentations[method] = function(...arg) {
      Array.prototype[method].apply(this, arg)  // 执行默认操作
      globalDep.notify()  // 重写后的函数会先执行默认操作，随后通知 Dep
    }
  })

  Object.setPrototypeOf(arr, arrayAugmentations)  // 将要监测的数组的原型对象设置为 arrayAugmentations 对象，这样执行 push 等方法时就会执行我们替换后的变异方法啦
}

// 修改上文中的 observify 函数，加入 observifyArray
function observify(value) {
  if(!isObject(value)) {
    return
  }
  if(Array.isArray(value)) {  // 由于性能问题，我们不再对数组的每个 key 执行 Object.defineReactive
    observifyArray(value)
    for(let i = 0; i < value.length; i++) {
      observify(value[i])
    }
  }else {
    Object.keys(value).forEach((key) => {
      defineReactive(value, key, value[key])  // 遍历每个键使其响应化
    })
  }
}

... 其他部分引用 #2.1 示例

let o = {
  a: [1, 2, 3]
}

observify(o)

globalDep.addSub(new Watcher((newValue, oldValue) => {
  console.log('发生改变！新值：', newValue, "，旧值：", oldValue)
}))

o.a.push(4) // 输出：发生改变！新值： (4) [1, 2, 3, 4] ，旧值： (3) [1, 2, 3]
```

# 3. 精准依赖收集

回顾一下我们的数据响应式系统，现在我们有 observify 方法使一个对象（还有难伺候的数组！）响应化，有个全局 Dep 类存放多个订阅，还有 Watcher 生成订阅源。将对象响应化之后，我们可以生成订阅，添加订阅，追加订阅。每当对象被修改，Dep 就会收到通知，然后通知所有订阅源都执行回调。

考虑生产环境中一个常见的场景：页面模板中只引用了 `o.a` 和 `o.b`，如 `<p>{o.a + o.b}</p>`。我们期望数据变化时，自动执行 `render` 函数重新渲染页面，然而当 `o.c` 等无关数据发生变化时，也会触发订阅源的更新，这就造成了性能的浪费。如何让我们的监测更智能一些，只在『用到的数据』变化时，才触发订阅源的更新呢？这时 `getter` 就派上用武之地了。

`<p>{a + b}</p>` 模板引擎在编译时会被解释为 render 函数。本文不会涉及编译相关内容，我们可以简单的理解为，该段模板最终会编译为：

```javascript
function render() {
  return '<p>' + (o.a + o.b) + '</p>'
}
```

在页面的初始化阶段，render 函数会执行一次，得到初始结果。函数执行时，所依赖的数据一定会被访问，并触发其 getter，未依赖的数据则不会触发 getter。我们可以在 getter 过程中标记当前的键，即『依赖收集』，仅在被标记的键修改时，才去触发订阅的更新。

由于现在的订阅颗粒度由数据整体细化到了单独的键，所以一个全局 Dep 是不够用的。我们需要为每个键都维护一个 Dep。

![reactivity-system-3](/imgs/blog/reactivity-system-3.png)

在键的 getter 触发时将当前 watcher 加入 dep 中，完成依赖收集。setter 触发时通知当前键的 dep，执行订阅源的更新。这样即可实现『仅当依赖到的数据修改时，才触发更新』了。

继续完善我们的响应式系统：

[在线示例](https://jsfiddle.net/jin5354/hb59dkyf/)

```javascript
// Dep 类，添加依赖收集方法 depend
let uid = 1
class Dep {

  constructor() {
    this.id = uid++ // 为每个 dep 标记一个 uid
    this.subs = []
  }

  addSub(sub) {
    this.subs.push(sub)
  }

  depend() { // 依赖收集函数，在 getter 中执行，在 Dep.target 上找到当前 watcher，并添加依赖
    Dep.target && Dep.target.addDep(this)
  }

  notify() {
    this.subs.forEach(sub => {
      sub.update()
    })
  }

}
Dep.target = null // Dep.target 用来暂存正在收集依赖的当前 watcher

// 现在 Wactcher 接收三个参数，第一个为依赖收集函数（如上文的 render），第二个为回调，第三个为附加配置
class Watcher {

  constructor(expFn, cb, options = {}) {
    this.context = options.context
    this.expFn = expFn
    this.depIds = new Set()  //标记当前 watcher 已经加入到了哪些 dep
    this.cb = cb
    this.value = this.subAndGetValue()
    this.clonedOldValue = _.cloneDeep(this.value)
  }

  // 执行回调
  update() {
    let value = this.subAndGetValue() //获取 newValue
    if(!_.isEqual(value, this.clonedOldValue)) { // 比对前后两次值是否相等时借助一下 lodash 中的 isEqual 函数进行比较
      this.value = value
      this.cb.call(this.context, value, this.clonedOldValue)
      this.clonedOldValue = _.cloneDeep(value) // 缓存本次结果，会成为下次的 oldValue, 对于对象使用深拷贝
    }
  }

  //执行依赖收集函数，订阅依赖！
  subAndGetValue() {
    Dep.target = this // 把当前 watcher 放到 Dep.target 上，这样 getter 就知道应该把哪个 watcher 加入 dep 中了。
    let value = this.expFn.call(this.context)
    Dep.target = null // 订阅完置回空。
    return value
  }

  // 在 dep 上添加订阅
  addDep(dep) {
    if(!this.depIds.has(dep.id)) { //防止重复订阅，防止在一个 dep 中订阅两次
      this.depIds.add(dep.id)
      dep.addSub(this)
    }
  }
}

//简单封装下 new Watcher
function watch(expFn, cb, context) {
  return new Watcher(expFn, cb, context)
}

// 修改 defineReactive
function defineReactive(obj, key, value) {
  //为每个键都创建一个 dep
  let dep = new Dep()

  observify(value)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      if(Dep.target) {
        dep.depend()
      }
      return value
    },
    set: (newValue) => {
      if(newValue === value) {
        return
      }else {
        value = newValue
        observify(newValue)
        dep.notify()
      }
    }
  })
}

... 其他部分不变

let o = {
  a: 1,
  b: 2,
  c: {
    d: 3
  }
}

observify(o)

watch(() => {
  return o.a + o.b
}, (newValue, oldValue) => {
  console.log('更新！新值为：', newValue, '，旧值为：', oldValue)
})

o.b = 3  //  输出：更新！新值为： 4 ，旧值为： 3
o.c.d = 4  // 无输出

```

由于不存在全局 dep，且向 dep 中注册订阅的操作在 getter 中依赖收集阶段自动执行了，所以我们不再需要手动操作 dep。现在我们的数据响应式系统只需要暴露两个 api：`observify` 和 `watch` 就够了。`watch` 中接收两个函数，第一个 expFn 函数根据依赖返回需要的结果；第二个函数则是第一个函数结果的回调。

我们的响应式系统已经可以实现 Vue 中的 watch 和 computed 功能：watch 某个键值的变动，如 o.a ，实际就是 expFn 函数返回该键的值；而计算属性就是将计算属性的函数体作为 expFn，回调中赋值即可。

```javascript
// 实现 Vue 中的 watch 某个键的功能
watch(() => {
  return o.a
}, (newValue, oldValue) => {
  console.log('更新！新值为：', newValue, '，旧值为：', oldValue)
})

// 实现 Vue 中的计算属性，比如新增一个叫 something 的计算属性
watch(() => {
  return o.a + o.b
}, (newValue, oldValue) => {
  something = newValue
})

//实现 Vue 中的自动更新，每次依赖数据变化时重新渲染 DOM
watch(() => {
  return '<p>' + (o.a + o.b) + '</p>'
}, (newValue) => {
  document.getElementById('app').innerHTML = newValue
})

```

现在我们来看 Vue 文档中响应式系统的示意图，就非常好理解了。

![vue-reactivity](https://cn.vuejs.org/images/data.png)

# 4. 异步更新队列

考虑这种情况：我们拥有形如 `<p>{o.a + o.b + o.c.d}</p>` 的模板，它会被编译为拥有 3 个依赖的 render 函数：

```javascript
let o = {
  a: 1,
  b: 2,
  c: {
    d: 3
  }
}

observify(o)

watch(() => {
  return o.a + o.b + o.c.d
}, (newValue, oldValue) => {
  ...更新 DOM 的操作...
  console.log('更新DOM！新值为：', newValue, '，旧值为：', oldValue)
})

o.a = 2  //  更新DOM！新值为： 7 ，旧值为： 6
o.a = 3  //  更新DOM！新值为： 8 ，旧值为： 7
o.a = 4  //  更新DOM！新值为： 9 ，旧值为： 8

```
这段代码执行了三次 render 函数。实际上我们只需要执行最后一次的 render 即可得到结果，前两次的 render 可以丢弃。我们可以开启一个**队列**，将一个**事件循环**内的全部数据变动缓冲在其中，并对 watcher 做去重操作。在下一个 tick 中我们再将队列中的 watcher 依次取出并执行更新。这对避免不必要的计算和 DOM 操作非常重要。

继续改进我们的系统：默认情况下数据变动会缓冲，推入队列；同时为 watcher 函数的配置项中增加 `immediate` 字段，显式标记为 `true` 的 watcher 不进行缓冲，依然会在数据变动后立刻执行回调，保持灵活性。

[在线示例](https://jsfiddle.net/jin5354/atq6Lc4x/)

```javascript
// 利用 MutationObserver 或 Promise.then(环境不支持MO时) 实现简易的 nextTick 函数
// MutationObserver 与 Promise.then 中的回调均在下一个 microTask 中执行
// from https://github.com/nx-js/observer-util/blob/master/src/nextTick.js
const supportMO = typeof MutationObserver !== 'undefined'

function nextTick(task) {
  return (() => {
    /* istanbul ignore if */
    if(supportMO) {
      let counter = 1
      const observer = new MutationObserver(task)
      const textNode = document.createTextNode(String(counter))
      observer.observe(textNode, {characterData: true})
      textNode.textContent = 2
    }else {
      return Promise.resolve().then(task)
    }
  })()
}

// 维护队列，只有 watcher id 不同时才推入，避免重复计算
const queue = []
let watcherIds = {}
let waiting = false

// 执行队列中全部的 watcher
function flushSchedulerQueue() {
  queue.forEach(watcher => {
    watcher.run()
    queue.length = 0
    watcherIds = {}
    waiting = false
  })
}

// 将 watcher 推入 queue
function queueWatcher(watcher) {
  const uid = watcher.uid

  if(!watcherIds[uid]) {
    watcherIds[uid] = true
    queue.push(watcher)

    if (!waiting) {
      waiting = true
      nextTick(flushSchedulerQueue) // 在下个 tick 时执行 flushSchedulerQueue
    }
  }
}

// watcher 中加入 id 标识身份，加入 immediate 字段，true 时才执行回调，否则推入队列
let watcherUid = 1

class Watcher {

  constructor(expFn, cb, options = {}) {
    this.uid = watcherUid++
    this.context = options.context
    this.immediate = options.immediate
    this.expFn = expFn
    this.depIds = new Set()  //标记当前 watcher 已经加入到了哪些 dep
    this.cb = cb
    this.value = this.subAndGetValue()
    this.clonedOldValue = _.cloneDeep(this.value)
  }

  /**
   * [update 更新，根据 immediate 参数判断是否立刻执行回调]
   */
  update() {
    if(this.immediate) {
      this.run()
    }else {
      queueWatcher(this)
    }
  }

  /**
   * [run 执行回调]
   */
  run() {
    let value = this.subAndGetValue() //获取 newValue
    if(!_.isEqual(value, this.clonedOldValue)) {
      this.value = value
      this.cb.call(this.context, value, this.clonedOldValue)
      this.clonedOldValue = _.cloneDeep(value) // 缓存本次结果，会成为下次的 oldValue
    }
  }
}

...其他部分相同

let o = {
  a: 1,
  b: 2,
  c: {
    d: 3
  }
}

observify(o)

watch(() => {
  return o.a + o.b
}, (newValue, oldValue) => {
  console.log('更新！新值为：', newValue, '，旧值为：', oldValue)
})

watch(() => {
  return o.b + o.c.d
}, (newValue, oldValue) => {
  console.log('更新！新值为：', newValue, '，旧值为：', oldValue)
}, {
  immediate: true
})

o.b = 3 // 输出：更新！新值为： 6 ，旧值为： 5
o.b = 4 // 输出：更新！新值为： 7 ，旧值为： 6

o.a = 2
o.a = 3
o.a = 4 // 只输出一次： 更新！新值为： 8 ，旧值为： 3
```

# 5. 缺陷与补充

## 5.1 key 的添加与删除

由于 watcher 在 getter 注册的 dep 只能被 setter 操作所触发更新，所以不触发 setter 操作的修改行为就无法触发订阅更新，比如对象键值的添加与删除，以及数组的变异方法（上文中的变异方法通知的是全局 Dep，使用依赖收集后的 get/set Dep 无法被变异方法访问到）。

由于只有对象和数组存在这些问题，所以 Vue 除了每个 key 的 dep 外，还为每个 key 对应值为对象/数组创建了另一个 dep，挂在该对象和数组的 \__ob\__ 属性上。在依赖收集阶段，watcher 将被同时注册在这两个 dep 上，准备接收响应。setter 操作，通知 set/get 中的 dep；非 setter 操作，如对象 key 添加删除、数组变异方法调用，通知 \__ob\__ 中的 dep。

添加函数 `set` 与删除函数 `del` 的代码不再赘述，详见 [leaf-observable](https://github.com/jin5354/leaf-observable) 内 `observable.js` 的[相关代码](https://github.com/jin5354/leaf-observable/blob/master/src/observable.js#L136-L189)。

![reactivity-system-4](/imgs/blog/reactivity-system-4.png)

## 5.2 深度数据追踪

考虑：

```
let o = {
  a: { b: { c: { d: { e: 1 }}}}}

observify(o)

watch(() => {
  return o.a.b.c
}, (newValue, oldValue) => {
  console.log('更新！新值为：', newValue, '，旧值为：', oldValue)
})

o.a.b = { // 输出：更新！新值为： Object ，旧值为： Object
  c: {
    d: {
      e: 2
    }
  }
}

o.a.b.c.d.e = 3 //无输出
```

依赖收集过程中访问 o.a.b.c 时，依次触发了 o.a、o.a.b、o.a.b.c 的 getter，将 watcher 注册进对应的 dep，所以 o.a.b.c 的上游变化同样可以监测到；但是修改 c 内部的属性时便无法得到通知。（对于复杂类型值的 setter，只监测引用变化，不监测内部变化）

我们可以增加一个 deep watch 功能。原理很简单：当发现依赖目标为一个对象时，递归进去遍历每一个子属性，主动触发一下 getter 即可。

具体代码不再赘述，可参见 [leaf-observable](https://github.com/jin5354/leaf-observable) 内 `watcher.js` 中 `deep watch` 的[相关代码](https://github.com/jin5354/leaf-observable/blob/master/src/watcher.js#L61-L72)。

# 6. Proxy：过去未去，未来已来

> ES6 为 JavaScript 增加了几种新的元编程形式，其中最明显的特性即为代理（Proxy）。一个 Proxy 是一种特殊对象，包在另一个普通对象前面，你可以在代理对象上注册特殊的处理器，当对这个代理实施各种操作时被调用。这些处理器除了将操作**传送**到原本的目标/被包装的对象上之外，还有机会运行额外的逻辑。

代理能够观察到的处理器（一部分）：

| 处理器             | 触发时机                                                                                            |
|--------------------|-----------------------------------------------------------------------------------------------------|
| get(..)            | 在代理上访问一个属性（Reflect.get(..)，.属性操作符或[ .. ]属性操作符）                              |
| set(..)            | 在代理对象上设置一个属性（Reflect.set(..)，=赋值操作符，或者解构赋值 —— 如果目标是一个对象属性的话) |
| deleteProperty(..) | 在代理对象上删除一个属性 (Reflect.deleteProperty(..)或delete)                                       |
| apply(..)          | 代理作为一个普通函数/方法被调用（Reflect.apply(..)，call(..)，apply(..)，或者(..)调用操作符）       |
| ...                | ...                                                                                                 |

Proxy 不但可以取代 `Object.defineProperty` 并且还扩增了非常多的功能。Proxy 技术支持监测数组的 push 等方法操作，支持对象属性的动态添加和删除，极大的简化了响应化的代码量。

当前 Proxy 的不足也很明显：不支持 Polyfill，浏览器兼容性非常差（IE 全系列不支持，iOS 10+ 支持，Android 5+ 支持），且因为是『代理』而非劫持，不能直接操作原对象，只能操作代理对象。但是相信，随着浏览器支持逐步跟上，强大的 Proxy 一定会成为下一代数据监测的首选方案。

几个由 Proxy 驱动的数据监测库，推荐阅读源码：

- [dynamic-object](https://github.com/ascoders/dynamic-object)
- [observer-util](https://github.com/nx-js/observer-util/)

# 7. 参考资料

1. [JavaScript 标准参考教程 - Object.defineProperty()](http://javascript.ruanyifeng.com/stdlib/attributes.html#toc2)
2. [vue 源码分析之如何实现 observer 和 watcher](https://segmentfault.com/a/1190000004384515)
3. [vue早期源码学习系列](https://github.com/youngwind/blog/labels/Vue)
4. [Vue源码详细解析(一)--数据的响应化 ](https://github.com/Ma63d/vue-analysis/issues/1)
5. [深入响应式原理](https://cn.vuejs.org/v2/guide/reactivity.html)
6. [剖析Vue实现原理 - 如何实现双向绑定mvvm](https://github.com/DMQ/mvvm)
7. [Vue源码注释版](https://github.com/Ma63d/vue-analysis)
8. [Mobx 思想的实现原理，及与 Redux 对比](https://zhuanlan.zhihu.com/p/25585910)
9. [从零开始用 proxy 实现 Mobx](https://zhuanlan.zhihu.com/p/27097547)
10. [使用 ES6 Proxy 实现数据绑定](http://www.zcfy.cc/article/writing-a-javascript-framework-data-binding-with-es6-proxies-risingstack-1655.html)
11. [Can I use Proxy?](http://caniuse.com/#search=proxy)
12. [leaf-observable](https://github.com/jin5354/leaf-observable)
