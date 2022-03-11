const Constants = require('./Constants');
const Utils = require('./Utils');
const Roach = require('./monsters/Roach');
const RoachQueen = require('./monsters/RoachQueen');
const RoachEgg = require('./monsters/RoachEgg');
const EvilEye = require('./monsters/EvilEye');
const Wubba = require('./monsters/Wubba');
const RockGolem = require('./monsters/RockGolem');
const TarBaby = require('./monsters/TarBaby');

const Room = function (player1, player2, id) {
	this.id = id;
	this.tiles = [];
	this.tilesF = [];
	this.tilesT = [];
	this.orbs = [];
	this.turn = 0;
	this.name = "";
	this.author = "";
	this.isCompleted = false;

	this.tarCuts = [];

	this.wasBusyTurn = false;

	for (let x = 0; x < Constants.RoomWidth; x++) {
		this.tiles[x] = [];
		this.tilesF[x] = [];
		this.tilesT[x] = [];
		for (let y = 0; y < Constants.RoomHeight; y++) {
			this.tiles[x][y] = Constants.TileTypes.Floor;
			this.tilesF[x][y] = 0;
			this.tilesT[x][y] = 0;
		}
	}

	this.players = [player1, player2];
	this.monsters = [];
};

Room.prototype.getPlayerIndex = function(player) {
	return this.players.indexOf(player);
}

Room.prototype.killAllMonsters = function(){
	this.monsters.concat().forEach(monster => this.killMonster(monster));
};

Room.prototype.isVulnerableTar = function(x, y, tarType){
	const isTargetTar = this.tilesT[x][y] == tarType;
	if (!isTargetTar){
		return false;
	}

	const isHorizontalUp = this.tilesT[x - 1][y] == tarType && this.tilesT[x + 1][y] == tarType && this.tilesT[x][y - 1] != tarType;
	const isHorizontalDown = this.tilesT[x - 1][y] == tarType && this.tilesT[x + 1][y] == tarType && this.tilesT[x][y + 1] != tarType;
	const isVerticalLeft = this.tilesT[x][y - 1] == tarType && this.tilesT[x][y + 1] == tarType && this.tilesT[x - 1][y] != tarType;
	const isVerticalUp = this.tilesT[x][y - 1] == tarType && this.tilesT[x][y + 1] == tarType && this.tilesT[x + 1][y] != tarType;

	return isTargetTar &&
		(
			isHorizontalUp
			|| isHorizontalDown
			|| isVerticalLeft
			|| isVerticalUp
		);
};

Room.prototype.isOutsideRoom = function (x, y) {
	return x < 0 || y < 0 || x >= Constants.RoomWidth || y >= Constants.RoomHeight;
}

Room.prototype.isBlockedByObstacle = function (startX, startY, direction) {
	const newX = startX + Utils.dirX(direction);
	const newY = startY + Utils.dirY(direction);
	const tile = this.tiles[newX][newY];
	const sourceTileF = this.tilesF[startX][startY];
	const tileF = this.tilesF[newX][newY];
	const tileT = this.tilesT[newX][newY];

	if (Utils.doesArrowBlock(sourceTileF, direction) || Utils.doesArrowBlock(tileF, direction)) {
		return true;
	}

	return tile == Constants.TileTypes.Wall
		|| tile == Constants.TileTypes.YellowDoorUp
		|| tile == Constants.TileTypes.Pit
		|| tile == Constants.TileTypes.RedDoorUp
		|| tile == Constants.TileTypes.BlackDoorUp
		|| tileT == Constants.TileTypes.Tar;
};

Room.prototype.tryToEatPlayer = function (x, y) {
	for (let player of this.players) {
		if (player.x == x && player.y == y) {
			player.isDead = true;
		}
	}
};

Room.prototype.attackTile = function (x, y) {
	for (let monster of this.monsters) {
		if (monster.x == x && monster.y == y && monster.isSwordVulnerable) {
			this.killMonster(monster);
			return;
		}
	}

	for (let player of this.players) {
		if (player.x == x && player.y == y) {
			player.isDead = true;
		}
	}

	if (this.isVulnerableTar(x, y, Constants.TileTypes.Tar)) {
		this.tarCuts.push({x: x, y: y});
	}
};

