const Log = require('./Log');
const fs = require('fs');
const RoomRepository = require('./RoomRepository');
const recordStorePath = __dirname + "/../_recordStore/record.store";

const roomNames = RoomRepository.getRoomNames();
const playerNameToCompletedRooms = importStore();

function importStore(){
	try {
		const jsonString = fs.readFileSync(recordStorePath);
		const data = JSON.parse(jsonString);

		if (data){
			Log(null, "CORE", "Loaded record store");
		} else {
			Log(null, "CORE", "Record store load failed");
		}
		return cleanUpScores(data) || {};
	} catch (e){
		Log(null, "CORE", `Loading scores failed: ${e.message}`);
		return {};
	}
}

function cleanUpScores(scores){
	for (let playerName in scores){
		if (!scores.hasOwnProperty(playerName)){
			return;
		}

		const decodedPlayerName = decodeURI(playerName);
		if (decodedPlayerName != playerName){
			scores[decodedPlayerName] = scores[playerName];
			delete scores[playerName];
			playerName = decodedPlayerName;
		}
		scores[playerName] = clean(scores[playerName]);
		scores[playerName].sort();
	}

	function clean(playerRoomNames){
		return playerRoomNames.filter(roomName => roomNames.indexOf(roomName) !== -1);
	}

	return scores;
}

module.exports = {
	hasEverythingCompleted: function(completedRoomNames){
		return roomNames.filter(function(n) {
			return completedRoomNames.indexOf(n) === -1;
		}).length === 0;
	},
	didPlayerComplete: function(completedRoomNames, roomName){
		return completedRoomNames.indexOf(roomName) !== -1;
	},
	recordCompletion: function(player, roomName){
		const {completedRoomNames} = player;

		if (roomNames.indexOf(roomName) === -1 || completedRoomNames.indexOf(roomName) !== -1){
			return false;
		}

		completedRoomNames.push(roomName);
		completedRoomNames.sort();
		return true;
	}
};
