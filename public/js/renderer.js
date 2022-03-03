var renderer = {
	renderRoom: function (oLayerDraw, fLayerDraw, transparentLayerDraw, roomData) {
		for (var x = 0; x < GAME_WIDTH; x++) {
			for (var y = 0; y < GAME_HEIGHT; y++) {
				var tile = roomData.tiles[x][y];
				if (tile == 0) {
					oLayerDraw(x, y, x % 2, (y % 2) + 3);

				} else if (tile == 1) {
					oLayerDraw({x: x, y: y}, getWallOffset(x, y, roomData.tiles));
				} else if (tile == 2) {
					oLayerDraw({x: x, y: y}, getYellowDoorOffset(x, y, roomData.tiles));
				} else if (tile == 3) {
					oLayerDraw({x: x, y: y}, getClosedYellowDoorOffset(x, y, roomData.tiles));
				} else if (tile == 4) {
					oLayerDraw({x: x, y: y}, {x: 12, y: 11});
				} else if (tile == 5) {
					oLayerDraw({x: x, y: y}, {x: 13, y: 11});
				} else if (tile == 6) {
					oLayerDraw({x: x, y: y}, getPitOffset(x, y, roomData.tiles));
				} else if (tile == 7) {
					oLayerDraw({x: x, y: y}, {x: 14, y: 11});
				} else if (tile == 8) {
					oLayerDraw({x: x, y: y}, getRedDoorOffset(x, y, roomData.tiles));
				} else if (tile == 9) {
					oLayerDraw({x: x, y: y}, getClosedRedDoorOffset(x, y, roomData.tiles));
				} else if (tile == 11) {
					oLayerDraw({x: x, y: y}, getBlackDoorOffset(x, y, roomData.tiles));
				} else if (tile == 12) {
					oLayerDraw({x: x, y: y}, getClosedBlackDoorOffset(x, y, roomData.tiles));
				}

				var tileF = roomData.tilesF[x][y];
				if (tileF) {
					fLayerDraw({x: x, y: y}, {x: tileF - 100, y: 15+7});
				}

				var tileT = roomData.tilesT[x][y];
				if (tileT == 10) {
					var offset = getTarOffset(x, y, 10, roomData.tilesT);
					offset.opacity = 0.6;
					transparentLayerDraw({x: x, y: y}, offset);
				}
			}
		}
	},

	renderTopLayer: function (topLayerDraw, roomData, currentPlayerId) {
		const otherPlayerId = 1 - currentPlayerId;
		topLayerDraw(roomData.players[currentPlayerId], getBeethroTile(roomData.players[currentPlayerId].o, roomData.players[currentPlayerId].isDead ? 0.3 : 1));
		topLayerDraw(roomData.players[otherPlayerId], getGuardTile(roomData.players[otherPlayerId].o, roomData.players[otherPlayerId].isDead ? 0.3 : 1));

		for (var i = 0; i < roomData.monsters.length; i++) {
			var monster = roomData.monsters[i];

			if (monster.type == 3) {
				topLayerDraw(monster, getRoachTile(monster.o));
			} else if (monster.type == 4) {
				topLayerDraw(monster, getRoachQueenTile(monster.o));
			} else if (monster.type == 5) {
				topLayerDraw(monster, getEvilEyeTile(monster.o));
			} else if (monster.type == 6) {
				topLayerDraw(monster, getRoachEggTile(monster.o));
			} else if (monster.type == 7) {
				topLayerDraw(monster, getActiveEvilEyeTile(monster.o));
			} else if (monster.type == 8) {
				topLayerDraw(monster, {x: 8, y: 2});
			} else if (monster.type == 9) {
				topLayerDraw(monster, getTarBabyTile(monster.o));
			} else if (monster.type == 10) {
				topLayerDraw(monster, getRockGolemTile(monster.o));
			} else if (monster.type == 11) {
				topLayerDraw(monster, getRockGolemPileTile());
			}
		}

		topLayerDraw(roomData.players[currentPlayerId].sword, getBeethroSwordTile(roomData.players[currentPlayerId].o, roomData.players[currentPlayerId].isDead ? 0.3 : 1));
		topLayerDraw(roomData.players[otherPlayerId].sword, getGuardSwordTile(roomData.players[otherPlayerId].o, roomData.players[otherPlayerId].isDead ? 0.3 : 1));
	},

	renderGhost: function (topLayerDraw, position, moveQueue, isYou) {
		if (move > 10 || !position) {
			return;
		}

		var x = position.x;
		var y = position.y;
		var o = position.o;

		var consecutiveWaits = 0;

		for (let i = 0; i < moveQueue.length; i++) {
			var move = moveQueue[i];
			x = x + DIR_X_MAP[move];
			y = y + DIR_Y_MAP[move];
			o = move < 9
				? o
				: (
					move == 9
						? nextCw(o)
						: nextCcw(o)
				);

			var offset;

			if (move === 4) {
				offset = getSleepTile();
				topLayerDraw(
					(x + 0.5) * TILE_EDGE - Math.floor(consecutiveWaits / 10) * 8,
					(y - 0.5) * TILE_EDGE + (consecutiveWaits % 10) * 8,
					offset.x,
					offset.y,
					1, ['ghost'], {precise: true}
				)
				consecutiveWaits++
				continue;
			}

			consecutiveWaits = 0;

			if (move < 9) {
				offset = isYou ? getBeethroTile(o) : getGuardTile(o);
				offset.opacity = 0.5;
				offset.classes = ['ghost'];
				topLayerDraw({x, y}, offset);
			}

			offset = isYou ? getBeethroSwordTile(o) : getGuardSwordTile(o);
			offset.opacity = 0.5;
			offset.classes = ['ghost'];
			topLayerDraw({x: x + DIR_X_MAP[o], y: y + DIR_Y_MAP[o]}, offset);
		}
	}
};

