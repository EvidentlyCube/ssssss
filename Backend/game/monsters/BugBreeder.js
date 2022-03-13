const Constants = require('../Constants');
const Utils = require('../Utils');


const BugBreeder = function(x, y, o){
	this.x = x;
	this.y = y;
	this.o = o;
	this.prevX = x;
	this.prevY = y;

	this.lastTarget = null;
	this.type = Constants.MonsterTypes.BugBreeder;
	this.isRequired = true;
	this.isSwordVulnerable = true;
};


BugBreeder.prototype.updateTarget = function(room) {
	var target = room.getTarget(this.x, this.y, this.lastTarget);
	this.lastTarget = room.getPlayerIndex(target);

	return target;
}

BugBreeder.prototype.process = function(room){
	const target = this.updateTarget(room);

	var deltaX = -Math.sign(target.x - this.x);
	var deltaY = -Math.sign(target.y - this.y);

	this.o = Utils.dirFromXY(deltaX, deltaY);

	const oldX = this.x;
	const oldY = this.y;

	(
		this._tryToMove(room, deltaX, deltaY)
		|| this._tryToMove(room, 0, deltaY)
		|| this._tryToMove(room, deltaX, 0)
	);

	if (room.turn % 30 === 0 && room.turn > 0){
		for (let o = 0; o < 9; o++){
			if (o == Constants.Moves.WAIT){
				continue;
			}

			const layX = this.x + Utils.dirX(o);
			const layY = this.y + Utils.dirY(o);

			if (this.canLieEgg(room, layX, layY, oldX, oldY)){
				room.stepOnPlate(layX, layY);
				room.addMonster(layX, layY, 0, Constants.MonsterTypes.BugEgg);
			}
		}
	}
};

BugBreeder.prototype.canLieEgg = function(room, x, y, oldX, oldY){
	if (x == oldX && y == oldY){
		return false;
	}

	const oTile = room.tiles[x][y];
	if (
		oTile == Constants.TileTypes.Wall
		|| oTile == Constants.TileTypes.Pit
		|| oTile == Constants.TileTypes.YellowDoorDown
		|| oTile == Constants.TileTypes.YellowDoorUp
		|| oTile == Constants.TileTypes.Trapdoor
		|| oTile == Constants.TileTypes.RedDoorUp
		|| oTile == Constants.TileTypes.Resin
		|| oTile == Constants.TileTypes.BlackDoorUp
	){
		return false;
	}

	const fTile = room.tilesF[x][y];

	if (Utils.isArrow(fTile)){
		return false;
	}

	if (
		room.isBlockedBySword(x, y, this)
		|| room.isBlockedByPlayer(x, y)
		|| room.isBlockedByMonster(x, y)
	){
		return false;
	}

	return true;
};

BugBreeder.prototype._tryToMove = function(room, deltaX, deltaY){
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


module.exports = BugBreeder;