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
MoveNames[98] = "Next level";
MoveNames[99] = "Restart";

module.exports = {
	GameVersion: 4,
	RoomWidth: 20,
	RoomHeight: 20,
	MoveNames: MoveNames,
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
		Tar: 10,
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
		Roach: 3,
		RoachQueen: 4,
		EvilEye: 5,
		RoachEgg: 6,
		EvilEyeActive: 7,
		Wubba: 8,
		TarBaby: 9,
		RockGolem: 10,
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