//server
var express = require('express'),
	game_logic = require('./game_logic'),
	app = express(),
	server = require('http').createServer(app),
	port = Number(process.env.PORT || 4000),
	io = require('socket.io')(server);
console.log('servidor en puerto ' + port);
server.listen(port);

//routes
app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/img", express.static(__dirname + '/img'));

app.get('/', function(req, res){
	res.writeHead(302, {
		'Location': '/'+generateHash(6)
	});
	res.end();
})

app.get('/:room([A-Za-z0-9]{6})', function(req, res) {
	res.sendFile(__dirname+'/index.html');
});

function generateHash(length) {
	var valores = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
		salida = '';
	for(var i = 0; i < length; i++) {
		salida += valores.charAt(Math.floor(Math.random() * valores.length));
	}
	return salida;
};

//sockets
io.sockets.on('connection', function(socket){

	socket.on('join', function(data){
		if(data.room in game_logic.games){
			var game = game_logic.games[data.room];
			if(typeof game.player2 != 'undefined'){
				return;
			}
			console.log('Jugador 2 está adentro :D');
			socket.join(data.room);
			socket.room = data.room;
			socket.pid = 2;
			socket.hash = generateHash(8);
			game.player2 = socket;
			socket.opponent = game.player1;
			game.player1.opponent = socket;
			socket.emit('asignar', {pid: socket.pid, hash: socket.hash});
			game.turn = 1;
			socket.broadcast.to(data.room).emit('iniciar');
		}else{
			console.log('Jugador 1 ha entrado');
			if(Object.keys(socket.rooms).includes(data.room) <= 0) socket.join(data.room);
			socket.room = data.room;
			socket.pid = 1;
			socket.hash = generateHash(8);
			game_logic.games[data.room] = {
				player1: socket,
				moves: 0,
				board: [[0,0,0,0,0,0,0],
						[0,0,0,0,0,0,0],
						[0,0,0,0,0,0,0],
						[0,0,0,0,0,0,0],
						[0,0,0,0,0,0,0],
						[0,0,0,0,0,0,0]]
			};
			socket.emit('asignar', {pid: socket.pid, hash: socket.hash});
		}

		socket.on('HacerMov', function(data){
			var game = game_logic.games[socket.room];
			if(data.hash = socket.hash && game.turn == socket.pid){
				var mov_hecho = game_logic.make_move(socket.room, data.col, socket.pid);
				if(mov_hecho){
					game.moves = parseInt(game.moves)+1;
					socket.broadcast.to(socket.room).emit('mov_hecho', {pid: socket.pid, col: data.col});
					game.turn = socket.opponent.pid;
					var winner = game_logic.check_for_win(game.board);
					if(winner){
						io.to(socket.room).emit('victoria', {winner: winner});
					}
					if(game.moves >= 42){
						io.to(socket.room).emit('empate');
					}
				}
			}
		});

		socket.on('mi_mov', function(data){
			socket.broadcast.to(socket.room).emit('mov_oponente', {col: data.col});
		})

		socket.on('disconnect', function () {
			if(socket.room in game_logic.games){
				delete game_logic.games[socket.room];
				io.to(socket.room).emit('parar');
				console.log('sala cerrada: '+socket.room);
			}else{
				console.log('Intento de desconexión fallida');
			}
		});
	});
});