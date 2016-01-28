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

## 