function getPitOffset(x, y, tiles) {
	const isPitAbove1 = y <= 0 || tiles[x][y - 1] == 6;
	const isPitAbove2 = y <= 1 || tiles[x][y - 2] == 6;

	if (isPitAbove1 && !isPitAbove2) {
		return {x: 6 + (x % 3), y: 17};

	} else if (!isPitAbove1) {
		return {x: 6 + (x % 3), y: 16};
	}

	return {x: x % 6, y: 16 + (y % 6)};
}

function getYellowDoorOffset(x, y, tiles) {
	const offset = getDoorOffset_inner(x, y, tiles, 2, 3);

	return {x: 12 + offset.x, y: 3 + offset.y};
}

function getClosedYellowDoorOffset(x, y, tiles) {
	const offset = getDoorOffset_inner(x, y, tiles, 2, 3);

	return {x: 12 + offset.x, y: 7 + offset.y};
}

function getRedDoorOffset(x, y, tiles) {
	const offset = getDoorOffset_inner(x, y, tiles, 8, 8);

	return {x: 12 + offset.x, y: 12 + offset.y};
}

function getClosedRedDoorOffset(x, y, tiles) {
	const offset = getDoorOffset_inner(x, y, tiles, 9, 9);

	return {x: 12 + offset.x, y: 16 + offset.y};
}

function getBlackDoorOffset(x, y, tiles) {
	const offset = getDoorOffset_inner(x, y, tiles, 11, 11);

	return {x: 12 + offset.x, y: 20 + offset.y};
}

function getClosedBlackDoorOffset(x, y, tiles) {
	const offset = getDoorOffset_inner(x, y, tiles, 12, 12);

	return {x: 12 + offset.x, y: 24 + offset.y};
}

