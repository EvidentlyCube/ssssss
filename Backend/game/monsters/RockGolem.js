const Constants = require('../Constants');
const Utils = require('../Utils');


const RockGolem = function(x, y, o){
	this.x = x;
	this.y = y;
	this.o = o;

	this.type = Constants.MonsterTypes.RockGolem;
	this.isRequired = true;
	this.isSwordVulnerable = true;
};


RockGolem.prototype.process = function(room){
	if (this.type == Constants.MonsterTypes.RockGolemPile){
		return;
	}

	var target = room.getTarget(this.x, this.y);

	var deltaX = Math.sign(target.x - this.x);
	var deltaY = Math.sign(target.y - this.y);

	this.o = Utils.dirFromXY(deltaX, deltaY);

	this._tryToMove(room, deltaX, deltaY);
};

RockGolem.prototype._tryToMove = function(room, deltaX, deltaY){
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


module.exports = RockGolem;