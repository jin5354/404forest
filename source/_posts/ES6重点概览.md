title: ES6重点概览
categories:
  - Code
tags:
  - javascript
  - ES6
toc: true
date: 2016-01-28 16:40:11
---

# let 与 const

let命令，用来声明变量。它的用法类似于var，但是所声明的变量，只在let命令所在的代码块内有效。

- let不像var那样会发生“变量提升”现象。所以，变量一定要在声明后使用，否则报错。
- 只要块级作用域内存在let命令，它所声明的变量就“绑定”（binding）这个区域，不再受外部的影响。
- 总之，在代码块内，使用let命令声明变量之前，该变量都是不可用的。这在语法上，称为“暂时性死区”（temporal dead zone，简称TDZ）。
- let不允许在相同作用域内，重复声明同一个变量。
- ES6也规定，函数本身的作用域，在其所在的块级作用域之内。内部声明的函数皆不会影响到作用域的外部。

const也用来声明变量，但是声明的是常量。一旦声明，常量的值就不能改变。

- const声明的变量不得改变值，这意味着，const一旦声明变量，就必须立即初始化，不能留到以后赋值。
- const声明的常量，也与let一样不可重复声明。
- 对于复合类型的变量，变量名不指向数据，而是指向数据所在的地址。const命令只是保证变量名指向的地址不变，并不保证该地址的数据不变，所以将一个对象声明为常量必须非常小心。如果真的想将对象冻结，应该使用Object.freeze方法。

ES6一方面规定，var命令和function命令声明的全局变量，依旧是全局对象的属性；另一方面规定，let命令、const命令、class命令声明的全局变量，不属于全局对象的属性。

----

# 变量解构赋值

ES6允许按照一定模式，从数组和对象中提取值，对变量进行赋值，这被称为解构（Destructuring）。只要等号两边的模式相同，左边的变量就会被赋予对应的值。如果解构不成功，变量的值就等于undefined。

```
let [foo, [[bar], baz]] = [1, [[2], 3]];
```

另一种情况是不完全解构，即等号左边的模式，只匹配一部分的等号右边的数组。这种情况下，解构依然可以成功。

```
let [x, y] = [1, 2, 3];
x // 1
y // 2
```

解构赋值适用于var、let、const命令、Set结构。事实上，只要某种数据结构具有Iterator接口，都可以采用数组形式的解构赋值。

解构赋值允许指定默认值。如果默认值是一个表达式，那么这个表达式是惰性求值的，即只有在用到的时候，才会求值。

```
var [foo = true] = [];
foo // true
```

解构不仅可以用于数组，还可以用于对象。对象的解构与数组有一个重要的不同。数组的元素是按次序排列的，变量的取值由它的位置决定；而对象的属性没有次序，变量必须与属性同名，才能取到正确的值。如果变量名与属性名不一致，必须写成下面这样。

```
var { foo: baz } = { foo: "aaa", bar: "bbb" };
baz // "aaa"

let obj = { first: 'hello', last: 'world' };
let { first: f, last: l } = obj;
f // 'hello'
l // 'world'
```

字符串也可以解构赋值。这是因为此时，字符串被转换成了一个类似数组的对象。
```
const [a, b, c, d, e] = 'hello';
a // "h"
b // "e"
c // "l"
d // "l"
e // "o"
```
解构赋值时，如果等号右边是数值和布尔值，则会先转为对象。解构赋值的规则是，只要等号右边的值不是对象，就先将其转为对象。由于undefined和null无法转为对象，所以对它们进行解构赋值，都会报错。

函数的参数也可以使用解构赋值。
```
function add([x, y]){
  return x + y;
}

add([1, 2]) // 3
```
以下三种解构赋值不得使用圆括号。可以使用圆括号的情况只有一种：赋值语句的非模式部分，可以使用圆括号。

- 变量声明语句中，模式不能带有圆括号。
- 函数参数中，模式不能带有圆括号。
- 不能将整个模式，或嵌套模式中的一层，放在圆括号之中。

主要用途：

- 交换变量的值 `[x, y] = [y, x]`
- 从函数返回多个值
```
function example() {
  return [1, 2, 3];
}
var [a, b, c] = example();
```
- 函数参数的定义
- 提取JSON数据
- 函数参数的默认值
- 遍历Map结构
- 输入模块的指定方法

----

# 字符串扩展

## 字符的Unicode表示法

