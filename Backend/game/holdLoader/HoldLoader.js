const Constants = require('../Constants');

const fs = require('fs');
const zlib = require('zlib');
const DOMParser = require('xmldom').DOMParser;
const xpath = require('xpath');

module.exports = {
	load: function (path) {
		const buffer = fs.readFileSync(path);

		for (let i = 0; i < buffer.length; i++) {
			buffer[i] = buffer[i] ^ 0xFF;
		}
		const result = zlib.inflateSync(buffer);

		const hold = new DOMParser().parseFromString(result.toString());
		const levelAuthors = new Map();
		Array.from(xpath.select('//Levels', hold)).forEach(x => {
			levelAuthors.set(
				x.getAttribute('LevelID'),
				Buffer.from(x.getAttribute('NameMessage'), 'base64')
					.toString()
					.replace(/(.)./g, '$1')
					.replace(/\[.+?\]/g, '')
					.trim()
			);
		});

		const rooms = xpath.select("//Rooms", hold);

		return rooms.map(x => {
			const levelId = x.getAttribute('LevelID');
			const author = levelAuthors.get(levelId);

			return loadRoom(x, author);
		})
		.filter(room => room.monsters.length > 0 && room.author);
	}
};

function loadRoom(roomXml, author) {
	const room = {
		players: [{}, {}],
		oLayer: getEmptyArray(),
		tLayer: getEmptyArray(),
		fLayer: getEmptyArray(),
		monsters: [],
		orbs: [],
		author: author,
		name: xpath.select('./Scrolls', roomXml)[0].getAttribute('Message'),
		rockGolemHack: false
	};

	room.name = Buffer.from(room.name, 'base64').toString().replace(/(.)./g, '$1');

	const squaresData = loadSquares(roomXml.getAttribute("Squares"));

	for (let x = 0; x < Constants.RoomWidth; x++){
		for (let y = 0; y < Constants.RoomHeight; y++){
			const o = squaresData.o[x][y];
			const f = squaresData.f[x][y];
			const t = squaresData.t[x][y];

			switch(o){
				case 1: room.oLayer[x][y] = Constants.TileTypes.Floor; break;
				case 2: room.oLayer[x][y] = Constants.TileTypes.Pit; break;
				case 4: room.oLayer[x][y] = Constants.TileTypes.Wall; break;
				case 66: room.oLayer[x][y] = Constants.TileTypes.Wall; break;
				case 9: room.oLayer[x][y] = Constants.TileTypes.YellowDoorUp; break;
				case 10: room.oLayer[x][y] = Constants.TileTypes.YellowDoorDown; break;
				case 8: room.oLayer[x][y] = Constants.TileTypes.RedDoorUp; break;
				case 70: room.oLayer[x][y] = Constants.TileTypes.RedDoorDown; break;
				case 78: room.oLayer[x][y] = Constants.TileTypes.PressurePlate; break;
				case 11: room.oLayer[x][y] = Constants.TileTypes.Trapdoor; break;
				case 37: room.oLayer[x][y] = Constants.TileTypes.BlackDoorUp; break;
				case 71: room.oLayer[x][y] = Constants.TileTypes.BlackDoorDown; break;
			}

			switch(f){
				case 13: room.fLayer[x][y] = Constants.TileTypes.ArrowN; break;
				case 14: room.fLayer[x][y] = Constants.TileTypes.ArrowNE; break;
				case 15: room.fLayer[x][y] = Constants.TileTypes.ArrowE; break;
				case 16: room.fLayer[x][y] = Constants.TileTypes.ArrowSE; break;
				case 17: room.fLayer[x][y] = Constants.TileTypes.ArrowS; break;
				case 18: room.fLayer[x][y] = Constants.TileTypes.ArrowSW; break;
				case 19: room.fLayer[x][y] = Constants.TileTypes.ArrowW; break;
				case 20: room.fLayer[x][y] = Constants.TileTypes.ArrowNW; break;
			}

			switch(t){
				case 35: room.tLayer[x][y] = Constants.TileTypes.Tar; break;
			}
		}
	}
	room.monsters = xpath.select('./Monsters', roomXml).map(monsterXml => {
		let type = null;

		switch(monsterXml.getAttribute('Type').toString()){
			case "0": type = Constants.MonsterTypes.Roach; break;
			case "1": type = Constants.MonsterTypes.RoachQueen; break;
			case "6": type = Constants.MonsterTypes.EvilEye; break;
			case "9": type = Constants.MonsterTypes.TarBaby; break;
			case "15": type = Constants.MonsterTypes.RockGolem; room.rockGolemHack = true; break;
			case "21": type = Constants.MonsterTypes.Wubba; break;
			case "19":
				room.players[0] = {
					x: parseInt(monsterXml.getAttribute("X")),
					y: parseInt(monsterXml.getAttribute("Y")),
					o: parseInt(monsterXml.getAttribute("O"))
				};
				return null;
			case "23":
				room.players[1] = {
					x: parseInt(monsterXml.getAttribute("X")),
					y: parseInt(monsterXml.getAttribute("Y")),
					o: parseInt(monsterXml.getAttribute("O"))
				};
				return null;
		}

		if (type === null){
			return null;
		}

		if (!room.players[0].x || !room.players[1].x){
			throw new Error(`Player positions not specified correctly in ${room.name}`);
		}

		return {
			x: parseInt(monsterXml.getAttribute("X")),
			y: parseInt(monsterXml.getAttribute("Y")),
			o: parseInt(monsterXml.getAttribute("O")),
			type: type,
		};
	}).filter(x => x);

	room.orbs = xpath.select('./Orbs', roomXml).map(orbXml => {
		return {
			x: parseInt(orbXml.getAttribute("X")),
			y: parseInt(orbXml.getAttribute("Y")),
			agents: xpath.select('./OrbAgents', orbXml).map(agentXml => {
				return {
					x:    parseInt(agentXml.getAttribute("X")),
					y:    parseInt(agentXml.getAttribute("Y")),
					type: parseInt(agentXml.getAttribute("Type"))
				}
			})
		}
	});

	return room;
}

