$(function(){
	var socket = io.connect(),
	player = {},
	yc = $('.tu_color'),
	oc = $('.color_opo'),
	your_turn = false,
	url = window.location.href.split('/'),
	room = url[url.length-1];

	var text = {
		'tt' : "Tu Turno",
		'ntt' : "Esperando al oponente",
		'popover_h2' : "Esperando al oponente",
		'popover_p' : "Envia este URL a un amigo para jugar con el :D",
		'popover_h2_victoria' : "¡GANASTE!",
		'popover_p_victoria' : "Envía el URL a otro amigo para jugar con el",
		'popover_h2_derrota' : "¡PERDISTE!",
		'popover_p_derrota' : "Envía el URL a otro amigo para jugar con el",
		'popover_h2_empate' : "¡EMPATE!",
		'popover_p_empate' : "Envía el URL a otro amigo para jugar con el",
	}

	init();

	socket.on('asignar', function(data) {
		player.pid = data.pid;
		player.hash = data.hash;
		if(player.pid == "1"){
			yc.addClass('rojo');
			oc.addClass('azul');
			player.color = 'rojo';
			player.oponend = 'azul';
			$('.underlay').removeClass('oculto');
			$('.popover').removeClass('oculto');
		}else{
			$('.status').html(text.ntt);
			yc.addClass('azul');
			oc.addClass('rojo');
			oc.addClass('mostrar');
			player.color = 'azul';
			player.oponend = 'rojo';
		}
	});

	socket.on('victoria', function(data) {
		oc.removeClass('mostrar');
		yc.removeClass('mostrar');
		change_turn(false);
		for(var i = 0; i < 4; i++){
			$('.cols .col .coin#coin_'+data.winner.winner_coins[i]).addClass('winner_coin');
		}

		if(data.winner.winner == player.pid){
			$('.popover h2').html(text.popover_h2_victoria);
			$('.popover p').html(text.popover_p_victoria);
		}else{
			$('.popover h2').html(text.popover_h2_derrota);
			$('.popover p').html(text.popover_p_derrota);
		}
		
		setTimeout(function(){
			$('.underlay').removeClass('oculto');
			$('.popover').removeClass('oculto');
		},2000);
	});

	socket.on('empate', function() {
		oc.removeClass('mostrar');
		yc.removeClass('mostrar');
		change_turn(false);
		$('.popover h2').html(text.popover_h2_empate);
		$('.popover p').html(text.popover_p_empate);
		setTimeout(function(){
			$('.underlay').removeClass('oculto');
			$('.popover').removeClass('oculto');
		},2000);
	});

	socket.on('iniciar', function(data) {
		change_turn(true);
		yc.addClass('mostrar');
		$('.underlay').addClass('oculto');
		$('.popover').addClass('oculto');
	});

	socket.on('parar', function(data) {
		init();
		reset_board();
	});

	socket.on('mov_hecho', function(data) {
		make_move(data.col+1, true);
		change_turn(true);
		yc.addClass('mostrar');
		oc.removeClass('mostrar');
	});

	socket.on('mov_oponente', function(data) {
		if(!your_turn){
			oc.css('left', parseInt(data.col)*100);
		}
		console.debug(data);
	});

	$('.cols > .col').mouseenter(function(){
		if(your_turn){
			yc.css('left', $(this).index()*100);
			socket.emit('mi_mov', {col: $(this).index()});
		}
	});

	$('.cols > .col').click(function(){
		if(parseInt($(this).attr('data-in-col')) < 6){
			if(your_turn){
				var col = $(this).index()+1;
				make_move(col);
				socket.emit('HacerMov', {col: col-1, hash: player.hash});
				change_turn(false);
				yc.removeClass('mostrar');
				oc.addClass('mostrar');
			}
		}
	});

	function make_move(col, other){
		if(!other) other = false;
		var col_elm = $('.cols > .col#col_'+col);
		var current_in_col = parseInt(col_elm.attr('data-in-col'));
		col_elm.attr('data-in-col', current_in_col+1);
		var color = (other) ? player.oponend : player.color;
		var new_coin = $('<div class="coin '+color+'" id="coin_'+(5-current_in_col)+''+(col-1)+'"></div>');
		col_elm.append(new_coin);
		new_coin.animate({
			top : 100*(4-current_in_col+1),
		}, 400);
	}

	function init(){
		socket.emit('join', {room: room});
		$('.popover input').val(window.location.href);
		$('.popover h2').html(text.popover_h2);
		$('.popover p').html(text.popover_p);
		$('.status').html('');
	}

	function reset_board(){
		$('.cols .col').attr('data-in-col', '0').html('');
		yc.removeClass('azul rojo');
		oc.removeClass('azul rojo');
		yc.removeClass('mostrar');
		oc.removeClass('mostrar');
	}

	function change_turn(tt){
		if(tt){
			your_turn = true;
			$('.status').html(text.tt);
		}else{
			your_turn = false;
			$('.status').html(text.ntt);
		}
	}
	
	$('.popover input').click(function(){
		 $(this).select();
	});

});