Room.prototype.killMonster = function (monster) {
	switch (monster.type) {
		case Constants.MonsterTypes.RockGolem:
			monster.type = Constants.MonsterTypes.RockGolemPile;
			monster.isRequired = false;
			monster.isSwordVulnerable = false;
			break;

		default:
			this.monsters = this.monsters.filter(x => x != monster);
			break;

	}
};

Room.prototype.isBlockedByMonster = function (x, y) {
	for (let monster of this.monsters) {
		if (monster.x == x && monster.y == y) {
			return true;
		}
	}

	return false;
};

Room.prototype.isBlockedBySword = function (x, y, checker) {
	for (let player of this.players) {
		if (checker === player) {
			continue;
		}
		if (player.isDead) {
			continue;
		}

		const sword = player.getSwordPosition();
		if (sword.x == x && sword.y == y) {
			return true;
		}
	}

	return false;
};

Room.prototype.isBlockedByPlayer = function (x, y) {
	for (let player of this.players) {
		if (player.isDead) {
			continue;
		}

		if (player.x == x && player.y == y) {
			return true;
		}
	}

	return false;
};

Room.prototype.dropTrapdoor = function (x, y) {
	const tile = this.tiles[x][y];

	if (tile !== Constants.TileTypes.Trapdoor) {
		return;
	}

	this.wasBusyTurn = true;
	this.tiles[x][y] = Constants.TileTypes.Pit;

	if (!this.hasTile(Constants.TileTypes.Trapdoor)) {
		this.swapTile(Constants.TileTypes.RedDoorUp, Constants.TileTypes.RedDoorDown);
	}
}

Room.prototype.hasTile = function (tileType) {
	for (let x = 0; x < Constants.RoomWidth; x++) {
		for (let y = 0; y < Constants.RoomHeight; y++) {
			if (this.tiles[x][y] == tileType || this.tilesF[x][y] == tileType || this.tilesT[x][y] == tileType) {
				return true;
			}
		}
	}

	return false;
};

Room.prototype.swapTile = function (fromType, toType) {
	for (let x = 0; x < Constants.RoomWidth; x++) {
		for (let y = 0; y < Constants.RoomHeight; y++) {
			if (this.tiles[x][y] == fromType) {
				this.tiles[x][y] = toType;
			} else if (this.tiles[x][y] == toType) {
				this.tiles[x][y] = fromType;
			}
		}
	}
};

Room.prototype.getTarget = function (x, y, lastTarget) {
	const p1Dist = this.players[0].isDead ? 99999999 : this.getDistance(x, y, this.players[0].x, this.players[0].y);
	const p2Dist = this.players[1].isDead ? 99999999 : this.getDistance(x, y, this.players[1].x, this.players[1].y);

	if (p1Dist === p2Dist) {
		return this.players[lastTarget || 0];
	}

	return this.players[p1Dist <= p2Dist ? 0 : 1];
};

Room.prototype.getDistance = function (x1, y1, x2, y2) {
	return Math.abs(x2 - x1) + Math.abs(y2 - y1);
};

Room.prototype.stepOnPlate = function (x, y) {
	if (this.tiles[x][y] != Constants.TileTypes.PressurePlate) {
		return;
	}

	this.wasBusyTurn = true;

	this.tiles[x][y] = Constants.TileTypes.PressurePlateUsed;

	const orb = this.orbs.find(orb => orb.x == x && orb.y == y);
	if (!orb) {
		return;
	}

	orb.agents.forEach(agent => {
		this.manipulateYellowDoors(agent.x, agent.y, agent.type);
	});
};

