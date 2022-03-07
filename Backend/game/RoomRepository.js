const Log = require('./Log');
const HoldLoader = require('./holdLoader/HoldLoader');
const Room = require('./Room');
const Utils = require('./Utils');

const roomsDatabase = loadHolds(['official_levelset']);
// const roomsDatabase = loadHolds(['test']);

// HoldLoader.load(`${__dirname}/../bup.hold`);
// HoldLoader.load(`${__dirname}/../bup.hold.unclosed`);
// process.abort();

function loadHolds(names){
	const rooms = [];
	names.forEach(name => {
		rooms.push.apply(rooms, HoldLoader.load(`${__dirname}/../${name}.hold`));
	});

	Utils.shuffleArray(rooms);

	return rooms;
}

function validateUniqueRoomNames(roomNames){
	const uniqueRoomNames = roomNames.filter( (value, index, array) => array.indexOf(value) === index);

	if (roomNames.length != uniqueRoomNames.length){
		throw new Error("Non-unique room name found :(");
	}
}

function getUncompletedRoomNames(player1, player2, recordStore){
	const allRoomNames = RoomRepository.getRoomNames();
	return allRoomNames.filter(roomName => {
		return !recordStore.didPlayerComplete(player1.completedRoomNames, roomName) || !recordStore.didPlayerComplete(player2.completedRoomNames, roomName);
	});
}

function getNextBestRoomDataId(availableRoomNames, startingId){
	if (availableRoomNames.length > 0){
		for (let i = 1; i <= roomsDatabase.length; i++){
			const id = (startingId + i) % roomsDatabase.length;

			if (availableRoomNames.indexOf(roomsDatabase[id].name) !== -1){
				return id;
			}
		}
	}

	return (startingId + 1) % roomsDatabase.length;

}

const RoomRepository = {
	getNewRoom: function (player1, player2, requestedId, isRestarting, recordStore, requestedRoomNames) {
		const selectedRoomId = determineRoomId(player1, player2, requestedId, isRestarting, recordStore, requestedRoomNames);

		const roomData = roomsDatabase[selectedRoomId];

		const room = new Room(player1, player2, selectedRoomId);
		room.readFromJson(roomData);

		return room;
	},
	getRoomNames: function(){
		return roomsDatabase.map(room => room.name);
	},
	getRooms: function() {
		return roomsDatabase;
	}
};

function determineRoomId(player1, player2, requestedId, isRestarting, recordStore, requestedRoomNames) {
	requestedRoomNames = requestedRoomNames || [];
	while (requestedRoomNames.length > 0) {
		const roomName = requestedRoomNames.shift();
		if (!roomName) {
			continue;
		}

		const index = roomsDatabase.findIndex(x => x.name.toUpperCase() === roomName.toUpperCase());

		if (index !== -1) {
			return index;
		}
	}

	const availableRoomNames = getUncompletedRoomNames(player1, player2, recordStore);

	const preliminaryId = (requestedId !== null
		? requestedId
		: Math.floor(Math.random() * roomsDatabase.length)) % roomsDatabase.length;
	const selectedRoomId = isRestarting
		? requestedId
		: getNextBestRoomDataId(availableRoomNames, preliminaryId);

	return selectedRoomId;
}

validateUniqueRoomNames(RoomRepository.getRoomNames());

module.exports = RoomRepository;