function getDoorOffset_inner(x, y, tiles, type1, type2) {
	var bytes = getSurroundingByte(x, y, type1, tiles, true) | getSurroundingByte(x, y, type2, tiles, true);

	bytes &= (2 | 8 | 32 | 128);

	// Single block
	if ((bytes & 0xAA) == 0x00) {
		return DOOR_OFFSETS._0;
	}

	// Single Dead ends
	if ((bytes & 0xAA) == 0x20) {
		return DOOR_OFFSETS.S;
	}
	if ((bytes & 0xAA) == 0x08) {
		return DOOR_OFFSETS.W;

	}
	if ((bytes & 0xAA) == 0x02) {
		return DOOR_OFFSETS.N;

	}
	if ((bytes & 0xAA) == 0x80) {
		return DOOR_OFFSETS.E;

	}

	// Single turns
	if ((bytes & 0xEA) == 0xA0) {
		return DOOR_OFFSETS.SE;
	}
	if ((bytes & 0xBA) == 0x28) {
		return DOOR_OFFSETS.SW;

	}

	if ((bytes & 0xAE) == 0x0A) {
		return DOOR_OFFSETS.NW;

	}
	if ((bytes & 0xAB) == 0x82) {
		return DOOR_OFFSETS.NE;

	}

	// Single corridors
	if ((bytes & 0xAA) == 0x88) {
		return DOOR_OFFSETS.EW;

	}
	if ((bytes & 0xAA) == 0x22) {
		return DOOR_OFFSETS.NS;
	}

	// Single triple conjunction
	if ((bytes & 0xEB) == 0xA2) {
		return DOOR_OFFSETS.NSE;
	}
	if ((bytes & 0xFA) == 0xA8) {
		return DOOR_OFFSETS.SEW;

	}
	if ((bytes & 0xBE) == 0x2A) {
		return DOOR_OFFSETS.NSW;
	}
	if ((bytes & 0xAF) == 0x8A) {
		return DOOR_OFFSETS.NEW;

	}

	// Four way crossroad
	if (bytes == 0xAA) {
		return DOOR_OFFSETS.NSEW;

	}

	return DOOR_OFFSETS._0;
}

function getTarOffset(x, y, tarType, tiles){
	var bytes = getSurroundingByte(x, y, tarType, tiles, false);

	// Completely surrounded
	if (bytes == 0xFF) {
		return TAR_OFFSETS.NSEW1234;
	}

	// Sides
	if ((bytes & 0xEB) == 0xE3) {
		return TAR_OFFSETS.NSE24;
	}
	if ((bytes & 0xFA) == 0xF8) {
		return TAR_OFFSETS.SEW34;
	}
	if ((bytes & 0xBE) == 0x3E) {
		return TAR_OFFSETS.NSW13;
	}
	if ((bytes & 0xAF) == 0x8F) {
		return TAR_OFFSETS.NEW12;

	}

	// (Lots of) Inner corners
	if (bytes == 0xFB) {
		return TAR_OFFSETS.NSEW234;
	}
	if (bytes == 0xFE) {
		return TAR_OFFSETS.NSEW134;
	}
	if (bytes == 0xBF) {
		return TAR_OFFSETS.NSEW123;
	}
	if (bytes == 0xEF) {
		return TAR_OFFSETS.NSEW124;
	}
	if (bytes == 0xBB) {
		return TAR_OFFSETS.NSEW23;
	}
	if (bytes == 0xEE) {
		return TAR_OFFSETS.NSEW14;
	}


	// Corners
	if ((bytes & 0xE0) == 0xE0) {
		return TAR_OFFSETS.SE4;
	}
	if ((bytes & 0x38) == 0x38) {
		return TAR_OFFSETS.SW3;
	}
	if ((bytes & 0x0E) == 0x0E) {
		return TAR_OFFSETS.NW1;
	}
	if ((bytes & 0x83) == 0x83) {
		return TAR_OFFSETS.NE2;
	}

	return TAR_OFFSETS._0;
}

