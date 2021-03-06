const Constants = require('../Constants');
const Utils = require('../Utils');


const Gazer = function (x, y, o) {
	this.x = x;
	this.y = y;
	this.o = o;
	this.prevX = x;
	this.prevY = y;

	this.lastTarget = null;
	this.isActive = false;
	this.isRequired = true;
	this.isSwordVulnerable = true;

	this.type = Constants.MonsterTypes.Gazer;
};


Gazer.prototype.updateTarget = function(room) {
	var target = room.getTarget(this.x, this.y, this.lastTarget);
	this.lastTarget = room.getPlayerIndex(target);

	return target;
}

Gazer.prototype.process = function (room) {
	if (!this.isActive && !this._spotPlayer(room)) {
		return;
	}

	const target = this.updateTarget(room);

	const deltaX = Math.sign(target.x - this.x);
	const deltaY = Math.sign(target.y - this.y);

	this.o = Utils.dirFromXY(deltaX, deltaY);

	(
		this._tryToMove(room, deltaX, deltaY)
		|| this._tryToMove(room, 0, deltaY)
		|| this._tryToMove(room, deltaX, 0)
	)
};

Gazer.prototype._spotPlayer = function (room) {
	const dX = Utils.dirX(this.o);
	const dY = Utils.dirY(this.o);

	let testX = this.x;
	let testY = this.y;
	let tile;

	while (true) {
		testX += dX;
		testY += dY;

		if (room.isOutsideRoom(testX, testY)) {
			return false;
		}

		tile = room.tiles[testX][testY];

		if (
			tile == Constants.TileTypes.YellowDoorUp
			|| tile == Constants.TileTypes.RedDoorUp
			|| tile == Constants.TileTypes.BlackDoorUp
			|| tile == Constants.TileTypes.Wall
		) {
			return false;
		}

		if (room.players.find(player => player.x == testX && player.y == testY)) {
			this.isActive = true;
			this.type = Constants.MonsterTypes.EvilEyeActive;
			return true;
		}
	}
};

Gazer.prototype._tryToMove = function (room, deltaX, deltaY) {
	const newX = this.x + deltaX;
	const newY = this.y + deltaY;

	const moveO = Utils.dirFromXY(deltaX, deltaY);

	if (
		room.isBlockedByMonster(newX, newY)
		|| room.isBlockedByObstacle(this.x, this.y, moveO)
		|| room.isBlockedBySword(newX, newY, this)
	) {
		return false;
	}

	this.x = newX;
	this.y = newY;

	room.tryToEatPlayer(newX, newY);
	room.stepOnPlate(newX, newY);

	return true;
};


module.exports = Gazer;