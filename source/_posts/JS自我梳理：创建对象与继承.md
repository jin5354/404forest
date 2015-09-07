title: JS自我梳理：创建对象与继承
categories:
  - Code
tags:
  - Javascript
date: 2015-04-06 16:00:00
---
#### 对象的创建模式：

在批量创建对象时，使用普通的Object构造函数和对象字面量会造成大量重复代码。为了解决这个问题，出现了一些创建模式。

1.工厂模式

<!-- more -->

```
function createPerson(name, age, job){
    var o = new Object();
    o.name = name;
    o.age = age;
    o.job = job;
    o.sayName = function(){
        alert(this.name);
    } 
    
    return o;
}
     
var person1 = createPerson('john', 27, 'engineer');
```

在工厂模式中，createPerson函数封装了创建一个具有特定属性和方法的对象的操作，并返回该对象。多次调用该函数便可批量生成相似对象。
这种模式的缺点是不能解决对象识别的问题。

2.寄生构造函数模式

我将寄生构造函数模式放到工厂模式之后写，是因为除了寄生构造函数模式在调用构造函数时使用了new，其他都是完全一样的。

```
function createPerson(name, age, job){
    var o = new Object();
    o.name = name;
    o.age = age;
    o.job = job;
    o.sayName = function(){
        alert(this.name);
    }
    
    return o;
}
 
var person1 = new createPerson('john', 27, 'engineer');
```

最终返回的对象其实是完全一样的。只是用了new感觉更像构造函数的写法。

工厂模式与寄生构造函数模式返回的对象与构造函数或者构造函数的原型都没有关系，不能通过constructor或instanceof来判断对象类型。使用这种方法可以创建拓展功能的数组等等。


3.构造函数模式

```
function Person(name,age,job){
    this.name = name;
    this.age = age;
    this.job = job;
    this.sayName = function(){
        alert(this.name);
    }
}
 
var person1 = new Person('john', 27, 'engineer');
```

 构造函数模式则解决了对象识别的问题。创建的person1对象是Person的一个实例。默认情况下person1有一个constructor属性（来自于prototype），其值指向Person。
 
```
alert(person1.constructor === Person); //true
```

但是由于prototype可重写，所以用constructor来进行对象识别是不稳定的；更妥当的方法是使用instanceof 操作符。instanceof可以检测实例。

```
alert(person1 instanceof Person); //true
alert(person1 instanceof Object); //true
```

使用构造函数模式可以将它的实例标记为特定的类型。但是依然有可以改进的地方：每一个实例都拥有一个独自的sayName方法。不同实例上的同名函数是不相等的，这在很多情况下是没有必要的。
这个问题可以使用原型模式来解决。

4.原型模式

```
function Person(){}
Person.prototype.name = 'john';
Person.prototype.age = 27;
Person.prototype.job = 'engineer';
Person.prototype.sayName = function(){
    alert(this.name);
}
var person1 = new Person();
```

使用原型模式可以让所有实例共享属性与方法。
当然，更简单是使用对象字面量方法。

```
Person.prototype = {
    name: 'john',
    age:27,
    job: 'engineer’,
    sayName: function(){
        alert(this.name);
    }
}
```

但是要注意的是，使用对象字面量方法会完全重写prototype，这样将去掉默认的constructor属性（并且默认是不可枚举的）。如果认为constructor属性非常重要，那么需要自己手动补上这个属性。

一般情况下不会是所有属性和方法都是共享的——构造函数所生成的实例，应该部分属性和方法是共享的，其它属性和方法是非共享的。共享部分放在原型中，非共享部分写在构造函数中，即为组合使用构造函数模式与原型模式。

5.组合模式

```
function Person(name, age, job){
    this.name = name;
    this.age = age;
    this.job = job;
}
Person.prototype.sayName = function(){
    alert(this.name);
}
```

使用最广泛、认同度最高的创建自定义类型的方式~

6.动态原型模式

动态原型模式继承了组合模式的优点。它将所有信息都封装在了构造函数之内，在构造函数之内初始化原型。

```
function Person(name, age, job){
    this.name = name;
    this.age = age;
    this.job = job;
    if(typeof this.sayName!=='function’){
        Person.prototype.sayName = function(){
            alert(this.name);
        };
    }
}
```