function getWallOffset(x, y, tiles) {
	var bytes = getSurroundingByte(x, y, 1, tiles, true);

	// Completely surrounded
	if (bytes == 0xFF) {
		return WALL_OFFSETS.NSEW1234;
	}

	// Single block
	if ((bytes & 0xAA) == 0x00) {
		return WALL_OFFSETS._0;
	}

	// Single Dead ends
	if ((bytes & 0xAA) == 0x20) {
		return WALL_OFFSETS.S;
	}
	if ((bytes & 0xAA) == 0x08) {
		return WALL_OFFSETS.W;

	}
	if ((bytes & 0xAA) == 0x02) {
		return WALL_OFFSETS.N;

	}
	if ((bytes & 0xAA) == 0x80) {
		return WALL_OFFSETS.E;

	}

	// Single turns
	if ((bytes & 0xEA) == 0xA0) {
		return WALL_OFFSETS.SE;
	}
	if ((bytes & 0xBA) == 0x28) {
		return WALL_OFFSETS.SW;

	}

	if ((bytes & 0xAE) == 0x0A) {
		return WALL_OFFSETS.NW;

	}
	if ((bytes & 0xAB) == 0x82) {
		return WALL_OFFSETS.NE;

	}

	// Single corridors
	if ((bytes & 0xAA) == 0x88) {
		return WALL_OFFSETS.EW;

	}
	if ((bytes & 0xAA) == 0x22) {
		return WALL_OFFSETS.NS;
	}

	// Single triple conjunction
	if ((bytes & 0xEB) == 0xA2) {
		return WALL_OFFSETS.NSE;
	}
	if ((bytes & 0xFA) == 0xA8) {
		return WALL_OFFSETS.SEW;

	}
	if ((bytes & 0xBE) == 0x2A) {
		return WALL_OFFSETS.NSW;
	}
	if ((bytes & 0xAF) == 0x8A) {
		return WALL_OFFSETS.NEW;

	}

	// Four way crossroad
	if (bytes == 0xAA) {
		return WALL_OFFSETS.NSEW;

	}

	// Corners
	if ((bytes & 0xEA) == 0xE0) {
		return WALL_OFFSETS.SE4;
	}
	if ((bytes & 0xBA) == 0x38) {
		return WALL_OFFSETS.SW3;
	}
	if ((bytes & 0xAE) == 0x0E) {
		return WALL_OFFSETS.NW1;

	}
	if ((bytes & 0xAB) == 0x83) {
		return WALL_OFFSETS.NE2;

	}

	// Sides
	if ((bytes & 0xEB) == 0xE3) {
		return WALL_OFFSETS.NSE24;
	}
	if ((bytes & 0xFA) == 0xF8) {
		return WALL_OFFSETS.SEW34;
	}
	if ((bytes & 0xBE) == 0x3E) {
		return WALL_OFFSETS.NSW13;
	}
	if ((bytes & 0xAF) == 0x8F) {
		return WALL_OFFSETS.NEW12;

	}

	// (Lots of) Inner corners
	if (bytes == 0xFB) {
		return WALL_OFFSETS.NSEW234;
	}
	if (bytes == 0xFE) {
		return WALL_OFFSETS.NSEW134;
	}
	if (bytes == 0xBF) {
		return WALL_OFFSETS.NSEW123;
	}
	if (bytes == 0xEF) {
		return WALL_OFFSETS.NSEW124;
	}
	if (bytes == 0xFA) {
		return WALL_OFFSETS.NSEW34;
	}
	if (bytes == 0xBB) {
		return WALL_OFFSETS.NSEW23;
	}
	if (bytes == 0xEB) {
		return WALL_OFFSETS.NSEW24;
	}
	if (bytes == 0xBE) {
		return WALL_OFFSETS.NSEW13;
	}
	if (bytes == 0xEE) {
		return WALL_OFFSETS.NSEW14;
	}
	if (bytes == 0xAF) {
		return WALL_OFFSETS.NSEW12;
	}
	if (bytes == 0xBA) {
		return WALL_OFFSETS.NSEW3;
	}
	if (bytes == 0xEA) {
		return WALL_OFFSETS.NSEW4;
	}
	if (bytes == 0xAB) {
		return WALL_OFFSETS.NSEW2;
	}
	if (bytes == 0xAE) {
		return WALL_OFFSETS.NSEW1;
	}

	// Sides
	if ((bytes & 0xFA) == 0xE8) {
		return WALL_OFFSETS.SEW4;

	}
	if ((bytes & 0xFA) == 0xB8) {
		return WALL_OFFSETS.SEW3;

	}
	if ((bytes & 0xBE) == 0x3A) {
		return WALL_OFFSETS.NSW3;
	}
	if ((bytes & 0xBE) == 0x2E) {
		return WALL_OFFSETS.NSW1;

	}
	if ((bytes & 0xAF) == 0x8B) {
		return WALL_OFFSETS.NEW2;

	}

	if ((bytes & 0xAF) == 0x8E) {
		return WALL_OFFSETS.NEW1;

	}
	if ((bytes & 0xEB) == 0xE2) {
		return WALL_OFFSETS.NSE4;
	}
	if ((bytes & 0xEB) == 0xA3) {
		return WALL_OFFSETS.NSE2;

	}

	return WALL_OFFSETS._0;
}