JavaScript允许采用\uxxxx形式表示一个字符，其中“xxxx”表示字符的码点。但是，这种表示法只限于\u0000——\uFFFF之间的字符。超出这个范围的字符，必须用两个双字节的形式表达。如果直接在“\u”后面跟上超过0xFFFF的数值（比如\u20BB7），JavaScript会理解成“\u20BB+7”。ES6对这一点做出了改进，只要将码点放入大括号，就能正确解读该字符。`\u{20BB7

## codePointAt() 返回字符码点

正确处理4个字节储存的字符，返回一个字符的码点。charCodeAt()的升级版。

## String.fromCodePoint() 从码点返回字符

正确识别大于0xFFFF的码点，从码点返回对应字符。fromCharCode()的升级版。

## 字符串的遍历器接口

ES6为字符串添加了遍历器接口（详见《Iterator》一章），使得字符串可以被for...of循环遍历。
```
for (let codePoint of 'foo') {
  console.log(codePoint)
}
// "f"
// "o"
// "o"
```
这个遍历器最大的优点是可以识别大于0xFFFF的码点，传统的for循环无法识别这样的码点。

## at() 返回指定位置字符

返回字符串给定位置的字符，可以识别Unicode编号大于0xFFFF的字符。charAt的升级版。

## normalize() 统一字符

将字符的不同表示方法统一为同样的形式，这称为Unicode正规化。

## includes(), startsWith(), endsWith() 确定一个字符串是否包含在另一个字符串中

indexOf的升级，用来确定一个字符串是否包含在另一个字符串中。

- includes()：返回布尔值，表示是否找到了参数字符串。
- startsWith()：返回布尔值，表示参数字符串是否在源字符串的头部。
- endsWith()：返回布尔值，表示参数字符串是否在源字符串的尾部。

## repeat() 重复原字符串

repeat方法返回一个新字符串，表示将原字符串重复n次。 `'hello'.repeat(2) // "hellohello"`

## padStart()，padEnd() 通过指定字符串补全原字符串到指定长度

ES7推出了字符串补全长度的功能。如果某个字符串不够指定长度，会在头部或尾部补全。padStart用于头部补全，padEnd用于尾部补全。一共接受两个参数，第一个参数用来指定字符串的最小长度，第二个参数是用来补全的字符串。

## String.raw() 返回斜杠被转义的字符串

String.raw方法，往往用来充当模板字符串的处理函数，返回一个斜杠都被转义（即斜杠前面再加一个斜杠）的字符串，对应于替换变量后的模板字符串。

## 模板字符串

模板字符串（template string）是增强版的字符串，用反引号（`）标识。它可以当作普通字符串使用，也可以用来定义多行字符串，或者在字符串中嵌入变量。

```
// 普通字符串
`In JavaScript '\n' is a line-feed.`

// 多行字符串
`In JavaScript this is
 not legal.`

console.log(`string text line 1
string text line 2`);

// 字符串中嵌入变量
var name = "Bob", time = "today";
`Hello ${name}, how are you ${time}?`
```

- 如果在模板字符串中需要使用反引号，则前面要用反斜杠转义。
- 如果使用模板字符串表示多行字符串，所有的空格和缩进都会被保留在输出之中。
- 模板字符串中嵌入变量，需要将变量名写在${}之中。大括号内部可以放入任意的JavaScript表达式，可以进行运算，以及引用对象属性。模板字符串之中还能调用函数。

## 标签模板

模板字符串的功能，不仅仅是上面这些。它可以紧跟在一个函数名后面，该函数将被调用来处理这个模板字符串。这被称为“标签模板”功能（tagged template）。
```
var a = 5;
var b = 10;

tag`Hello ${ a + b } world ${ a * b }`;

function tag(stringArr, ...values){
  // ...
}
```
----

# 正则扩展

## RegExp构造函数

ES6允许RegExp构造函数接受正则表达式作为参数，这时会返回一个原有正则表达式的拷贝。如果使用RegExp构造函数的第二个参数指定修饰符，则返回的正则表达式会忽略原有的正则表达式的修饰符，只使用新指定的修饰符。

```
new RegExp(/abc/ig, 'i').flags
// "i"
```
## u修饰符

ES6对正则表达式添加了u修饰符，含义为“Unicode模式”，用来正确处理大于\uFFFF的Unicode字符。也就是说，会正确处理四个字节的UTF-16编码。

## y修饰符

ES6还为正则表达式添加了y修饰符，叫做“粘连”（sticky）修饰符。y修饰符的作用与g修饰符类似，也是全局匹配，后一次匹配都从上一次匹配成功的下一个位置开始。不同之处在于，g修饰符只要剩余位置中存在匹配就可，而y修饰符确保匹配必须从剩余的第一个位置开始，这也就是“粘连”的涵义。

```
var s = "aaa_aa_a";
var r1 = /a+/g;
var r2 = /a+/y;