7.稳妥构造函数模式

稳妥对象指的是没有公共属性，方法也不引用this的对象。

```
function Person(name, age, job){
    var o = new Object();
    o.sayName = function(){
        alert(name);
    }
    
    return o;
}
 
var person1 = Person('john', 27, 'engineer');
console.log(person1.name);//undefined
console.log(person1.sayName());//'john'
```

除了调用sayName()方法，没有别的方式可以再访问其数据成员。
这种实现私有变量的方式涉及到闭包，打算之后在闭包相关内容再仔细写写:)


#### 继承

ECMAscript只支持实现继承，并且其实现继承主要是依靠原型链来实现的。

以下的示例都设定为：超类型SuperType与子类型SubType。
SuperType类型具有属性name、colors，方法sayName。
SubType类型具有属性name、colors、age，方法sayName，sayAge。


1.原型链继承。

```
//声明超类型，通过构造函数添加属性。
function SuperType(name){
    this.name = name;
    this.colors = ["red”, "blue”, "green”];
}
//通过原型添加方法。
SuperType.prototype.sayName = function(){
    alert(this.name);
}
//声明子类型，通过构造函数添加属性。
function SubType(age){
    this.age = age;
}
//将子类型的原型指向超类型的实例。
SubType.prototype = new SuperType();
//通过原型添加子类型的方法。
SubType.prototype.sayAge = function(){
    alert(this.name);
}
 
var instance = new SubType();
```

画图如下：