function getSurroundingByte(x, y, type, tiles, borderObstacle) {
	var data = 0;

	if ((y > 0 && tiles[x][y - 1] == type) || (borderObstacle && y <= 0))
		data |= 2;

	if ((x > 0 && tiles[x - 1][y] == type) || (borderObstacle && x <= 0))
		data |= 8;

	if ((x < GAME_WIDTH - 1 && tiles[x + 1][y] == type) || (borderObstacle && x >= GAME_WIDTH - 1))
		data |= 128;

	if ((y < GAME_HEIGHT - 1 && tiles[x][y + 1] == type) || (borderObstacle && y >= GAME_HEIGHT - 1))
		data |= 32;


	if ((y > 0 && x > 0 && tiles[x - 1][y - 1] == type) || (borderObstacle && (y <= 0 || x <= 0)))
		data |= 4;

	if ((x > 0 && y < GAME_HEIGHT - 1 && tiles[x - 1][y + 1] == type) || (borderObstacle && (y >= GAME_HEIGHT - 1 || x <= 0)))
		data |= 16;

	if ((x < GAME_WIDTH - 1 && y > 0 && tiles[x + 1][y - 1] == type) || (borderObstacle && (y <= 0 || x >= GAME_WIDTH - 1)))
		data |= 1;

	if ((y < GAME_HEIGHT - 1 && x < GAME_WIDTH - 1 && tiles[x + 1][y + 1] == type) ||
		(borderObstacle && (y >= GAME_HEIGHT - 1 || x >= GAME_WIDTH - 1)))
		data |= 64;

	return data;
}

function oToOffset(o) {
	return O_TO_OFFSET_MAP[o];
}

function getBeethroTile(o, opacity) {
	return {x: 0, y: 0, opacity: opacity};
}

function getBeethroSwordTile(o, opacity) {
	return {x: oToOffset(o), y: 1, opacity: opacity};
}

function getGuardTile(o, opacity) {
	return {x: 1, y: 0, opacity: opacity};
}

function getGuardSwordTile(o, opacity) {
	return {x: oToOffset(o), y: 1, opacity: opacity};
}

function getRoachTile(o) {
	return {x: oToOffset(o), y: 5};
}

function getRoachQueenTile(o) {
	return {x: oToOffset(o), y: 6};
}

function getEvilEyeTile(o) {
	return {x: oToOffset(o), y: 2};
}

function getActiveEvilEyeTile(o) {
	return {x: oToOffset(o), y: 2};
}

function getTarBabyTile(o) {
	return {x: 9, y: 0};
}

function getRockGolemTile(o) {
	return {x: oToOffset(o), y: 7};
}