r1.exec(s) // ["aaa"]
r2.exec(s) // ["aaa"]

r1.exec(s) // ["aa"]
r2.exec(s) // null

var r3 = /a+_/y;
r3.exec(s) // ["aaa_"]
r3.exec(s) // ["aa_"]
```
与y修饰符相匹配，ES6的正则对象多了sticky属性，表示是否设置了y修饰符。

## flags属性

ES6为正则表达式新增了flags属性，会返回正则表达式的修饰符。

----

# 数值的扩展

## 二进制和八进制表示法

ES6提供了二进制和八进制数值的新的写法，分别用前缀0b（或0B）和0o（或0O）表示。如果要将0b和0x前缀的字符串数值转为十进制，要使用Number方法。

## Number.isFinite(), Number.isNaN() 检查Infinite与NaN

ES6在Number对象上，新提供了Number.isFinite()和Number.isNaN()两个方法，用来检查Infinite和NaN这两个特殊值。

## Number.parseInt(), Number.parseFloat()

ES6将全局方法parseInt()和parseFloat()，移植到Number对象上面，行为完全保持不变。

## Number.isInteger() 判断一个值是否为整数

Number.isInteger()用来判断一个值是否为整数。需要注意的是，在JavaScript内部，整数和浮点数是同样的储存方法，所以3和3.0被视为同一个值。

## Number.EPSILON 极小常量，用于判断误差

ES6在Number对象上面，新增一个极小的常量Number.EPSILON。引入一个这么小的量的目的，在于为浮点数计算，设置一个误差范围。我们知道浮点数计算是不精确的。但是如果这个误差能够小于Number.EPSILON，我们就可以认为得到了正确结果。因此，Number.EPSILON的实质是一个可以接受的误差范围。

## 安全整数和Number.isSafeInteger() 检查安全整数

JavaScript能够准确表示的整数范围在-2^53到2^53之间（不含两个端点），超过这个范围，无法精确表示这个值。ES6引入了Number.MAX_SAFE_INTEGER和Number.MIN_SAFE_INTEGER这两个常量，用来表示这个范围的上下限。Number.isSafeInteger()则是用来判断一个整数是否落在这个范围之内。

## Math对象的扩展，新增17个函数

- Math.trunc方法用于去除一个数的小数部分，返回整数部分。
- Math.sign方法用来判断一个数到底是正数、负数、还是零。
- Math.cbrt方法用于计算一个数的立方根。
- JavaScript的整数使用32位二进制形式表示，Math.clz32方法返回一个数的32位无符号整数形式有多少个前导0。
- Math.imul方法返回两个数以32位带符号整数形式相乘的结果，返回的也是一个32位的带符号整数。
- Math.fround方法返回一个数的单精度浮点数形式。
- Math.hypot方法返回所有参数的平方和的平方根。
- Math.expm1(x)返回ex - 1，即Math.exp(x) - 1。
- Math.log1p(x)方法返回1 + x的自然对数，即Math.log(1 + x)。如果x小于-1，返回NaN。
- Math.log10(x)返回以10为底的x的对数。如果x小于0，则返回NaN。
- Math.log2(x)返回以2为底的x的对数。如果x小于0，则返回NaN。
- Math.sinh(x) 返回x的双曲正弦（hyperbolic sine）。
- Math.cosh(x) 返回x的双曲余弦（hyperbolic cosine）。
- Math.tanh(x) 返回x的双曲正切（hyperbolic tangent）。
- Math.asinh(x) 返回x的反双曲正弦（inverse hyperbolic sine）。
- Math.acosh(x) 返回x的反双曲余弦（inverse hyperbolic cosine）。
- Math.atanh(x) 返回x的反双曲正切（inverse hyperbolic tangent）。

----

# 数组的扩展

## Array.from() 转换类数组对象至真正的数组

Array.from方法用于将两类对象转为真正的数组：类似数组的对象（array-like object）和可遍历（iterable）的对象（包括ES6新增的数据结构Set和Map）。实际应用中，常见的类似数组的对象是DOM操作返回的NodeList集合，以及函数内部的arguments对象。Array.from都可以将它们转为真正的数组。

- 值得提醒的是，扩展运算符（...）也可以将某些数据结构转为数组。
- 对于还没有部署该方法的浏览器，可以用Array.prototype.slice方法替代。
- Array.from()的另一个应用是，将字符串转为数组，然后返回字符串的长度。因为它能正确处理各种Unicode字符，可以避免JavaScript将大于\uFFFF的Unicode字符，算作两个字符的bug。

## Array.of() 将一组值转换为数组

```
Array.of(3, 11, 8) // [3,11,8]
```

这个方法的主要目的，是弥补数组构造函数Array()的不足。因为参数个数的不同，会导致Array()的行为有差异。Array.of基本上可以用来替代Array()或new Array()，并且不存在由于参数不同而导致的重载。它的行为非常统一。

## Array.prototype.copyWithin() 将数组指定位置成员复制到其他位置后返回数组

```
[1, 2, 3, 4, 5].copyWithin(0, 3)
// [4, 5, 3, 4, 5]
```

它接受三个参数。

- target（必需）：从该位置开始替换数据。
- start（可选）：从该位置开始读取数据，默认为0。如果为负值，表示倒数。
- end（可选）：到该位置前停止读取数据，默认等于数组长度。如果为负值，表示倒数。

## Array.prototype.find() 找出第一个符合条件的数组成员

数组实例的find方法，用于找出第一个符合条件的数组成员。它的参数是一个回调函数，所有数组成员依次执行该回调函数，直到找出第一个返回值为true的成员，然后返回该成员。如果没有符合条件的成员，则返回undefined。

```
[1, 4, -5, 10].find((n) => n < 0)
// -5
```

## Array.prototype.findIndex() 返回第一个符合条件的数组成员的位置

用法与find方法非常类似。

## Array.prototype.fill() 用指定值填充数组

fill方法使用给定值，填充一个数组。

```
['a', 'b', 'c'].fill(7)
// [7, 7, 7]
```

## Array.prototype.entries()/keys()/values() 用于遍历数组并返回一个遍历器对象

ES6提供三个新的方法——entries()，keys()和values()——用于遍历数组。它们都返回一个遍历器对象（详见《Iterator》一章），可以用for...of循环进行遍历，唯一的区别是keys()是对键名的遍历、values()是对键值的遍历，entries()是对键值对的遍历。

```
for (let index of ['a', 'b'].keys()) {
  console.log(index);
}
// 0
// 1

