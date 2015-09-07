title: JS自我梳理：闭包、私有变量
categories:
  - Code
tags:
  - Javascript
date: 2015-03-21 15:07:00
---

继续整理。

闭包，指有权访问另一个函数作用域内变量的函数。创建闭包的常见方式就是在一个函数内部创建另一个函数。

<!-- more -->

```
function a(A){
    return function(B){
        return A+B;
    };
}
 
var be = a(5);
console.log(be(10));//15
```

例子中匿名函数访问了外部函数中的变量A。即使这个匿名函数被返回了，或者在其他地方被调用了，它依然可以访问变量A，因为匿名函数的作用域链中包含a()的作用域。

当某个函数被调用时，会创建一个执行环境及相应的作用域链。然后，使用arguments和其它命名参数的值来初始化函数的活动对象。但在作用域链中，外部函数的活动对象始终处于第二位，外部函数的外部函数的活动对象处于第三位，直至作为作用域链终点的全局执行环境。

后台的每个执行环境都有一个表示变量的对象——变量对象。全局的变量对象始终存在，而像a()函数这样的局部环境的变量对象只在函数执行的过程中存在。一般来讲当函数执行完毕时，局部活动变量就会被销毁，内存中仅保存全局作用域。但是闭包的情况又有所不同。如刚才的例子，a()函数在执行完毕之后，其活动变量也不会呗销毁，因为匿名函数的作用域链依然在引用着这个活动对象。实际上，当a()函数在执行完毕后，其作用域链会被销毁，但它的活动对象仍然会留在内存中。直到匿名函数被销毁后，a()的活动对象才会被销毁。

```
var be = null;
```
解除对匿名函数的引用。

因为闭包保存的是整个变量对象而不是某个特殊的变量，所以闭包只能取得包含函数中任何变量的最后一个值。

```
function a(){
	var result = [];
	for(var i=0;i<10;i++){
        result[i] = function(){
           return i;
        }
    }
}
```

这个函数会返回一个函数数组。表面上看应该每个函数都应该返回自己的索引值，然而10个函数返回的均为10。这就因为每个函数的作用域链保存的不是i这个变量的值，而是a()函数的活动对象。每个函数都引用着保存变量i最后一个值的变量对象，所以每个函数内部i都是10。这种情况下，我们可以创建另一个匿名函数强制让闭包的行为符合预期：

```
function a(){
	var result = [];
	for(var i=0;i<10;i++){
        result[i] = function(num){
            return function(){
                return num;
            };
        }(i);
    }
}
```

这样定义了一个匿名函数，并将立即执行该匿名函数的结果赋值给数组。由于函数参数是按值传递的，所以会将变量i的当前值赋值给num。而在这个匿名函数的内部又创建并返回了一个访问num的闭包。这样一来，result数组的每个函数都有自己num变量的一个副本，因此就可以返回各自不同的数值了。

##### 闭包与this

在全局函数中，this指向window；而当函数被作为某个对象的方法调用时，this指向那个对象。匿名函数的执行环境具有全局性，因此其this对象通常指向window。

```
var a = {
    Name: 'hello',
    getName: function(){
        console.log(this.Name);
    }
};
a.getName();//'hello'
```
getName作为a对象的方法调用，this指向a，输出'hello'。如果getName内加入闭包函数会怎样呢？
```
var a = {
    Name: 'hello',
    getName: function(){
        return function(){
            console.log(this.Name);
        };
    }
};
a.getName()();//undefined
```
因为匿名函数的this指向了window，所以输出undefined。那如果闭包想要访问Name属性要怎么做呢？
```
var a = {
    Name: 'hello',
    getName: function(){
        var that = this;
        return function(){
            console.log(that.Name);
        };
    }
};
a.getName()();//'hello'
```
定义匿名函数之前，我们把this变量赋值给that，闭包也可以访问that，以此为桥梁进行访问。

##### 关于块级作用域

js没有块级作用域，只有函数作用域。在块语句中定义的变量，实际上是在包含函数中创建的。
```
function a(){
    for(var i = 0;i < 5; i++){
        ....
    }
    alert(i);//5
}
```
如果在c、java等其他语言中,i只在for循环中有定义，循环结束后i就会销毁。而js没有块级作用域只有函数作用域，所以i在a()函数内都可以访问到。

如果需要块级作用域的话， 那么可以通过立即执行的匿名函数来实现。
```
(function(){
    ....块级作用域
})();
```


```
function a(){
    (function(){
        for(var i = 0;i < 5; i++){
            ....
        }
    })();
    alert(i);//ReferenceError: i is not defined
}
```
无论是在什么地方，只要临时需要一些变量，都可以使用私用作用域。

这种技术经常在全局作用域中被用在函数外部，从而限制向全局作用域中添加过多的变量和函数。

##### 实现私有变量

任何在函数内部定义的变量，都可以认为是私有变量，因为不能在函数外部访问这些变量。我们把有权访问私有变量和私有函数的公有方法叫做特权方法。

###### 在构造函数中实现私有变量：

使用构造函数主要是为了自定义类型创建私有变量和私有方法。

```
function MyObject(name){
 
    //定义私有变量和私有函数
    var privateVariable = "10";
	function privateFunction(){
        return false;
    }

    //特权方法
    this.getName = function(){
    	return name;
    }
    this.setName = function(newName){
        name = newName;
    }
    this.publicMethod = function(){
        privateVariable++;
        return pricateFunction();
    }
}
```

不使用特权方法的话，没有其他办法可以访问name、privateVariable、privateFunction。将私有变量和函数写在构造函数内部的问题是，每创建一个示例都会创建同样一组新方法。使用静态私有变量可以避免这个问题。

```
(function(){
    //定义私有变量和私有函数
    var privateVariable = "10";
	function privateFunction(){
        return false;
    }

    //定义构造函数
    MyObject = function(){};
    
    //特权方法
    MyObject.prototype.publicMethod = function(){
        privateVariable++;
        return pricateFunction();
    }
})();
```
使用原型，所有实例引用相同的私有变量和私有函数。

###### 模块模式

模块模式是为单例创建私有变量和私有方法。单例指的就是只有一个实例的对象。

普通方式创建单例对象：

```
var single = {
    pro : "str..",//属性
    method: function(){
    //方法
    }
}
```

使用模块方式创建单例对象：
```
var single = function(){
    
    //定义私有变量和私有方法
    var privateVariable = "10";
    function privateFunction(){
        return false;
    }
    
    //特权方法和公有属性/特权
    return {
        publicVariable: true,
        publicMethod: function(){
            privateVariable++;
            return pricateFunction();
        }
    }
}
```
在匿名函数的内部定义私有变量和私有方法，在返回的对象字面量中定义公有属性/方法和特权方法。由于这个对象是在匿名函数内定义的，所以其公有方法可以访问私有变量和私有方法。


还有一种叫“增强的模块方式”，理解起来很简单：如果要求返回的对象属于某种类型，比如Person类型，就这样写：
```
var single = function(){
    
    //定义私有变量和私有方法
    var privateVariable = "10";
    function privateFunction(){
        return false;
    }
    
    
    var obj = new Person();
    
    //增强
    //特权方法和公有属性/特权
    Person.publicVariable = true;
    Person.publicMethod: function(){
        privateVariable++;
        return pricateFunction();
    }
    return obj;
}
```

接下来打算整理下坑坑哒变量提示和函数声明提升:)
