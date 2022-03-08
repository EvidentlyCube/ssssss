const Log = require('./Log');

var Session = function(player1, player2){
	this.room = null;
	this.name = `${player1.name.substring(0, 8).toUpperCase()}:${player2.name.substring(0, 8).toUpperCase()}`
	this.players = [player1, player2];
	this.moves = [];

	player1.session = this;
	player2.session = this;
};

Session.prototype.log = function(text){
	Log(this, "INFO", text);
};

Session.prototype.logDebug = function(text){
	Log(this, "DEBUG", text);
};

Session.prototype.getOtherPlayer = function(player){
	return this.players[0] === player
		? this.players[1]
		: this.players[0];
};

module.exports = Session;