for (let elem of ['a', 'b'].values()) {
  console.log(elem);
}
// 'a'
// 'b'

for (let [index, elem] of ['a', 'b'].entries()) {
  console.log(index, elem);
}
// 0 "a"
// 1 "b"
```

## Array.prototype.includes() 检查数组是否包含给定的值 （ES7）
```
[1, 2, 3].includes(2);     // true
```

## 数组的空位

数组的空位指，数组的某一个位置没有任何值。比如，Array构造函数返回的数组都是空位。`Array(3) // [, , ,]`

ES5对空位的处理，已经很不一致了，大多数情况下会忽略空位。

- forEach(), filter(), every() 和some()都会跳过空位。
- map()会跳过空位，但会保留这个值
- join()和toString()会将空位视为undefined，而undefined和null会被处理成空字符串。

ES6则是明确将空位转为undefined。

- Array.from方法会将数组的空位，转为undefined，也就是说，这个方法不会忽略空位。
- 扩展运算符（...）也会将空位转为undefined。
- copyWithin()会连空位一起拷贝。
- fill()会将空位视为正常的数组位置。
- for...of循环也会遍历空位。
- entries()、keys()、values()、find()和findIndex()会将空位处理成undefined。

由于空位的处理规则非常不统一，所以建议避免出现空位。

## 数组推导 （ES7）

数组推导（array comprehension）提供简洁写法，允许直接通过现有数组生成新数组。

```
var a1 = [1, 2, 3, 4];
var a2 = [for (i of a1) i * 2];

a2 // [2, 4, 6, 8]
```

----

# 函数的扩展

## 函数参数的默认值

ES6允许为函数的参数设置默认值，即直接写在参数定义的后面。

```
function log(x, y = 'World') {
  console.log(x, y);
}
```

默认声明的参数变量在函数体中不能用let或const再次声明，否则会报错。

参数默认值可以与解构赋值的默认值，结合起来使用。

```
function foo({x, y = 5}) {
  console.log(x, y);
}
```

