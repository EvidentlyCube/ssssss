const Constants = require('./Constants');
const Utils = require('./Utils');

const Player = function (socket, name) {
	this.socket = socket;
	this.name = name;

	this.session = null;
	this.nextMove = null;

	this.isDead = false;
	this.completedRoomNames = [];

	this.inviting = null;

	this.x = 0;
	this.y = 0;
	this.o = 0;
};

Player.prototype.process = function (room, command) {
	if (this.isDead){
		return;
	}

	if (command == Constants.Moves.CW || command == Constants.Moves.CCW){
		this.processRotation(room, command);
	} else if (command != Constants.Moves.WAIT){
		this.processMove(room, command);
	}

	const sword = this.getSwordPosition();
	room.attackTile(sword.x, sword.y);
};

Player.prototype.processMove = function (room, command) {
	const newX = this.x + Utils.dirX(command);
	const newY = this.y + Utils.dirY(command);

	if (
		room.isBlockedByMonster(newX, newY)
		|| room.isBlockedByObstacle(this.x, this.y, command)
		|| room.isBlockedByPlayer(newX, newY)
		|| room.isBlockedBySword(newX, newY, this)
	){
		return;
	}

	room.dropTrapdoor(this.x, this.y);

	this.x = newX;
	this.y = newY;

	room.stepOnPlate(newX, newY);
};

Player.prototype.processRotation = function (room, command) {
	if (command == Constants.Moves.CW){
		this.o = Utils.nextCw(this.o);
	} else if (command == Constants.Moves.CCW){
		this.o = Utils.nextCcw(this.o);
	}

};

Player.prototype.getSwordPosition = function () {
	return {
		x: this.x + Utils.dirX(this.o),
		y: this.y + Utils.dirY(this.o)
	}
};


module.exports = Player;