![javascript 原型链继承](http://my404forest.qiniudn.com/javascript 原型链继承.png)

PS: processon的在线作图工具还不错哈，我懒得下载本地作图软件，直接在这个网站上画的。

可以看出，通过将子类型的原型指向超类型的实例，子类型获得了超类型的属性和方法。（总感觉自己表述的并不清楚，还是看图说话吧。）

原型链继承的几点说明：

* 使用 instanceof 和 isPrototypeOf 可以确定原型和实例的关系
```
instance instanceof SubType;//true
instance instanceof SuperType;//true
instance instanceof Object;//true
SuperType.prototype.isPrototypeOf(instance);//true
```

* 子类型重写超类型中的方法或者添加新方法时，代码一定要写在替换原型的语句后面。而且不能用对象字面量写法，否则会重写原型链。

* 原型链的问题有二：1.子类型的原型重写为超类型的实例后，超类型的示例属性自然就成为子类型的原型属性了。如果属性的值为引用类型的话（比如colors属性）就会出现问题——由于是原型属性是共享一个colors属性，那么一处修改，在所有子类型示例中都会生效。2.创建子类型的实例时，不能向超类型的构造函数中传递参数。

实践中很少单独使用原型链。

2.借用构造函数

```
function SuperType(name){
    this.name = name;
    this.colors = ["red”, "blue”, "green”];
}
 
function SubType(name){
    SuperType.call(this, name);
}
```

借用构造函数也很少有单独使用的情况，主要是提供一种思路：在子类型构造函数中通过call()或apply()调用超类型构造函数。这种方法就可以在子类型构造函数中向超类型构造函数传递参数。缺点是：函数复用困难，超类型原型中定义的方法对子类型不可见。

3.组合继承

在原型链继承模式中加入借用构造函数模式，多加一行代码即可。

```
//声明超类型，通过构造函数添加属性。
function SuperType(name){
    this.name = name;
    this.colors = ["red”, "blue”, "green”];
}
//通过原型添加方法。
SuperType.prototype.sayName = function(){
    alert(this.name);
}
//声明子类型，通过构造函数添加属性。
function SubType(name,age){
    //**加入下面这行代码：继承属性**
    SuperType.call(this,name)
    this.age = age;
}
//将子类型的原型指向超类型的实例。
SubType.prototype = new SuperType();
//通过原型添加子类型的方法。
SubType.prototype.sayAge = function(){
    alert(this.name);
}
 
var instance1 = new SubType();
var instance2 = new SubType();
```

上图：

![javascript 组合继承](http://my404forest.qiniudn.com/javascript 组合继承.png)

这样的话在创建不同子类型SubType实例时就会分别拥有自己的属性，又可以使用相同的方法了。

不过这样也有一个问题：既然每个子类型示例上都有独立的name和colors等属性，也就是覆盖了子类型原型上的同名属性。那么子类型原型上的name和colors属性就没有用处了，应该去除。下面介绍的寄生组合继承会涉及到这个问题~

4.原型式继承

原型式继承主要提供的也是一种思路：当并不需要构造函数，而是想要凭借已有的对象创建相似对象时，可以：

```
function object(o){
	function F(){}
    F.prototype = o;
    return new F();
}
```
上图：

![javascript 原型式继承](http://my404forest.qiniudn.com/javascript 原型式继承.png)

实际上，object()函数对传入的对象进行了一次浅复制。返回的对象以传入对象o为原型，获得o的属性和方法。和原型链继承一样，包含引用类型值的属性始终会被共享。

ECMAScript5新增的Object.create()方法规范了原型式继承。这个方法接收两个参数，一个用作新对象原型的对象和（可选的）一个为新对象定义额外属性的对象。在传入一个参数的情况下，Object.create()与object()方法的行为相同。

```
var anotherO = Object.create(o);
```

5.寄生式继承

寄生式继承是原型式继承的强化版。首先使用原型式继承进行浅复制创建新对象，随后对新对象进行强化，然后封装整个过程。

```
function createO(o){
    var temp = object(o);
    temp.sayHi = function(){
        alert('hi!');
    }
    return temp;
}
 
var anotherO = createO(o);
```

不能做到函数复用。

6.寄生组合式继承。

终于说到这个看起来最厉害的。上面提到过，组合继承方式中子类型原型上的超类型实例属性是没有用的。使用寄生组合式继承则可以解决这个问题。寄生组合式继承通过借用构造函数来继承属性。通过原型链的混成形式继承方法。不再像组合继承一样，将子类型原型重写为超类型实例。而是使用寄生式继承，将子类型原型重写为超类型原型的一个副本。

```
function inheritPrototype(SubType, SuperType){
    var temp = SuperType.prototype;//创建浅复制副本
    temp.prototype.constructor = SubType;//增强属性和方法
    SubType.prototype = temp;//将子类型原型指向该增强后的副本
}
 
function SuperType(name){
    this.name = name;
    this.colors = ["red”, "blue”, "green”];
}
SuperType.prototype.sayName = function(){
    alert(this.name);
}
function SubType(name,age){
    SuperType.call(this,name)
    this.age = age;
}
 
inheritPrototype(SubType, SuperType);
SubType.prototype.sayAge = function(){
    alert(this.name);
}
```
上图：

![javascript 寄生组合式继承](http://my404forest.qiniudn.com/javascript 寄生组合式继承.png)

子类型原型不再有多余的超类型实例属性，而且可以自己进行增强。最理想的继承方式~~

**番外：**

在调用构造函数时，如果忘记加new操作符，this会映射到全局变量上，导致全局变量属性的意外增加。为了避免这个问题，可以把构造函数稍加改造，成为作用域安全的构造函数。

```
function Person(name, age, job){
    if(this instanceof Person){
        this.name = name;
        this.age = age;
        this.job = job;
    }else{
        return new Person(name, age, job);
    }
}
```

作用域安全的构造函数在创建新的实例之前，首先确认this对象是正确类型的实例。如果漏加了new操作符，那么会创建新的实例并返回。

**问题：**作用域安全的构造函数不能应用与借用构造函数的继承方法。借用构造函数时，使用call()方法改变了this的指向，无法通过验证，也就不会在this上添加新的属性。解决这个问题的方法就是要同时应用原型链继承或寄生组合时继承，这样子类型的实例同时是子类型构造函数和超类型构造函数的实例，可以通过验证。

```
function Person(name, age, job){
    if(this instanceof Person){
        this.name = name;
        this.age = age;
        this.job = job;
    }else{
        return new Person(name, age, job);
    }
}

function Men(name, age ,job){
    Person.call(this, name, age, job);//instanceof验证失败
}
```
```
function Person(name, age, job){
    if(this instanceof Person){
        this.name = name;
        this.age = age;
        this.job = job;
    }else{
        return new Person(name, age, job);
    }
}

function Men(name, age ,job){
    Person.call(this, name, age, job);
}

Men.prototype = new Person();//现在Men的实例同时也是Person的实例，instanceof验证通过
```