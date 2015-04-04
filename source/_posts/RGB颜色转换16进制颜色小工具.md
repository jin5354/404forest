title: RGB颜色转换16进制颜色小工具
categories:
  - Code
tags:
  - Javascript
date: 2014-12-29 13:15:41
---
<div class="color"><p><input type="text" id="Ri" class="fk"><input type="text" id="Gi" class="fk"><input type="text" id="Bi" class="fk"><span class="output">#000000</span></p><div class="RGB"><div id="Rs"><span>R</span></div><div id="Rg"><span>G</span></div><div id="Rb"><span>B</span></div></div><p><br />也可以将类似“255,198,139”或者“background-color: rgb(255,198,139);”类似包含RGB信息的字符串粘贴在下面的输入框里，会自动处理。</p><p><input type="text" id="copy"></p></div>

<style>
	.container{
		width: 940px;
		margin: 0 auto;
		font-size: 20px;
	}
	input.fk{
		border: 2px solid #000;
		width: 50px;
		height: 40px;
		padding: 10px;
		font-size: 22px;
        margin-right: 20px;
        text-align: center;
	}
    input#copy{
    	max-width: 500px;
        padding :15px;
        font-size: 23px;
        border: 1px solid #000;
    }
    span.output{
    	font-size: 35px;
        font-weight: bold;
        margin-left: 30px;
    }
    div.RGB>div{
    	width: 74px;
        margin-right: 20px;
        text-align: center;
        display: inline-block;
        *display: inline;
        *zoom: 1;
        font-size: 20px;
    }
    div.RGB>div>span{
    	vertical-align: middle;
    }
    div.RGB{
    	margin-top: 10px;
    }
    img.warning{
    	width: 24px;
        height: 24px;
        display: inline-block;
        vertical-align: middle;
    }
</style>


<script src="http://my404forest.qiniudn.com/jquery-1.11.2.min.js"></script>
<script src="http://my404forest.qiniudn.com/color.js"></script>