function getEmptyArray() {
	const arr = [];
	for (let x = 0; x < Constants.RoomWidth; x++) {
		arr[x] = [];
		for (let y = 0; y < Constants.RoomHeight; y++){
			arr[x][y] = 0;
		}
	}

	return arr;
}

function arrayTo2d(array) {
	const res = [];
	for (let x = 0; x < 38; x++) {
		res[x] = [];
		for (let y = 0; y < 32; y++) {
			res[x][y] = array[x + y * 38];
		}
	}

	return res;
}

function loadSquares(squares) {
	const s = Buffer.from(squares, 'base64');
	const numSquares = 32 * 38;
	const olayer = [];
	const flayer = [];
	const tlayer = [];
	const tparams = [];
	let counter = 0;
	const version = s[counter++];

	// Read O-layer
	let count = 0;
	while (count < numSquares) {
		let numTiles = s[counter++];
		let tileNo = s[counter++];
		if (numTiles === 0) {
			count = numSquares; // Emergency break-out to avoid infinite loop
		}
		count += numTiles;
		for (let x = 0; x < numTiles; x++) {
			olayer.push(tileNo);
		}
	}

	// Read f-layer
	count = 0;
	while (count < numSquares) {
		const numTiles = s[counter++];
		const tileNo = s[counter++];
		if (numTiles === 0) {
			count = numSquares; // Emergency break-out to avoid infinite loop
		}
		count += numTiles;
		for (let x = 0; x < numTiles; x++) {
			flayer.push(tileNo);
		}
	}

	// Read t-layer
	count = 0;
	while (count < numSquares) {
		const numTiles = s[counter++];
		const tileNo = s[counter++];
		const tileParam = s[counter++];
		if (numTiles === 0) {
			count = numSquares; // Emergency break-out to avoid infinite loop
		}
		count += numTiles;
		for (let x = 0; x < numTiles; x++) {
			tlayer.push(tileNo);
			tparams.push(tileParam);
		}
	}

	return {
		o: arrayTo2d(olayer),
		f: arrayTo2d(flayer),
		t: arrayTo2d(tlayer)
	};
}