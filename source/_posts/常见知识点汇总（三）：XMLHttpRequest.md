title: 常见知识点汇总（三）：XMLHttpRequest
date: 2014-12-18 22:02:41
categories:
  - Code
tags:
  - Javascript
  - Front-end-Developer-Interview-Questions
  - 常见知识点汇总
---
XMLHttpRequest（以下简称XMR）是一组API函数集，可被JavaScript、JScript、VBScript以及其它web浏览器内嵌的脚本语言调用，通过HTTP在浏览器和web服务器之间收发XML或其它数据。

#####创建XHR对象

1. IE7之前版本
IE5是第一款引入XHR对象的浏览器。在IE5中，XHR对象是通过MSXML库中的一个ActiveX对象实现的。因此，在IE中可能遇到三种不同版本的XHR对象，即MSXML2.XMLHttp、MSXML2.XMLHttp.3.0、MSXML2.XMLHttp.6.0。要使用MSXML库中的XHR对象，需要编写一个函数，例如：

``` javascript
function createXMLHTTP(){
    if (typeof arguments.callee.activeXString != "string"){
    	 var versions = [ "MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.3.0","MSXML2.XMLHttp"];
        for (var i=0,len=versions.length; i < len; i++){
            try {
                var xhr = new ActiveXObject(versions[i]);
                arguments.callee.activeXString = versions[i];
                return xhr;
            } catch (ex){
                //skip
            }
        }
    }
    return new ActiveXObject(arguments.callee.activeXString);
}
```
这个函数会尽力根据IE中可用的MSXM库的情况创建最新版本的XHR对象。

<!-- more -->
***

2. IE7+及其他浏览器

这些浏览器都支持原生的XHR对象。在这些浏览器中创建XHR对象要像下面这样使用XMLHttpRequest构造函数：
``` javascript
var xhr = new XMLHttpRequest();
```

若想兼容所有浏览器：
``` javascript
//一个兼容所有浏览器的创建XHR对象的方法：
function createXHR(){
    if (typeof XMLHttpRequest != "undefined"){
        return new XMLHttpRequest();
    } else if (typeof ActiveXObject != "undefined"){
        if (typeof arguments.callee.activeXString != "string"){
            var versions = ["MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.3.0",
                            "MSXML2.XMLHttp"];

            for (var i=0,len=versions.length; i < len; i++){
                try {
                    var xhr = new ActiveXObject(versions[i]);
                    arguments.callee.activeXString = versions[i];
                    return xhr;
                } catch (ex){
                    //skip
                }
            }
        }

        return new ActiveXObject(arguments.callee.activeXString);
    } else {
        throw new Error("No XHR object available.");
    }
}
```

#####XHR用法

1.open()

使用XHR对象时，要调用的第一个方法是open()，它接收3个参数：要发送的请求的类型（”get“、”post“等）、请求的URL和表示是否异步发送请求的布尔值。例：
``` javascript
xhr.open("get","example.php",false);
```
这行代码会启动一个针对example.php的GET请求。URL相对于执行代码的当前页面（当然也可以使用绝对路径），调用open()方法并不会真正发送请求，而只是启动一个请求以备发送。

2.send()

要发送特定的请求，必须像下面这样调用send()方法：
``` javascript
xhr.open("get","example.php",false);
xhr.send(null);
```
这里的send()方法接收一个参数，即要作为请求主体发送的数据。如果不需要通过请求主体发送数据，则必须传入null，因为这个参数对于某些浏览器是必须的。调用send()之后，请求就会被分派到服务器。
收到响应之后，响应的数据会自动填充XHR对象的属性，相关的属性简介如下：

* responseText 作为响应主体被返回的文本
* responseXML 若响应的内容
* status 响应的HTTP状态
* statusText HTTP状态的说明

在接收到响应后，第一步是检查status属性，以确保响应成功返回。建议使用检测status来决定下一步的操作，不要依赖statusText，因为后者在跨浏览器使用时不太可靠。
多数情况下，我们要发送异步请求。此时可以检测XHR对象的readyState属性，该属性表示请求/响应过程的当前活动阶段。这个属性可取值如下：

