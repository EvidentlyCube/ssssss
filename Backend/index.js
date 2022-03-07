var express = require('express');
var app = express();
var cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io')(http, {
	cors: {
	  origin: [
		"https://drod-online.evidentlycube.com",
		"https://drod-online-ws.evidentlycube.com"
	  ],
	  methods: ["GET", "POST"]
	}
  });

var Constants = require('./game/Constants');
var SessionManager = require('./game/SessionManager');
var RecordStore = require('./game/RecordStore');
var Config = require('../config');


app.use(cors({
	origin: [
		"https://drod-online.evidentlycube.com",
		"https://drod-online-ws.evidentlycube.com"
	]
}))


app.use(express.static(__dirname + "/../public/"));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

function isInvalidVersion(data) {
	if (data.version != Constants.GameVersion){
		socket.emit('data', {type: 'kill', explanation: `Game version mismatch, got '${query.version}' but expected '${Constants.GameVersion}'`});
		return true;
	}

	return false;
}

io.on('connection', function(socket){
	const query = socket.request._query;
	if (query.version != Constants.GameVersion){
		SessionManager.emit(socket, 'kill', { rexplanation: `Game version mismatch, got '${query.version}' but expected '${Constants.GameVersion}'`});
		return;
	}

	socket.on('disconnect', function(){
		SessionManager.disconnected(socket);
	});

	socket.on('setName', function(data) {
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.connectPlayer(socket, data.name);
	});

	socket.on('get-rooms', function(data) {
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.emit(socket, 'data', { type: 'roomList', rooms: RecordStore.getRooms().map(x => {
			return {
				name: x.name,
				author: x.author
			}
		})});
	});

	socket.on('set-completed-rooms', function(data) {
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.setCompletedRooms(socket, data.completedRoomNames);
	});

	socket.on('invite-send', function(data) {
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.invite(socket, data.name);
	});

	socket.on('invite-revoke', function(data) {
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.uninvite(socket, data.name);
	});

	socket.on('invite-accept', function(data) {
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.acceptInvite(socket, data.inviterName);
	});

	socket.on('move', function(data){
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.submitMove(socket, data.move, data.turn, data.queue, data.meta);
	});

	socket.on('getPlayerList', function(data){
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.getPlayerList(socket);
	});

	socket.on('emote', function(data){
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.submitEmote(socket, data.emote);
	});

	socket.on('stop-session', function(data){
		if (isInvalidVersion(data)){
			return;
		}

		SessionManager.killSession(socket);
	});
});

function checkVersion(version, socket){
	if (version !== Constants.GameVersion){
		socket.close();
	}
}

http.listen(Config.port, function(){
	console.log(`listening on *:${Config.port}`);
});