Room.prototype.manipulateYellowDoors = function (x, y, type) {
	const doorTiles = this.collectTiles(x, y);

	switch (type) {
		case Constants.Orb.Toggle:
			doorTiles.forEach(tile => {
				this.tiles[tile.x][tile.y] = (tile.type == Constants.TileTypes.YellowDoorUp ? Constants.TileTypes.YellowDoorDown : Constants.TileTypes.YellowDoorUp);
			});
			break;
		case Constants.Orb.Close:
			doorTiles.forEach(tile => {
				this.tiles[tile.x][tile.y] = Constants.TileTypes.YellowDoorUp;
			});
			break;
		case Constants.Orb.Open:
			doorTiles.forEach(tile => {
				this.tiles[tile.x][tile.y] = Constants.TileTypes.YellowDoorDown;
			});
			break;
	}
};

Room.prototype.collectTiles = function (x, y) {
	const firstTile = {x: x, y: y, type: this.tiles[x][y]};

	const foundTiles = [];
	const tilesToCheck = [firstTile];

	while (tilesToCheck.length > 0) {
		const tile = tilesToCheck.pop();
		if (this.tiles[tile.x][tile.y] != firstTile.type) {
			continue;
		}
		if (foundTiles.find(x => x.x == tile.x && x.y == tile.y)) {
			continue;
		}

		foundTiles.push({x: tile.x, y: tile.y, type: this.tiles[tile.x][tile.y]});
		tilesToCheck.push({x: tile.x - 1, y: tile.y});
		tilesToCheck.push({x: tile.x + 1, y: tile.y});
		tilesToCheck.push({x: tile.x, y: tile.y - 1});
		tilesToCheck.push({x: tile.x, y: tile.y + 1});
	}

	return foundTiles;
};

Room.prototype.toJson = function () {
	return JSON.parse(JSON.stringify({
		tiles: this.tiles,
		tilesF: this.tilesF,
		tilesT: this.tilesT,
		monsters: this.monsters.map(monster => {
			return {x: monster.x, y: monster.y, o: monster.o, prevX: monster.prevX, prevY: monster.prevY, type: monster.type, target: monster.lastTarget}
		}),
		turn: this.turn,
		wasBusy: this.wasBusyTurn,
		name: this.name,
		author: this.author,
		orbs: this.orbs,
		players: this.players.map(player => {
			return {
				x: player.x,
				y: player.y,
				prevX: player.prevX,
				prevY: player.prevY,
				o: player.o,
				isDead: player.isDead,
				sword: {
					x: player.x + Utils.dirX(player.o),
					y: player.y + Utils.dirY(player.o),
					prevX: player.prevX + Utils.dirX(player.o),
					prevY: player.prevY + Utils.dirY(player.o),
				}
			}
		}),
	}));
};

Room.prototype.areAllMonstersDead = function () {
	return !this.monsters.find(monster => monster.isRequired);
}

Room.prototype.addMonster = function (x, y, o, type) {
	switch (type) {
		case Constants.MonsterTypes.Roach:
			this.monsters.push(new Roach(x, y, o));
			break;
		case Constants.MonsterTypes.RoachQueen:
			this.monsters.push(new RoachQueen(x, y, o));
			break;
		case Constants.MonsterTypes.RoachEgg:
			this.monsters.push(new RoachEgg(x, y, o));
			break;
		case Constants.MonsterTypes.EvilEye:
			this.monsters.push(new EvilEye(x, y, o));
			break;
		case Constants.MonsterTypes.Wubba:
			this.monsters.push(new Wubba(x, y, o));
			break;
		case Constants.MonsterTypes.RockGolem:
			this.monsters.push(new RockGolem(x, y, o));
			break;
		case Constants.MonsterTypes.TarBaby:
			this.monsters.push(new TarBaby(x, y, o));
			break;
	}
};

Room.prototype.readFromJson = function (json) {
	this.tiles = deepCopySimpleData(json.oLayer);
	this.tilesF = deepCopySimpleData(json.fLayer);
	this.tilesT = deepCopySimpleData(json.tLayer);
	this.orbs = deepCopySimpleData(json.orbs);
	this.name = json.name;
	this.author = json.author;

	for (let i = 0; i < 2; i++) {
		this.players[i].x = json.players[i].x;
		this.players[i].prevX = json.players[i].x;
		this.players[i].y = json.players[i].y;
		this.players[i].prevY = json.players[i].x;
		this.players[i].o = json.players[i].o;
	}

	json.monsters.forEach(monster => {
		this.addMonster(monster.x, monster.y, monster.o, monster.type);
	});

	for (let monster of this.monsters) {
		monster.prevX = monster.x;
		monster.prevY = monster.y;
		monster.updateTarget(this);
	}

};

