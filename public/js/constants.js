var GAME_WIDTH = 20;
var GAME_HEIGHT = 20;
var TILE_EDGE = 128;

var GAME_VERSION = 6;

var MOVE_TO_NAME = [
	"North West",
	"North",
	"North East",
	"West",
	"Wait",
	"East",
	"South West",
	"South",
	"South East",
	"Turn CW",
	"Turn CCW",
];
var MOVE_TO_NAME_WITH_META = [];

var urlParts = Array.from(window.location.href.matchAll(/[?&]([^=&#]+)(:?=([^&#]+))?/g)).reduce((all, parts) => {
	var name = parts[1];
	var value = typeof parts[3] === 'undefined' ? 1 : parts[3];

	all[name] = value;
	return all;
}, {});

var DEBUG = urlParts.debug;
var AUTO_ACCEPT_INVITE = urlParts.autoAcceptInvite;
var AUTO_NAME = urlParts.autoName;
var AUTO_INVITE_ANYONE = urlParts.autoInviteAnyone;
var SHOW_CANVAS = urlParts.showCanvas;
var LOG_LEVEL = Math.max(0, Math.min(4, parseInt(urlParts.log)));

MOVE_TO_NAME[96] = "Requesting undoing last move";
MOVE_TO_NAME[97] = "Requesting swap";
MOVE_TO_NAME[98] = "Requesting next level";
MOVE_TO_NAME[99] = "Requesting restart";
MOVE_TO_NAME[100] = "Player has died...";

MOVE_TO_NAME_WITH_META[98] = "Requesting level: %%";

var KEY_NAME_MAP = {
	'Backspace': 101,
	'u': 96,
	'Home': 0, // NW
	'ArrowUp': 1, // N
	'PageUp': 2, // NE
	'ArrowLeft': 3, // W
	'Clear': 4, // Wait
	'ArrowRight': 5, // E
	'End': 6, // SW
	'ArrowDown': 7, // S
	'PageDown': 8, // SE
	'7': 0, // NW
	'8': 1, // N
	'9': 2, // NE
	'4': 3, // W
	'5': 4, // Wait
	'6': 5, // E
	'1': 6, // SW
	'2': 7, // S
	'3': 8, // SE
};

var KEY_CODE_MAP = {
	'36': 0, // NW
	'38': 1, // N
	'33': 2, // NE
	'37': 3, // W
	'12': 4, // Wait
	'39': 5, // E
	'35': 6, // SW
	'40': 7, // S
	'34': 8, // SE
	'13': 98, // Next level
};
var CHAR_CODE_MAP = {
	'55': 0, // NW

	'56': 1, // N

	'57': 2, // NE

	'117': 3, // W
	'85': 3, // W
	'52': 3, // W

	'105': 4, // Wait
	'73': 4, // Wait
	'53': 4, // Wait

	'111': 5, // E
	'79': 5, // E
	'54': 5, // E

	'106': 6, // SW
	'74': 6, // SW
	'49': 6, // SW
	'107': 7, // S
	'75': 7, // S
	'50': 7, // S
	'108': 8, // SE
	'76': 8, // SE
	'51': 8, // SE
	'119': 9, // CW
	'87': 9, // CW
	'113': 10, // CCW
	'81': 10, // CCW
	'114': 99, // Restart
	'82': 99, // Restart
	'115': 97, // Swap
	'83': 97, // Swap

	// NW in german YXCVB
	'122': 0,
	'90': 0,

	'77': 80, // Next level
};

var DIR_X_MAP = [
	-1, 0, 1,
	-1, 0, 1,
	-1, 0, 1,
	0, 0
];

var DIR_Y_MAP = [
	-1, -1, -1,
	0, 0, 0,
	1, 1, 1,
	0, 0
];

var nextCw = function(o){
	switch(o){
		case 0: return 1;
		case 1: return 2;
		case 2: return 5;
		case 5: return 8;
		case 8: return 7;
		case 7: return 6;
		case 6: return 3;
		case 3: return 0;
		default: return o;
	}
};

var nextCcw = function(o){
	switch(o){
		case 0: return 3;
		case 1: return 0;
		case 2: return 1;
		case 5: return 2;
		case 8: return 5;
		case 7: return 8;
		case 6: return 7;
		case 3: return 6;
		default: return o;
	}
};