如果传入undefined，将触发该参数等于默认值，null则没有这个效果。

## 函数的length属性

指定了默认值以后，函数的length属性，将返回没有指定默认值的参数个数。也就是说，指定了默认值后，length属性将失真。

```
(function(a){}).length // 1
(function(a = 5){}).length // 0
(function(a, b, c = 5){}).length // 2
```

一个需要注意的地方是，如果参数默认值是一个变量，则该变量所处的作用域，与其他变量的作用域规则是一样的，即先是当前函数的作用域，然后才是全局作用域。

```
let x = 1;

function f(y = x) {
  let x = 2;
  console.log(y);
}

f() // 1
```

## rest参数

ES6引入rest参数（形式为“...变量名”），用于获取函数的多余参数，这样就不需要使用arguments对象了。rest参数搭配的变量是一个数组，该变量将多余的参数放入数组中。

```
function add(...values) {
  let sum = 0;

  for (var val of values) {
    sum += val;
  }

  return sum;
}

add(2, 5, 3) // 10
```

## 扩展运算符

扩展运算符（spread）是三个点（...）。它好比rest参数的逆运算，将一个数组转为用逗号分隔的参数序列。

```
console.log(...[1, 2, 3])
// 1 2 3

console.log(1, ...[2, 3, 4], 5)
// 1 2 3 4 5
```

可替代数组的apply方法。

应用：

- 合并数组 `[1, 2, ...more]`
- 与解构赋值结合 `[a, ...rest] = list`
- 与函数返回值结合
- 将字符串转为真正的数组，能够正确识别32位的Unicode字符。
- 任何Iterator接口的对象，都可以用扩展运算符转为真正的数组。

## name属性 返回该函数的函数名

函数的name属性，返回该函数的函数名。

```
function foo() {}
foo.name // "foo"
```

- Function构造函数返回的函数实例，name属性的值为“anonymous”。
- bind返回的函数，name属性值会加上“bound ”前缀。

## 箭头函数

ES6允许使用“箭头”（=>）定义函数。

```
var f = v => v;
var f = function(v) {
  return v;
};
```

- 如果箭头函数不需要参数或需要多个参数，就使用一个圆括号代表参数部分。
- 如果箭头函数的代码块部分多于一条语句，就要使用大括号将它们括起来，并且使用return语句返回。
- 由于大括号被解释为代码块，所以如果箭头函数直接返回一个对象，必须在对象外面加上圆括号。
- 箭头函数可以与变量解构结合使用。
- 箭头函数可以与rest参数结合使用。

箭头函数有几个使用注意点:

- 函数体内的this对象，就是定义时所在的对象，而不是使用时所在的对象。
- 不可以当作构造函数，也就是说，不可以使用new命令，否则会抛出一个错误。
- 不可以使用arguments对象，该对象在函数体内不存在。如果要用，可以用Rest参数代替。
- 不可以使用yield命令，因此箭头函数不能用作Generator函数。

## 函数绑定 (ES7)

箭头函数可以绑定this对象，大大减少了显式绑定this对象的写法（call、apply、bind）。但是，箭头函数并不适用于所有场合，所以ES7提出了“函数绑定”（function bind）运算符，用来取代call、apply、bind调用。虽然该语法还是ES7的一个提案，但是Babel转码器已经支持。

函数绑定运算符是并排的两个双冒号（::），双冒号左边是一个对象，右边是一个函数。该运算符会自动将左边的对象，作为上下文环境（即this对象），绑定到右边的函数上面。

```
foo::bar;
// 等同于
bar.bind(foo);

foo::bar(...arguments);
// 等同于
bar.apply(foo, arguments);
```

# 对象扩展

## 属性的简洁表示法

ES6允许直接写入变量和函数，作为对象的属性和方法。这样的书写更加简洁。

```
var birth = '2000/01/01';

var Person = {
  name: '张三',
  //等同于birth: birth
  birth,
  // 等同于hello: function ()...
  hello() { console.log('我的名字是', this.name); }
};
```

## 属性名表达式

ES6允许字面量定义对象时，用方法二（表达式）作为对象的属性名，即把表达式放在方括号内。

```
let propKey = 'foo';

let obj = {
  [propKey]: true,
  ['a' + 'bc']: 123
};
```
注意，属性名表达式与简洁表示法，不能同时使用，会报错。

## 方法的name属性 返回方法名

函数的name属性，返回函数名。对象方法也是函数，因此也有name属性。

