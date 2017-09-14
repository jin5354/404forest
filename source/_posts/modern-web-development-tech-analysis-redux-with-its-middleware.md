title: 现代前端科技解析 —— Redux 及其中间件
categories:
  - Code
tags:
  - Modern web development tech analysis
  - 现代前端科技解析
  - Redux
toc: true
date: 2017-9-13 15:45:11
---

[上篇文章](https://www.404forest.com/2017/09/09/put-the-complexity-of-redux-in-perspective/)中阐释了我对 Redux 架构及其复杂性的看法，提到了 Redux 本质是一个非常简单易懂的状态管理架构，本文将解析 Redux 的源码，并从零实现一个带有中间件系统的 Redux。

<!-- more -->

> 注：
> 原始链接: https://www.404forest.com/2017/09/13/modern-web-development-tech-analysis-redux-with-its-middleware/
> 文章备份: https://github.com/jin5354/404forest/issues/64
> redux 源码: https://github.com/vuejs/vue/tree/dev/src/core/observer
> 本文实现的 redux（附注释和 100% 测试）：https://github.com/jin5354/leaf-store

# 1. 设计一个 Redux

首先，我们抽出一个典型的 Redux 用法：

```javascript
// 初始状态，用户自己写
const initialState = {
  counter: 0,
}

// reducer，用户自己写
// 观察可知：该函数接收旧 state 和 action，返回新 state。若参数均为空，则会返回初始状态。
const reducer = (state = initialState, action) => {
  switch(action.type) {
    case('ADD_COUNTER'): {
      return Object.assign({}, state, {
        counter: state.counter + 1
      })
    }
    default: {
      return state
    }
  }
}

// createStore，Redux 实现，接收 reducer 作为参数
const store = createStore(reducer)

// dispatch，Redux 实现，接收 action 作为参数
store.dispatch({
  type: 'ADD_COUNTER'
})

// getState，Redux 实现
console.log(store.getState().counter)
```
上面是一个 Redux 的极简用例。我们看到 Redux 主要的几个功能点如下：

- `createStore` 根据 `reducer` 创建 `store`
- `dispatch` 派发 `action`，执行 `reducer` 进行数据修改与更新
- `getState` 获取当前 `state`

# 2. 实现 createStore、dispatch 和 getState

调用 `createStore` 应该传入一个 `reducer`，返回一个 `store` 对象，其包含两个方法：`dispatch` 和 `getState`。

```javascript
function createStore(reducer) {
  let state //当前状态的 state

  const getState = () => { //获取当前 state
    return state
  }

  const dispatch = (action) => {...} //派发 action

  return {
    getState,
    dispatch
  }
}
```

调用 dispatch 进行数据修改时会传入 action，我们需要执行 reducer 拿到新状态。

```javascript
function createStore(reducer) {
  let state //当前状态的 state

  const getState = () => { // 获取当前 state
    return state
  }

  const dispatch = (action) => { // 派发 action
    state = reducer(state, action) // 用新 state 替换旧 state
  }

  return {
    getState,
    dispatch
  }
}
```

现在 `getState` 和 `dispatch` 就可以正常工作了。不过，在 `createStore` 后，我们调用 `getState` 返回的是 `undefined`。我们需要初始化 `state` 为初始 `state`。发一个空的 disptach，获得默认 state。

```javascript
function createStore(reducer) {
  let state //当前状态的 state

  const getState = () => { // 获取当前 state
    return state
  }

  const dispatch = (action) => { // 派发 action
    state = reducer(state, action) // 用新 state 替换旧 state
  }

  // 发一个空的 disptach，获得默认 state, 要求在写 reducer 时在 switch 中加一个 default: return state 分支
  dispatch({})

  return {
    getState,
    dispatch
  }
}
```

现在我们就得到了一个不过 20 行的极简版的 Redux，其已经能满足第一节中的使用需求了。

[在线示例](https://jsfiddle.net/jin5354/v2px3uvr/)

# 3. 功能增强

Redux 的源码包括以下几个文件：

![Redux-1](/imgs/blog/redux-1.png)

其中 `createStore.js` 实现的即是 `createStore` 函数，其核心即为上一节的 20 行代码。我们参照 Redux，为我们的极简版本加功能。

## 3.1 subscribe

在 Redux 中，我们可以使用 `store.subscribe(callback)` 来注册监听函数，监听函数将在每次 `dispatch` 之后执行。我们来添加一个 subscribe 函数。这里明显要使用发布-订阅模式，维护一个 `listeners` 数组，其中存储全部的监听函数。执行 `subscribe` 返回一个 `unsubscribe` 函数，执行 `unsubscribe` 即可解绑。

```javascript
function createStore(reducer) {
  let state
  const listeners = [] // 存储监听函数

  const getState = () => { ... }

  const subscribe = (listener) => {
    listeners.push(listener)

    return function unsubscribe() { //返回一个 unsubscribe 函数，执行即可解绑。
      const index = listeners.indexOf(listener)  //这样删除有一点点问题……
      listeners.splice(index, 1)
    }
  }

  const dispatch = (action) => {
    state = reducer(state, action)
    listeners.forEach(listener => { // 每次 dispatch 之后执行全部 listen
      listener()
    })
  }

  dispatch({})

  return {
    getState,
    dispatch,
    subscribe
  }
}
```
目前 `Redux` 中 `subscribe` [就是这样实现的](https://github.com/reactjs/Redux/blob/master/src/createStore.js#L119)，不过这里有个小问题：使用 `indexOf(listener)` 来查找数组中 `listener` 的位置时，如果 `listener` 有多个重复的，那么只会返回第一个——也就是说如果你多次 `subscribe` 了一个函数，那么无论你执行哪一个 `unsubscribe`，删掉的都是第一个 `listener`。看看例子：

[在线示例](https://jsfiddle.net/jin5354/m3ahmhL9/)

我顺便提了个 [PR](https://github.com/reactjs/Redux/pull/2604)，维护者认为这是极小概率事件，就先不处理了。要修复这个缺陷也好办，为每个 `listener` 加一个 unique ID 即可区分。

## 3.2 combineReducers

大型项目往往是多人开发的，多个人同时修改一个 `reducer` 极易造成冲突，我们希望 `reducer `可以是模块化的，每个人维护一个模块，最终可以通过一个方法组装成 `root reducer`。

```javascript
const initialStateA = {
  counterA: 0,
}

const reducerA = (state = initialStateA, action) => { ... }

const initialStateB = {
  counterB: 10,
}

const reducerB = (state = initialStateB, action) => { ... }

//通过 combineReducers 方法将各个 reduce 组合起来
const store = createStore(combineReducers({
  reducerA,
  reducerB
}))

console.log(store.getState().reducerA.counterA) // 输出：0
console.log(store.getState().reducerB.counterB) // 输出：10
```

观察可知，该方法应接收一个包含多个 `reducer` 的对象（数组也可以，对象可以通过 key 来重命名 `reducer`），返回一个组装后的 `reducer`。
根 `reducer` 将子 `reducer` 的 state 以 key 为属性挂在根 `reducer` 的 state 上，每次接受 action 时，按 key 来获取每个子 `reducer` 的状态，并将产生的新状态进行替换。
```javascript
/**
 * [combineReducers 组合多个 reducer]
 * @param  {[object]} reducers
 * @return {[type]}
 */
function combineReducers(reducers) {
  //拿到所有子 reducer 的 key
  const reducerKeys = Object.keys(reducers)

  //返回一个组装后的 reduce
  return function combination(state = {}, action) {
    let newState = {}
    let hasChanged = false // 如果各个子 reducer 的 state 均未变化就直接返回原 state
    reducerKeys.forEach(key => {
      // 获取子 reducer 的状态，再用子 reducer 产生的新状态替换掉
      let oldKeyState = state[key]
      let newKeyState = reducers[key](state[key], action)
      newState[key] = newKeyState // 挂在根 state 上
      hasChanged = hasChanged || newKeyState !== oldKeyState
    })
    return hasChanged ? newState : state
  }
}
```

# 4.实现中间件系统

如果你使用过 Redux，你一定知道若要在 Redux 流程内处理异步操作，必须借助中间件 `Redux-thunk`。Redux 自身无法处理异步操作。`dispatch` 派发的 `action` 默认只能是一个 `plain Object`。

使用 `Redux-thunk` 中间件后，`dispatch` 方法就可以接收一个函数作为参数，在函数中我们就可以实现更多的功能。Redux 是如何设计的中间件系统，使得第三方中间件可以扩展原生 `dispatch`?

## 4.1 以 monkeypatch 举例

假设我们要为 `dispatch` 加一个 log 功能。能够把 `dispatch` 后的 `state` 打印出来。而使用时还是直接调用 `store.dispatch`。我们可以直接对 `dispatch` 进行魔改。

```javascript
// 先把原生的 dispatch 存起来
let next = store.dispatch

// 魔改 dispatch
store.dispatch = action => {
  //可以做点预处理
  //执行原生 dispatch
  next(action)
  //还可以再做点后处理
  console.log('dispatch 完毕，state 为：', store.getState())
}
```
简单画个图：

![Redux-2](/imgs/blog/redux-2.png)

如果要再加一个功能咋办？如法炮制：

```javascript
// 先把原生的 dispatch 存起来
let next = store.dispatch

// 魔改 dispatch
store.dispatch = action => {
  //可以做点预处理
  //执行原生 dispatch
  next(action)
  //还可以再做点后处理
  console.log('dispatch 完毕，state 为：', store.getState())
}

// 这里存的是魔改 1 层 dispatch 了
let next2 = store.dispatch

// 在 1 层的基础上再魔改 dispatch
store.dispatch = action => {
  //预处理2
  //执行魔改 1 层 dispatch
  next2(action)
  //后处理2...
}

```
这样做就实现了多个中间件的串联，每次我们调用 `store.dispatch` 时，实际上是这样执行的:

![Redux-3](/imgs/blog/redux-3.png)

Redux 中中间件的执行原理就是这样，但 Redux 中调整了中间件写法。我们的这个简陋版中间件系统要求开发者和用户这么使用：

```javascript
// 第三方中间件开发者要这么开发：
function someMiddleware(store) {
  let next = store.dispatch

  //魔改 dispatch
  store.dispatch = action => {
    //预处理
    next(action)
    //后处理
  }
}

// redux 用户要这么使用中间件：
const store = createStore(reducer)

someMiddleware1(store)
someMiddleware2(store)
...
```
## 4.2 优化 monkeypatch

上文的写法有以下几个缺点：

缺点1：用户用起来不方便，添加中间件行为明显集成在 `createStore` 中更方便：
```javascript
const store = createStore(reducer, applyMiddleware(someMiddleware1, someMiddleware2))
```
缺点2：中间件开发者权力过大，可以任意操纵 `store`。Redux 只允许中间件对 `dispatch` 功能进行扩展，需要对中间件进行可访问性限制。
缺点3：多中间件条件下，每个中间件中拿到的 `store` 只是环节中的中间产物，无法拿到最终 `store`。若要在中间件中派发新的 `dispatch`，我们期望
使用最终 `store` 的 `dispatch` 进行派发，这样才能保证所有 `dispatch` 行为是一致的。

我们来看 Redux 是如何解决这三个问题的：

```javascript
//为了使用 createStore(reducer, applyMiddleware(middlewares...)) 用法
//修改 createStore

function createStore(reducer, enhancer) {

  // 如果有中间件，在 enhancer(即 applyMiddleware(middlewares...)) 中进行 store 初始化与应用中间件工作
  if(typeof enhancer !== 'undefined') {
    return enhancer(createStore)(reducer)
  }

  let state
  let listeners = []

  const getState = () => {...}
  const subscribe = (listener) => {...}
  const dispatch = (action) => {...}

  dispatch({})

  return {
    getState,
    dispatch,
    subscribe
  }
}
```
这样，执行 `createStore(reducer, applyMiddleware(middlewares...))` 即为执行 `applyMiddleware(middlewares...)(createStore)(reducer)`。

```javascript
function applyMiddleware(...middlewares) {
  return (createStore) => (reducer) => {
    // 使用 createStore 初始化 store
    const store = createStore(reducer)
    let dispatch = store.dispatch

    // 准备一个变量，仅包含 getState 和 dispatch 两个 api
    const storeWithLimitedAPI = {
      getState: store.getState(),
      dispatch: (...args) => dispatch(...args)
      // 这里为什么不直接 dispatch: dispatch 而是写了个闭包？
      // 因为 storeWithLimitedAPI 是要传递给中间件的，我们期望这里的 dispatch 指的是最终 store 的 dispatch
      // 在下文的代码中，dispatch 会被替换，如果使用 dispatch: dispatch，这里的 dispatch 不会更新，依旧指向原生 dispatch
      // 只有写做闭包，执行时的 dispatch 才会指向正确的、最终 store 的 dispatch
    }

    // 使用中间件将 store.dispatch 重写 这里可以直接用 forEach 土方法写
    middlewares.reverse().forEach(middleware => {
      // 这里为 middleware 传进了两个参数。storeWithLimitedAPI 可以让中间件拿到最终 store 的 getState 和 dispatch 方法
      // dispatch 参数则是中间环节的 dispatch，即上一个 middleware 处理过后的 dispatch
      // 例：对于魔改第三层的中间件，这里的 dispatch 即为魔改第二层处理后的 dispatch
      dispatch = middleware(storeWithLimitedAPI)(dispatch)
    })

    // 在 redux 源码中使用了 compose 的写法，compose 为语法糖，为了好看
    // let chain = middlewares.map(middleware => middleware(storeWithLimitedAPI))
    // dispatch = compose(...chain)(dispatch)

    // 向用户返回 store，可见应用了中间件后的 store 只有 dispatch 发生了变化，其他 API 都不变，保证安全
    return {
      ...store,
      dispatch
    }
  }
}

```
通过调整 createStore 的 API 修复了缺点1。控制参数传入，只给 middleware 传进 dispatch 和 storeWithLimitedAPI，限制了 middleware 的操作范围。storeWithLimitedAPI 中提供了最终 store 的 dispatch，使得从中间件内部派发新 disptatch 成为可能，这样缺点2和3也解决了。

applyMiddleware 中是这样调用 middleware 的：
```javascript
dispatch = middleware(storeWithLimitedAPI)(dispatch)
```
这就要求中间件的形式是：一个函数，接收两个参数，返回新 dispatch。我们拿 redux-thunk 的源码来看：

```javascript
function createThunkMiddleware(extraArgument) {

  // 对应  (storeWithLimitedAPI)   (dispatch)
  return ({ dispatch, getState }) => next => action => {

    // 在 redux-thunk 中间件中，如果发现 action 是一个函数
    // 则会执行该函数，并将最终 store 的 dispatch、getState 都作为参数传进去，任由该函数使用
    // 从而为 dispatch 扩展了处理函数的功能
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    // 如果发现 action 不是函数，那就原封不动的传递给下一个中间件，不做任何额外处理。
    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
```

中间件的执行原理可见下图。

![Redux-4](/imgs/blog/redux-4.png)

## 4.3 compose

初看 redux 源码时，见到 compose 可能会觉得懵逼，实际上只是个语法糖。由于多中间件时 dispatch 会被反复替换，所以会写出这样的代码：

```javascript
// 三个中间件， middlewareA, middlewareB, middlewareC

dispatch = middlewareC(middlewareB(middlewareA(dispatch)))
```
这样写不美观，中间件越多看起来越乱，所以引入 compose 函数用来整理：

```javascript
// 用了 compose 可以这么写, 最终效果完全一样
dispatch = compose(middlewareA, middlewareB, middlewareC)(dispatch)

//compose 实现不难，只是使用了 reduce
function compose(...funcs) {

  if(funcs.length === 0) {
    return arg => arg
  }

  if(funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => {
    return function(...args) { //关键在这两行
      return a(b(...args))
    }
  })
}
```
# 5.参考资料

1. [React.js 小书](http://huziketang.com/books/react/)
2. [Redux从设计到源码](https://tech.meituan.com/redux-design-code.html)
3. [Async Actions](http://redux.js.org/docs/advanced/AsyncActions.html)
4. [Middleware](http://redux.js.org/docs/advanced/Middleware.html)
5. [redux-thunk/src/index.js](https://github.com/gaearon/redux-thunk/blob/master/src/index.js)
