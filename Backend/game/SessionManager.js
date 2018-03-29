const Log = require('./Log');
const http = require("http");
const Constants = require('./Constants');
const Utils = require('./Utils');
const Player = require('./Player');
const Session = require('./Session');
const RoomRepository = require('./RoomRepository');
const RecordStore = require('./RecordStore');
const Config = require('../../config');
const e = require('express');
const { Socket } = require('net');

if (Config.debug) {
	console.log("==================================");
	console.log("==================================");
	console.log("     THIS IS TEST ENVIRONMENT     ");
	console.log("==================================");
	console.log("==================================");
}

/**
 * @var {Player[]}
 */
let activePlayers = [];
let runningSessions = [];

const BAD_WORD_FILTERS = [
	/fuck|f[ _]*u[ _]*c[ _]*k/,
	/cunt|c[ _]*u[ _]*n[ _]*t/,
	/bitch|b[ _]*i[ _]*t[ _]*c[ _]*h[ _]*/,
	/(^| |_)*(shit|s[ _]*h[ _]*i[ _]*t)($| |_)*/
];

const SessionManager = {
	/**
	 *
	 * @param {Socket} socket
	 * @param {string} name
	 * @returns
	 */
	connectPlayer: function (socket, name) {
		if (activePlayers.find(player => player.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
			this.emit(socket, "data", { type: "invalidName", log: "Name already in use." });
			return;
		}

		if (!name) {
			this.emit(socket, "data", { type: "invalidName", log: "Empty name given" });
			return;
		}

		name = name.replace(/[^a-zA-Z0-9_ ]/g, '');
		const sanitizedName = name.toLocaleLowerCase();
		BAD_WORD_FILTERS.forEach(filter => {
			if (filter.test(sanitizedName)) {
				name = null;
			}
		})

		if (!name) {
			this.emit(socket, "data", { type: "invalidName", log: "Profanity filter has detected a profanity here. If you think it did it incorrectly contact me, but otherwise please refrain from using profanities because kids are likely to play this game." });
			return;
		}

		const player = new Player(socket, name);
		activePlayers.push(player);

		Log(null, "CONNECTION", `${player.name} connected, (players now: ${activePlayers.length})`);

		this.emit(socket, "data", { type: 'name', name: player.name });
		notifyPlayerListChanged();
	},

	setCompletedRooms: function(socket, completedRoomNames) {
		var player = getPlayerBySocket(socket);

		if (!player) {
			return;
		}

		player.completedRoomNames = Array.isArray(completedRoomNames) ? completedRoomNames : [];
	},

	emit(playerOrPlayersOrSocket, type, data) {
		if (Array.isArray(playerOrPlayersOrSocket)) {
			playerOrPlayersOrSocket.forEach(socket => this.emit(socket, type, data));
			return;
		}

		let socket;
		if (typeof playerOrPlayersOrSocket === 'string') {
			playerOrPlayersOrSocket = this.activePlayers.find(x => x.name === playerOrPlayersOrSocket);
		}

		if (!playerOrPlayersOrSocket) {
			// Silently ignore
			return;

		} else if (playerOrPlayersOrSocket.emit) {
			socket = playerOrPlayersOrSocket;
		} else {
			if (playerOrPlayersOrSocket.socket) {
				socket = playerOrPlayersOrSocket.socket
			} else {
				// Silently ignore
				return
			}
		}

		data.version = Constants.GameVersion;
		socket.emit(type, data);
	},

	disconnected: function (socket) {
		const index = activePlayers.findIndex(p => p.socket === socket);

		if (index === -1) {
			return;
		}

		const player = activePlayers[index];
		activePlayers.splice(index, 1);

		if (player.session) {
			this.killSession(player.session);
		}

		Log(null, "CONNECTION", `${player.name} disconnected, (players now: ${activePlayers.length})`);
		notifyPlayerListChanged();
	},

	invite: function (socket, invitedName) {
		/** @var {Player} */
		var invitingPlayer = getPlayerBySocket(socket);
		/** @var {Player} */
		var invitedPlayer = activePlayers.find(x => x.name === invitedName);

		if (!invitingPlayer || !invitedPlayer || invitingPlayer.session || invitedPlayer.session) {
			// Silently ignore
			return;
		}

		invitingPlayer.inviting = invitedName;
		this.emit(invitedPlayer, 'data', { type: 'invitedBy', by: invitingPlayer.name });
		notifyPlayerListChanged();
	},

	uninvite: function(socket) {
		/** @var {Player} */
		var invitingPlayer = getPlayerBySocket(socket);

		if (!invitingPlayer) {
			// Silently ignore
			return;
		}

		invitingPlayer.inviting = null;
		notifyPlayerListChanged();
	},

	acceptInvite: function (socket, inviterName) {
		/** @var {Player} */
		var acceptingPlayer = getPlayerBySocket(socket);
		/** @var {Player} */
		var invitingPlayer = activePlayers.find(x => x.name === inviterName);

		if (!invitingPlayer || !acceptingPlayer || acceptingPlayer.session || invitingPlayer.session) {
			// Silently ignore
			return;
		}

		if (invitingPlayer.inviting !== acceptingPlayer.name) {
			// Disallow haxoring or stale info
			return;
		}
		invitingPlayer.inviting = null;

		createSession(acceptingPlayer, invitingPlayer);
		notifyPlayerListChanged();
	},

	getPlayerList: function(socket) {
		const player = getPlayerBySocket(socket);

		if (!player) {
			return;
		}

		this.emit(socket, 'data', {
			type: 'playerList',
			players: activePlayers.map(p => ({
				name: p.name,
				invited: player.inviting === p.name,
				inviting: p.inviting === player.name,
				busy: !!p.session
			}))
		});
	},

	submitMove: function (socket, move, turn, moveQueue) {
		if (!Utils.isMove(move)) {
			return;
		}

		const player = getPlayerBySocket(socket);

		if (!player || !player.session || !player.session.room) {
			return;
		}

		if (player.session.room.turn != turn) {
			return;
		}

		if (Utils.isDebugMove(move)) {
			if (!Config.debug) {
				return;
			}

			switch (move) {
				case Constants.Moves.DebugComplete:
					player.session.room.killAllMonsters();

					player.nextMove = Constants.Moves.WAIT;
					player.session.getOtherPlayer(player).nextMove = Constants.Moves.WAIT;

					tryToUpdateSession(player.session);
					break;
			}

			return;r
		}

		player.session.logDebug(`'${player.name}' has submitted move '${Constants.MoveNames[move]}'`);

		player.nextMove = move === Constants.Moves.UndoQueuedMove ? null : move;
		this.emit(player.session.getOtherPlayer(player), 'data', {
			type: "friendMove",
			move: player.nextMove,
			queue: moveQueue,
			position: {
				x: player.x,
				y: player.y,
				o: player.o
			},
			turn: player.session.room.turn
		});

		if (!player.session) {
			Log(null, "BUG-MAYBE", `Disconnect happened when submitting move ${player.name}`);
			return;
		}

		process.nextTick(tryToUpdateSession, player.session);
	},

	submitEmote: function (socket, emote) {
		const player = getPlayerBySocket(socket);

		if (!player || !player.session) {
			return;
		}
		player.session.logDebug(`${player.name} sent emote '${emote}'`);

		this.emit(player.session.getOtherPlayer(player), 'data', {
			type: "emote",
			emote: emote
		});
	},

	killSession: function (session) {
		if (!session.players) {
			this.killSession(getPlayerBySocket(session).session);
			return;
		}

		if (session.players) {
			session.players.forEach(player => {
				this.emit(player, "data", { type: "alone" });
				player.session = null;
			});
		}

		runningSessions = runningSessions.filter(x => x !== session);
	},

	getPlayerBySocket: function(socket) {
		return getPlayerBySocket(socket);
	}
};

function notifyPlayerListChanged() {
	SessionManager.emit(activePlayers, 'data', {type:'playerListChanged'});
}

function getPlayerBySocket(socket) {
	return activePlayers.find(x => x.socket === socket);
}

function createSession(player1, player2) {
	Log(null, "CREATE SESSION", `For ${player1.name} and ${player2.name}`);

	const session = new Session(player1, player2);

	runningSessions.push(session);

	session.log(`Matched '${player1.name}' with '${player2.name}'`);

	SessionManager.emit([player1, player2], "data", { type: "startPlaying" });

	SessionManager.emit(player1, "data", { type: "friendName", name: player2.name });
	SessionManager.emit(player2, "data", { type: "friendName", name: player1.name });

	initializeRoom(session, null, false);
}

function initializeRoom(session, id, isRestarting) {
	const room = RoomRepository.getNewRoom(session.players[0], session.players[1], id, isRestarting, RecordStore);

	session.room = room;

	session.players.forEach(player => {
		player.nextMove = null;
		player.isDead = false;
	});

	SessionManager.emit(session.players[0], "data", { type: "room", room: room.toJson(), order: 0 });
	SessionManager.emit(session.players[1], "data", { type: "room", room: room.toJson(), order: 1 });

	session.logDebug(`Loaded room for '${session.room.name}'`);
}

function tryToUpdateSession(session) {
	if (!session) {
		return;
	}

	let blockUpdate = restartCheck(session);
	blockUpdate |= nextLevelCheck(session);
	blockUpdate |= swapCheck(session);

	if (blockUpdate) {
		return;
	}

	const hasMove = session.players.map(x => x.nextMove !== null || x.isDead);

	if (!hasMove[0] || !hasMove[1]) {
		session.logDebug(`Waiting for the other move`);
		return;
	}

	session.log("Processing move...");

	session.room.process(SessionManager);

	if (!session.room.isCompleted && session.room.areAllMonstersDead()) {
		session.room.isCompleted = true;
		storeRoomCompleted(session);
	}

	sendRoomState(session);

	session.log("Turn data sent");
}

function sendRoomState(session) {
	SessionManager.emit(session.players[0], "data", { type: "processed", room: session.room.toJson() });
	SessionManager.emit(session.players[1], "data", { type: "processed", room: session.room.toJson() });
}

function restartCheck(session) {
	const isRestarting = session.players.map(x => x.nextMove == Constants.Moves.Restart);

	if (isRestarting[0] && isRestarting[1]) {
		session.log("Restarting level...");
		session.players[0].nextMove = null;
		session.players[1].nextMove = null;
		initializeRoom(session, session.room.id, true);
		return true;
	}

	if (isRestarting[0] && !isRestarting[1]) {
		SessionManager.emit(session.players[1], "data", { type: "log", log: "Other player is requesting a restart, press 'R' to confirm" });
		return true;
	}

	if (!isRestarting[0] && isRestarting[1]) {
		SessionManager.emit(session.players[0], "data", { type: "log", log: "Other player is requesting a restart, press 'R' to confirm" });
		return true;
	}

	return false;
}


function nextLevelCheck(session) {
	const isNextLevelling = session.players.map(x => x.nextMove == Constants.Moves.NextLevel);

	if (isNextLevelling[0] && isNextLevelling[1]) {
		session.log("Going to the next level...");
		session.players[0].nextMove = null;
		session.players[1].nextMove = null;
		initializeRoom(session, session.room.id, false);
		return true;
	}

	if (isNextLevelling[0] && !isNextLevelling[1]) {
		SessionManager.emit(session.players[1], "data", { type: "log", log: "Other player is requesting next room, press 'Enter' to confirm" });
		return true;
	}

	if (!isNextLevelling[0] && isNextLevelling[1]) {
		SessionManager.emit(session.players[0], "data", { type: "log", log: "Other player is requesting next room, press 'Enter' to confirm" });
		return true;
	}

	return false;
}

function swapCheck(session) {
	const isSwapLevelling = session.players.map(x => x.nextMove == Constants.Moves.Swap);

	if (isSwapLevelling[0] && isSwapLevelling[1]) {
		const tmp = session.players[0];
		session.players[0] = session.players[1];
		session.players[1] = tmp;
		session.players[0].nextMove = null;
		session.players[1].nextMove = null;
		SessionManager.emit(session.players[0], "data", { type: "swap", player: 0 });
		SessionManager.emit(session.players[1], "data", { type: "swap", player: 1 });
		sendRoomState(session);
		return true;
	}

	if (isSwapLevelling[0] && !isSwapLevelling[1]) {
		SessionManager.emit(session.players[1], "data", { type: "log", log: "Other player is requesting to swap, press 'S' to confirm" });
		return true;
	}

	if (!isSwapLevelling[0] && isSwapLevelling[1]) {
		SessionManager.emit(session.players[0], "data", { type: "log", log: "Other player is requesting to swap, press 'S' to confirm" });
		return true;
	}

	return false;
}

const playerNameToTimestampUntilNextMessage = {};
function storeRoomCompleted(session) {
	if (session.players[0].isDead || session.players[1].isDead) {
		session.players.forEach((player, index) => {
			if (player.isDead) {
				SessionManager.emit(player, "data", { type: "log", log: "Your buddy left you behind and went on to complete the level. That wasn't very nice, you have to beat it together! Press 'R' to request restart or 'Enter' to request next room" })
			} else {
				SessionManager.emit(player, "data", { type: "log", log: "Oh no! You can't just leave your buddy behind like that. You have to beat it together! Press 'R' to request restart or 'Enter' to request the next room" });
				player.isDead = true;
				SessionManager.emit(player, 'data', { type: 'playerDead', player: index });
			}
		});
		return;
	}

	const roomName = session.room.name;
	session.players.forEach(player => {
		if (player.isDead) {
			SessionManager.emit(player, "data", { type: "log", log: "Your partner has managed to complete the room! Press 'R' to request restart or 'Enter' to request next room" })
		} else {
			SessionManager.emit(player, "data", { type: "log", log: "Congratulations on completing this room! Press 'R' to request restart or 'Enter' to request next room" });

			const didCompleteBefore = RecordStore.didPlayerComplete(player.completedRoomNames, roomName);

			if (RecordStore.recordCompletion(player, roomName)) {
				SessionManager.emit(player, 'data',  { type: 'roomCompleted', roomName });
			}

			if (!didCompleteBefore && RecordStore.hasEverythingCompleted(player.completedRoomNames)) {
				setTimeout(function () {
					sendMessageToChat(`Congratulations ${player.name}! You have completed all of the rooms in DROD Online!`);
				}, 5000);
			}
		}
	});

	const playerNames = session.players.map(player => player.name);
	const time = Date.now();
	if (playerNameToTimestampUntilNextMessage[playerNames[0]] > time && playerNameToTimestampUntilNextMessage[playerNames[1]] > time) {
		return;
	}

	playerNameToTimestampUntilNextMessage[playerNames[0]] = time + 1000 * 60 * 60;
	playerNameToTimestampUntilNextMessage[playerNames[1]] = time + 1000 * 60 * 60;
}

module.exports = SessionManager;