const Constants = require('../Constants');
const Utils = require('../Utils');


const BugEgg = function(x, y, o){
	this.x = x;
	this.y = y;
	this.o = o;
	this.prevX = x;
	this.prevY = y;

	this.type = Constants.MonsterTypes.BugEgg;
	this.justLied = true;
	this.isRequired = true;
	this.isSwordVulnerable = true;
};


BugEgg.prototype.process = function(room){
	if (this.justLied){
		this.justLied = false;
		return;
	}

	this.o++;

	if (this.o === 4){
		room.killMonster(this);
		room.addMonster(this.x, this.y, Constants.Moves.N, Constants.MonsterTypes.Bug);
	}
};

module.exports = BugEgg;