Room.prototype.isStableTar = function(x, y, tarType){
	return (
		this.tilesT[x][y] == tarType
		&& this.tilesT[x-1][y] == tarType
		&& this.tilesT[x-1][y-1] == tarType
		&& this.tilesT[x][y-1] == tarType
	) || (
		this.tilesT[x][y] == tarType
		&& this.tilesT[x+1][y] == tarType
		&& this.tilesT[x+1][y-1] == tarType
		&& this.tilesT[x][y-1] == tarType
	) || (
		this.tilesT[x][y] == tarType
		&& this.tilesT[x-1][y] == tarType
		&& this.tilesT[x-1][y+1] == tarType
		&& this.tilesT[x][y+1] == tarType
	) || (
		this.tilesT[x][y] == tarType
		&& this.tilesT[x+1][y] == tarType
		&& this.tilesT[x+1][y+1] == tarType
		&& this.tilesT[x][y+1] == tarType
	);
};
Room.prototype.destroyUnstableTarAround = function(x, y, tarType){
	this.destroyUnstableTar(x - 1, y - 1, tarType);
	this.destroyUnstableTar(x, y - 1, tarType);
	this.destroyUnstableTar(x + 1, y - 1, tarType);
	this.destroyUnstableTar(x - 1, y, tarType);
	this.destroyUnstableTar(x + 1, y, tarType);
	this.destroyUnstableTar(x - 1, y + 1, tarType);
	this.destroyUnstableTar(x, y + 1, tarType);
	this.destroyUnstableTar(x + 1, y + 1, tarType);
};

Room.prototype.destroyUnstableTar = function(x, y, tarType){
	if (this.tilesT[x][y] == tarType && !this.isStableTar(x, y, tarType)){
		this.tilesT[x][y] = 0;

		if (!this.isTarCutTile(x, y) && !this.isBlockedBySword(x, y, null)){
			this.addMonster(x, y, Constants.Moves.N, Constants.MonsterTypes.TarBaby);
		}

		this.destroyUnstableTarAround(x, y, tarType);
	}
};

Room.prototype.isTarCutTile = function(x, y){
	return this.tarCuts.find(v => v.x == x && v.y == y) != null;
}

Room.prototype.process = function (SessionManager) {
	this.wasBusyTurn = false;
	this.tarCuts.length = 0;

	this.turn++;

	const wasDead = this.players.map(x => x.isDead);

	for (let player of this.players) {
		player.prevX = player.x;
		player.prevY = player.y;
		player.process(this, player.nextMove);
		player.nextMove = null;
	}

	for (let monster of this.monsters) {
		monster.prevX = monster.x;
		monster.prevY = monster.y;
		monster.process(this);
	}

	this.tarCuts.forEach(position => {
		const tarType = this.tilesT[position.x][position.y];
		this.wasBusyTurn = true;
		this.tilesT[position.x][position.y] = 0;
		this.destroyUnstableTarAround(position.x, position.y, tarType);
	});

	if (this.tarCuts.length > 0 && !this.hasTile(Constants.TileTypes.Tar)){
		this.swapTile(Constants.TileTypes.BlackDoorUp, Constants.TileTypes.BlackDoorDown);
	}

	for (let i = 0; i < 2; i++) {
		if (!wasDead[i] && this.players[i].isDead) {
			SessionManager.emit(this.players[0], 'data', {type: 'playerDead', player: i});
			SessionManager.emit(this.players[1], 'data', {type: 'playerDead', player: i});
		}
	}
};

module.exports = Room;

function deepCopySimpleData(data) {
	return JSON.parse(JSON.stringify(data));
}