const MoveNames =[
	"NW",
	"N",
	"NE",
	"W",
	"Wait",
	"E",
	"SW",
	"S",
	"SE",
	"CW",
	"CCW",
];
MoveNames[96] = "Undo Played Move";
MoveNames[98] = "Next level";
MoveNames[99] = "Restart";

module.exports = {
	GameVersion: 6,
	RoomWidth: 20,
	RoomHeight: 20,
	MoveNames: MoveNames,
	Debug: {
		AddFakePlayersToList: process.argv.indexOf("--spam-players") !== -1,
		RandomizeRoomCompletionInList: process.argv.indexOf("--random-completion") !== -1,
	},
	TileTypes: {
		Floor: 0,
		Wall: 1,
		YellowDoorUp: 2,
		YellowDoorDown: 3,
		PressurePlate: 4,
		PressurePlateUsed: 5,
		Pit: 6,
		Trapdoor: 7,
		RedDoorUp: 8,
		RedDoorDown: 9,
		Resin: 10,
		BlackDoorUp: 11,
		BlackDoorDown: 12,
		ArrowNW: 100,
		ArrowN: 101,
		ArrowNE: 102,
		ArrowW: 103,
		ArrowE: 104,
		ArrowSW: 105,
		ArrowS: 106,
		ArrowSE: 107
	},

	MonsterTypes: {
		Player1: 1,
		Player2: 2,
		Bug: 3,
		BugBreeder: 4,
		Gazer: 5,
		BugEgg: 6,
		EvilEyeActive: 7,
		Blocker: 8,
		ResinSpawn: 9,
		AnimatedRocks: 10,
		RockGolemPile: 11
	},

	Moves: {
		NW: 0,
		N: 1,
		NE: 2,
		W: 3,
		WAIT: 4,
		E: 5,
		SW: 6,
		S: 7,
		SE: 8,
		CW: 9,
		CCW: 10,
		DebugComplete: 80,
		UndoPlayedMove: 96,
		Swap: 97,
		NextLevel: 98,
		Restart: 99,
		UndoQueuedMove: 101,
	},

	Orb: {
		Toggle: 1,
		Open: 2,
		Close: 3
	}
};