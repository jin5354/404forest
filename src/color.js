$(function(){
	$('.color input.fk').keyup(function(event) {
		var R = parseInt($('.color input#Ri').val());
		var G = parseInt($('.color input#Gi').val());
		var B = parseInt($('.color input#Bi').val());


		if(isNaN(R)||R < 0){
			R=0;
			if(!$('div#Rs').children().is('img')){
				$('div#Rs').append('<img src="http://my404forest.qiniudn.com/color-warning.png" class="warning">');
			}
		}
		else if(R > 255){
			R=255;
			if(!$('div#Rs').children().is('img')){
				$('div#Rs').append('<img src="http://my404forest.qiniudn.com/color-warning.png" class="warning">');
			}
		}
		else{
			$('div#Rs').children().remove('img');
		}
		if(isNaN(G)||G < 0){
			G=0;
			if(!$('div#Rg').children().is('img')){
				$('div#Rg').append('<img src="http://my404forest.qiniudn.com/color-warning.png" class="warning">');
			}
		}
		else if(G > 255){
			G=255;
			if(!$('div#Rg').children().is('img')){
				$('div#Rg').append('<img src="http://my404forest.qiniudn.com/color-warning.png" class="warning">');
			}
		}
		else{
			$('div#Rg').children().remove('img');
		}
		if(isNaN(B)||B < 0){
			B=0;
			if(!$('div#Rb').children().is('img')){
				$('div#Rb').append('<img src="http://my404forest.qiniudn.com/color-warning.png" class="warning">');
			}
		}
		else if(B > 255){
			B=255;
			if(!$('div#Rb').children().is('img')){
				$('div#Rb').append('<img src="http://my404forest.qiniudn.com/color-warning.png" class="warning">');
			}
		}
		else{
			$('div#Rb').children().remove('img');
		}
		
		var R_hex = R.toString(16);
		var G_hex = G.toString(16);
		var B_hex = B.toString(16);

		if(parseInt(R_hex,16) <= 0xF){R_hex = '0' + R_hex};
		if(parseInt(G_hex,16) <= 0xF){G_hex = '0' + G_hex};
		if(parseInt(B_hex,16) <= 0xF){B_hex = '0' + B_hex};

		var color = '#' + R_hex + G_hex + B_hex;
		$('span.output').text(color);
		$('span.output').css('color',color);
	});

	var temp = $('.color input#copy').val();
	var rgbpattern = /\d{1,3}\s*[,，]?\s*\d{1,3}\s*[,，]?\s*\d{1,3}/

	$('.color input#copy').keyup(function(event){
		if($('.color input#copy').val() != temp){
			temp = $('.color input#copy').val();
			if(temp.search(rgbpattern) != -1){
				var resultArray = temp.match(/\d{1,3}/g);
				$('.color input#Ri').val(resultArray[0]);
				$('.color input#Gi').val(resultArray[1]);
				$('.color input#Bi').val(resultArray[2]);
				$('.color input.fk').trigger('keyup');
			}
		}
	});
});