* 0 未初始化：尚未调用open()方法。
* 1 启动：已经调用open()方法，但尚未调用send()方法。
* 2 发送：已经调用send()方法，但尚未接收到响应。
* 3 接收：已经接收到部分响应数据。
* 4 完成：已经接收到全部响应数据，而且已经可以在客户端使用了。

每当readyState值发生变化，就会触发一次readystatechange事件，可以利用这个事件来检测每次状态变化后readyState的值，通常我们只用检测readyState值为4的阶段。必须在调用open()之前指定onreadystatechange事件处理程序才能保证跨浏览器兼容性。
例：
``` javascript
var xhr = createXHR();
xhr.onreadystatechange = function(){
	if(xhr.readyState == 4){
    	if((xhr.status >=200 && xhr.status < 300) || xhr.status == 304){
        	alert(xhr.responseText);
        }else{
        	alert("Request was unsucessful:" + xhr.status);
        }	
    }
};
xhr.open("get","example.txt",true);
xhr.send(null);
```

3.HTTP头部信息

默认情况下，在发送XHR请求的同时，还会发送下列头部信息：

* Accept: 浏览器能够处理的内容类型
* Accept-Charset: 浏览器能够显示的字符集
* Accept-Encoding: 浏览器能够处理的压缩编码
* Accept-Language: 浏览器当前设置的语言
* Cookie: 当前页面设置的任何Cookie
* Host：发出请求的页面所在的域
* Referer：发出请求的页面的URL
* User-Agent: 浏览器的用户代理字符串

每个HTTP请求和响应都会带有响应的头部信息，XHR对象提供了操作这两种头部信息的方法。

* setRequestHeader()

使用setRequestHeader()方法可以设置自定义的请求头部信息。要成功发送请求头部信息，必须在调用open()方法之后且调用send()方法之前调用setRequestHeader()。

``` javascript
var xhr = createXHR();      
xhr.open("get", "example.php", true);
xhr.setRequestHeader("MyHeader", "MyValue");
xhr.send(null);
```

* getResponseHeader(), getAllResponseHeaders()

调用XHR对象的getResponseHeader()方法并传入头部字段名称，可以取得响应的响应头部信息。
调用getAllResponseHeaders()方法则可以取得一个包含所有头部信息的长字符串。

``` javascript
var xhr3 = createXHR();      
xhr3.onreadystatechange = function(event){
    if (xhr3.readyState == 4){
        if ((xhr3.status >= 200 && xhr3.status < 300) || xhr3.status == 304){
            alert(xhr3.getAllResponseHeaders());//获取全部头部信息的字符串
        } else {
            alert("Request was unsuccessful: " + xhr3.status);
        }
    }
};
xhr3.open("get", "example.php", true);
xhr3.send(null);

```

4.GET请求

``` javascript
//get请求格式：xhr.open('get', 'example.php?name1=value1&name2=value2', true);

//创建一个函数用于对url进行编码
function addURLParam(url, name, value){
    url += (url.indexOf('?')==-1 ? '?' : '&');
    url += encodeURIComponent(name) + '=' + encodeURIComponent(value);
    return url;
}

var url = 'get.php';
url = addURLParam(url, 'name', 'Alvin');
url = addURLParam(url, 'age', '23');

var xhr4 = createXHR();     
xhr4.onreadystatechange = function(event){
    if (xhr4.readyState == 4){
        if ((xhr4.status >= 200 && xhr4.status < 300) || xhr4.status == 304){
            alert(xhr4.responseText);
        } else {
            alert("Request was unsuccessful: " + xhr4.status);
        }
    }
};
xhr4.open('get', url, false);
xhr4.send(null);
```

5.POST请求

``` javascript
var xhr5 = createXHR();        
xhr5.onreadystatechange = function(event){
    if (xhr5.readyState == 4){
        if ((xhr5.status >= 200 && xhr5.status < 300) || xhr5.status == 304){
            alert(xhr5.responseText);
        } else {
            alert("Request was unsuccessful: " + xhr5.status);
        }
    }
};

xhr5.open("post", "postexample.php", true);

//模拟浏览器行为，所有由浏览器发出的post请求都将'content-type'头部设置为'application/x-www-form-urlencoded'
xhr5.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");        
xhr5.send('name=alvin&age=23');
```