function getRockGolemPileTile() {
	return {x: 8, y: 5	};
}

function getRoachEggTile(o) {
	return {x: 4 + o, y: 0};
}

function getSleepTile() {
	return {x: 0, y: 8};
}


var O_TO_OFFSET_MAP = [7, 0, 1, 6, 0, 2, 5, 4, 3];
var DOOR_OFFSETS = {
	SE: {x: 0, y: 0},
	SEW: {x: 1, y: 0},
	SW: {x: 2, y: 0},
	S: {x: 3, y: 0},

	NSE: {x: 0, y: 1},
	NSEW: {x: 1, y: 1},
	NSW: {x: 2, y: 1},
	NS: {x: 3, y: 1},

	NE: {x: 0, y: 2},
	NEW: {x: 1, y: 2},
	NW: {x: 2, y: 2},
	N: {x: 3, y: 2},

	E: {x: 0, y: 3},
	EW: {x: 1, y: 3},
	W: {x: 2, y: 3},
	_0: {x: 3, y: 3}
};
var WALL_OFFSETS = {
	SE4: {x: 0, y: 0},
	SE: {x: 1, y: 0},
	SW3: {x: 2, y: 0},
	SW: {x: 3, y: 0},
	NE2: {x: 4, y: 0},
	NE: {x: 5, y: 0},
	NW1: {x: 6, y: 0},
	NW: {x: 7, y: 0},
	S: {x: 8, y: 0},
	W: {x: 9, y: 0},
	N: {x: 10, y: 0},
	E: {x: 11, y: 0},
	_0: {x: 12, y: 0},
	EW: {x: 13, y: 0},
	NS: {x: 14, y: 0},

	SEW34: {x: 0, y: 1},
	SEW3: {x: 1, y: 1},
	SEW4: {x: 2, y: 1},
	SEW: {x: 3, y: 1},
	NEW12: {x: 4, y: 1},
	NEW2: {x: 5, y: 1},
	NEW1: {x: 6, y: 1},
	NEW: {x: 7, y: 1},
	NSE24: {x: 8, y: 1},
	NSE4: {x: 9, y: 1},
	NSE2: {x: 10, y: 1},
	NSE: {x: 11, y: 1},
	NSW13: {x: 12, y: 1},
	NSW3: {x: 13, y: 1},
	NSW1: {x: 14, y: 1},
	NSW: {x: 15, y: 1},

	NSEW1234: {x: 0, y: 2},
	NSEW234: {x: 1, y: 2},
	NSEW134: {x: 2, y: 2},
	NSEW34: {x: 3, y: 2},
	NSEW123: {x: 4, y: 2},
	NSEW23: {x: 5, y: 2},
	NSEW13: {x: 6, y: 2},
	NSEW3: {x: 7, y: 2},
	NSEW124: {x: 8, y: 2},
	NSEW24: {x: 9, y: 2},
	NSEW14: {x: 10, y: 2},
	NSEW4: {x: 11, y: 2},
	NSEW12: {x: 12, y: 2},
	NSEW2: {x: 13, y: 2},
	NSEW1: {x: 14, y: 2},
	NSEW: {x: 15, y: 2}
};

var TAR_OFFSETS = {
	_0: {x: 12, y: 6},

	SE4: {x: 11, y: 5},
	SW3: {x: 13, y: 5},
	NE2: {x: 11, y: 7},
	NW1: {x: 13, y: 7},

	SEW34: {x: 12, y: 5},
	NEW12: {x: 12, y: 7},
	NSE24: {x: 11, y: 6},
	NSW13: {x: 13, y: 6},

	NSEW1234: {x: 12, y: 6},
	NSEW234: {x: 14, y: 7},
	NSEW134: {x: 15, y: 7},
	NSEW123: {x: 14, y: 5},
	NSEW23: {x: 15, y: 6},
	NSEW124: {x: 15, y: 5},
	NSEW14: {x: 14, y: 6}
};
