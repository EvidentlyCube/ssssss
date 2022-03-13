const Constants = require('../Constants');
const Utils = require('../Utils');


const Bug = function(x, y, o){
	this.x = x;
	this.y = y;
	this.o = o;
	this.prevX = x;
	this.prevY = y;

	this.lastTarget = null;
	this.type = Constants.MonsterTypes.Bug;
	this.isRequired = true;
	this.isSwordVulnerable = true;
};

Bug.prototype.updateTarget = function(room) {
	var target = room.getTarget(this.x, this.y, this.lastTarget);
	this.lastTarget = room.getPlayerIndex(target);

	return target;
}

Bug.prototype.process = function(room){
	const target = this.updateTarget(room);

	var deltaX = Math.sign(target.x - this.x);
	var deltaY = Math.sign(target.y - this.y);

	this.o = Utils.dirFromXY(deltaX, deltaY);

	(
		this._tryToMove(room, deltaX, deltaY)
		|| this._tryToMove(room, 0, deltaY)
		|| this._tryToMove(room, deltaX, 0)
	)
};

Bug.prototype._tryToMove = function(room, deltaX, deltaY){
	const newX = this.x + deltaX;
	const newY = this.y + deltaY;

	const moveO = Utils.dirFromXY(deltaX, deltaY);

	if (
		room.isBlockedByMonster(newX, newY)
		|| room.isBlockedByObstacle(this.x, this.y, moveO)
		|| room.isBlockedBySword(newX, newY, this)
	){
		return false;
	}

	this.x = newX;
	this.y = newY;

	room.tryToEatPlayer(newX, newY);
	room.stepOnPlate(newX, newY);

	return true;
};


module.exports = Bug;