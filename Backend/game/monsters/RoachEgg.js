const Constants = require('../Constants');
const Utils = require('../Utils');


const RoachEgg = function(x, y, o){
	this.x = x;
	this.y = y;
	this.o = o;
	this.prevX = x;
	this.prevY = y;

	this.type = Constants.MonsterTypes.RoachEgg;
	this.justLied = true;
	this.isRequired = true;
	this.isSwordVulnerable = true;
};


RoachEgg.prototype.process = function(room){
	if (this.justLied){
		this.justLied = false;
		return;
	}

	this.o++;

	if (this.o === 4){
		room.killMonster(this);
		room.addMonster(this.x, this.y, Constants.Moves.N, Constants.MonsterTypes.Roach);
	}
};

module.exports = RoachEgg;