## Object.is() 比较两个值是否严格相等

ES6提出“Same-value equality”（同值相等）算法，用来解决这个问题。Object.is就是部署这个算法的新方法。它用来比较两个值是否严格相等，与严格比较运算符（===）的行为基本一致。

不同之处只有两个：一是+0不等于-0，二是NaN等于自身。

```
+0 === -0 //true
NaN === NaN // false

Object.is(+0, -0) // false
Object.is(NaN, NaN) // true
```

## Object.assign() 将源对象的所有可枚举属性，复制到目标对象上

Object.assign方法用来将源对象（source）的所有可枚举属性，复制到目标对象（target）。它至少需要两个对象作为参数，第一个参数是目标对象，后面的参数都是源对象。只要有一个参数不是对象，就会抛出TypeError错误。

```
var target = { a: 1 };
var source1 = { b: 2 };
var source2 = { c: 3 };

Object.assign(target, source1, source2);
target // {a:1, b:2, c:3}
```
用途：

- 为对象添加属性
- 为对象添加方法
- 克隆对象
- 合并多个对象
- 为属性指定默认值

## 属性的可枚举性

对象的每个属性都有一个描述对象（Descriptor），用来控制该属性的行为。Object.getOwnPropertyDescriptor方法可以获取该属性的描述对象。

ES5有三个操作会忽略enumerable为false的属性。

- for...in 循环：只遍历对象自身的和继承的可枚举的属性
- Object.keys()：返回对象自身的所有可枚举的属性的键名
- JSON.stringify()：只串行化对象自身的可枚举的属性

ES6新增了两个操作，会忽略enumerable为false的属性。

- Object.assign()：只拷贝对象自身的可枚举的属性
- Reflect.enumerate()：返回所有for...in循环会遍历的属性

## 属性的遍历

ES6一共有6种方法可以遍历对象的属性。

1. `for...in` for...in循环遍历对象自身的和继承的可枚举属性（不含Symbol属性）。
2. `Object.keys(obj)`Object.keys返回一个数组，包括对象自身的（不含继承的）所有可枚举属性（不含Symbol属性）。
3. `Object.getOwnPropertyNames(obj)`Object.getOwnPropertyNames返回一个数组，包含对象自身的所有属性（不含Symbol属性，但是包括不可枚举属性）。
4.`Object.getOwnPropertySymbols(obj)`Object.getOwnPropertySymbols返回一个数组，包含对象自身的所有Symbol属性。
5.`Reflect.ownKeys(obj)`Reflect.ownKeys返回一个数组，包含对象自身的所有属性，不管是属性名是Symbol或字符串，也不管是否可枚举。
6.`Reflect.enumerate(obj)`Reflect.enumerate返回一个Iterator对象，遍历对象自身的和继承的所有可枚举属性（不含Symbol属性），与for...in循环相同。

## __proto__属性，Object.setPrototypeOf()，Object.getPrototypeOf()

__proto__属性（前后各两个下划线），用来读取或设置当前对象的prototype对象。目前，所有浏览器（包括IE11）都部署了这个属性。该属性没有写入ES6的正文，而是写入了附录，原因是__proto__前后的双下划线，说明它本质上是一个内部属性，而不是一个正式的对外的API，只是由于浏览器广泛支持，才被加入了ES6。标准明确规定，只有浏览器必须部署这个属性，其他运行环境不一定需要部署，而且新的代码最好认为这个属性是不存在的。因此，无论从语义的角度，还是从兼容性的角度，都不要使用这个属性，而是使用下面的Object.setPrototypeOf()（写操作）、Object.getPrototypeOf()（读操作）、Object.create()（生成操作）代替。

Object.setPrototypeOf方法的作用与__proto__相同，用来设置一个对象的prototype对象。它是ES6正式推荐的设置原型对象的方法。

Object.getPrototypeOf方法与setPrototypeOf方法配套，用于读取一个对象的prototype对象。

# 新的原始数据类型Symbol

## 概述

ES6引入了一种新的原始数据类型Symbol，表示独一无二的值。它是JavaScript语言的第七种数据类型，前六种是：Undefined、Null、布尔值（Boolean）、字符串（String）、数值（Number）、对象（Object）。

Symbol值通过Symbol函数生成。这就是说，对象的属性名现在可以有两种类型，一种是原来就有的字符串，另一种就是新增的Symbol类型。凡是属性名属于Symbol类型，就都是独一无二的，可以保证不会与其他属性名产生冲突。

