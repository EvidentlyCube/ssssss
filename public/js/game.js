// window.onbeforeunload = function() {
// 	return "Are you sure you want to navigate away?";
// }

function getGameLogic(emit) {
	var audio = new Audio('notification.wav?v=2');
	var queryParams = ['version=' + GAME_VERSION];
	var myName = "Player #" + Date.now();

	queryParams.push('name=' + myName);

	var $log = $('#log');
	var $emoteYou = $('#messageYou');
	var $emotePartner = $('#messageOther');
	var $customEmoteInput = $("#custom-emote-input");
	var $customEmoteSend = $("#custom-emote-send");
	var emoteClearTimerYou;
	var emoteClearTimerPartner;

	var currentTurn;
	var currentPlayer;

	var yourMoveQueue = [];
	var friendMoveQueue = [];

	var friendName;
	var yourPosition;
	var friendPosition;
	var isPlayerDead = [false, false];



	const sharedRenderer = {
		clearTopLayer: function() {
			HTML_RENDERER.clearTopLayer();
			CANVAS_RENDERER.clearTopLayer();
		},

		clearTransparentLayer: function() {
			HTML_RENDERER.clearTransparentLayer();
			CANVAS_RENDERER.clearTransparentLayer();
		},

		clearFLayer: function() {
			HTML_RENDERER.clearFLayer();
			CANVAS_RENDERER.clearFLayer();
		},

		clearGhosts: function() {
			HTML_RENDERER.clearGhosts();
			CANVAS_RENDERER.clearGhosts();
		},

		oLayerDraw: function(x, y, spriteX, spriteY) {
			HTML_RENDERER.oLayerDraw(x, y, spriteX, spriteY);
			CANVAS_RENDERER.oLayerDraw(x, y, spriteX, spriteY);
		},

		fLayerDraw: function(x, y, spriteX, spriteY) {
			HTML_RENDERER.fLayerDraw(x, y, spriteX, spriteY);
			CANVAS_RENDERER.fLayerDraw(x, y, spriteX, spriteY);
		},

		topLayerDraw: function(x, y, spriteX, spriteY, opacity, classes, opts) {
			HTML_RENDERER.topLayerDraw(x, y, spriteX, spriteY, opacity, classes, opts);
			CANVAS_RENDERER.topLayerDraw(x, y, spriteX, spriteY, opacity, classes, opts);
		},

		transparentLayerDraw: function(x, y, spriteX, spriteY, opacity, classes) {
			HTML_RENDERER.transparentLayerDraw(x, y, spriteX, spriteY, opacity, classes);
			CANVAS_RENDERER.transparentLayerDraw(x, y, spriteX, spriteY, opacity, classes);
		}
	}

	const renders = CANVAS_RENDERER;

	logMessage("Game initialized");
	renderer.renderRoom(renders.oLayerDraw, renders.fLayerDraw, renders.transparentLayerDraw, generatePitLevel());

	const onConnect = () => {
		renders.clearTopLayer();
		renders.clearTransparentLayer();
		renders.clearFLayer();

		$customEmoteInput.on('keypress', _onKeyPress);
		$customEmoteSend.on('click', _onCustomEmoteClick);

		isPlayerDead[0] = false;
		isPlayerDead[1] = false;
		updateMove(null, true);
		updateMove(null, false);
		updateFriendName(null);
		renderer.renderRoom(renders.oLayerDraw, renders.fLayerDraw, renders.transparentLayerDraw, generatePitLevel());
		logMessage("Connected to the server");
	};

	const onDisconnect = () => {
		$('#gameGrid > .cell').remove();
		$customEmoteInput.off('keypress', _onKeyPress);
		$customEmoteSend.off('click', _onCustomEmoteClick);
		$("html").off('keydown', _onHtmlKeypress);

		renders.clearTopLayer();
		renders.clearTransparentLayer();
		renders.clearFLayer();
		logMessage("Lost connection with the server...");
		isPlayerDead[0] = false;
		isPlayerDead[1] = false;
		updateMove(null, true);
		updateMove(null, false);
		updateFriendName(null);
		renderer.renderRoom(renders.oLayerDraw, renders.fLayerDraw, renders.transparentLayerDraw, generatePitLevel());
	};

	const onData = data => {
		switch (data.type) {
			case ("log"):
				logMessage(data.log);
				break;

			case ("swap"):
				currentPlayer = data.player;
				break;

			case ("playerDead"):
				if (data.player == currentPlayer) {
					logMessage("You have died. Press 'R' to request restart or 'Enter' to request starting next room.");
				} else {
					logMessage(friendName + " has died. You can continue playing alone or press 'R' to request restart or 'Enter' to request starting next room.");
				}
				isPlayerDead[data.player] = true;
				updateMove(100, data.player == currentPlayer, data.meta);
				break;

			case ("friendName"):
				if (document.hidden) {
					audio.play();
				}
				friendName = data.name;
				updateFriendName(data.name);
				logMessage("Connected to " + friendName);
				break;

			case ("friendMove"):
				if (isPlayerDead[1 - currentPlayer]) {
					if (data.move > 10) {
						updateMove(data.move <= 10 ? 103 : data.move, false, data.meta);
					}
					break;
				}
				if (data.turn == currentTurn) {
					renders.clearGhosts();
					friendMoveQueue = data.queue;
					updateMove(data.move <= 10 ? 103 : data.move, false, data.meta);
				}
				break;

			case ("room"):
				currentTurn = data.room.turn;
				currentPlayer = data.order;

				renders.clearTopLayer();
				renders.clearFLayer();
				renders.clearTransparentLayer();
				renders.clearGhosts();
				logMessage("Playing '" + data.room.name + "'");
				isPlayerDead[0] = false;
				isPlayerDead[1] = false;
				renderer.renderRoom(renders.oLayerDraw, renders.fLayerDraw, renders.transparentLayerDraw, data.room);
				renderer.renderTopLayer(renders.topLayerDraw, data.room, currentPlayer);
				yourPosition = data.room.players[currentPlayer];
				friendPosition = data.room.players[1-currentPlayer];
				updateTurnValue(data.room.turn);
				updateRoomName(data.room.name);
				updateAuthor(data.room.author);
				updateMove(null, true);
				updateMove(null, false);
				break;

			case ("processed"):
				currentTurn = data.room.turn;

				if (data.room.wasBusy) {
					renders.clearFLayer();
					renders.clearTransparentLayer();
					renderer.renderRoom(renders.oLayerDraw, renders.fLayerDraw, renders.transparentLayerDraw, data.room);
				}

				renders.clearTopLayer();
				renderer.renderTopLayer(renders.topLayerDraw, data.room, currentPlayer);
				yourPosition = data.room.players[currentPlayer];
				friendPosition = data.room.players[1-currentPlayer];
				updateTurnValue(data.room.turn);
				updateMove(102, true);
				updateMove(102, false);

				if (yourMoveQueue.length > 0) {
					emitCurrentMove();
				}

				break;

			case ("emote"):
				$emotePartner.html("Partner: " + data.emote).stop().fadeIn();
				if (emoteClearTimerPartner) {
					clearTimeout(emoteClearTimerPartner);
				}
				emoteClearTimerPartner = setTimeout(function () {
					$emotePartner.stop().fadeOut();
					emoteClearTimerPartner = null;
				}, 4000);
				break;
		}
	}

	const _onKeyPress = function (e) {
		console.log(e.originalEvent.key);
		if (e.originalEvent.keyCode === 13) {
			submitCustomEmote();
			return false;
		}
		e.stopPropagation();
	};
	const _onCustomEmoteClick = function (e) {
		submitCustomEmote();
		e.stopImmediatePropagation();
		e.preventDefault();
		return false;
	}
	const _onHtmlKeypress = function (e) {
		if (document.activeElement === $customEmoteInput[0]) {
			if (e.originalEvent.keyCode === 27) {
				$customEmoteInput.blur();
			}
			return;
		}
		var move = null;

		if (e.originalEvent.keyCode === 27) {
			emit('stop-session', {});
		}

		if (e.originalEvent.keyCode === 9) {
			if (emoteClearTimerYou) {
				clearTimeout(emoteClearTimerYou);
			}
			if (emoteClearTimerPartner) {
				clearTimeout(emoteClearTimerPartner);
			}
			$emotePartner.stop().fadeOut();
			$emoteYou.stop().fadeOut();
			return false;
		}

		if (KEY_NAME_MAP.hasOwnProperty(e.originalEvent.key)) {
			move = KEY_NAME_MAP[e.originalEvent.key];

		} else if (KEY_CODE_MAP.hasOwnProperty(e.originalEvent.keyCode)) {
			move = KEY_CODE_MAP[e.originalEvent.keyCode];

		} else if (CHAR_CODE_MAP.hasOwnProperty(e.originalEvent.charCode)) {
			move = CHAR_CODE_MAP[e.originalEvent.charCode];

		} else if (CHAR_CODE_MAP.hasOwnProperty(e.originalEvent.keyCode)) {
			move = CHAR_CODE_MAP[e.originalEvent.keyCode];
		}

		if (move !== null) {
			if (isPlayerDead[currentPlayer] && move <= 10) {
				return;
			}

			renders.clearGhosts();
			updateMove(move, true);
			emitCurrentMove(move);
			return false;
		}
	};

	$("html").on('keydown', _onHtmlKeypress);

	function emitCurrentMove(move, meta) {
		emit('move', {
			move: yourMoveQueue.length > 0 ? yourMoveQueue[0] : move,
			meta: meta || null,
			queue: yourMoveQueue,
			turn: currentTurn
		});
	}

	function updateTurnValue(value) {
		$('#turn-number .turn-value').text(value);
	}

	function updateRoomName(name) {
		$('#turn-number .room-name').text("in '" + name + "'");
	}

	function updateMove(move, isYou, meta) {
		if (isYou) {
			moveMeta = meta || null;
		}
		var queue = isYou ? yourMoveQueue : friendMoveQueue;
		var position = isYou ? yourPosition : friendPosition;

		if (move === null) {
			queue.length = 0;
		}

		if (move === 102) {
			queue.shift();
			move = queue.length > 0 ? queue[0] : null;

		} else if (move === 101) {
			queue.pop();
			move = queue.length > 0 ? queue[0] : null;

		} else if (move !== null && move <= 10) {
			queue.push(move);
			move = queue.length > 0 ? queue[0] : null;

		} else if (move === 103) { // Special move for handling friend move
			move = queue.length > 0 ? queue[0] : null;

		} else if (move > 10) {
			queue.length = 0;
		}

		renderer.renderGhost(renders.topLayerDraw, position, queue, isYou);
		CANVAS_RENDERER.refreshMainLayer();

		var $div = isYou ? $("#move-you") : $("#move-partner");
		var $move = $div.find('.move');
		$div.removeClass('warning');
		$move.removeClass('spinner');

		if (move < 97 && isPlayerDead[isYou ? currentPlayer : 1 - currentPlayer]) {
			move = 100;
		}

		if (move === null) {
			$move.text('');
			$move.addClass('spinner');
		} else {
			let text = (meta ? MOVE_TO_NAME_WITH_META[move] : '') || MOVE_TO_NAME[move];
			text = text.replace('%%', meta || '');
			if (queue.length > 1) {
				text += ' <span class="muted">(+' + (queue.length - 1) + " other move";
				if (queue.length > 2) {
					text += "s";
				}
				text += ")</span>";
			}
			$move[0].innerHTML = text;

			if (move > 10) {
				$div.addClass('warning');
			}
		}
	}

	function updateFriendName(name) {
		var $div = $("#friend-name");
		if (name) {
			$div.text(name + "'s move");
		} else {
			$div.text('---')
		}
	}

	function updateAuthor(name) {
		$(".author-name").text('by ' + name);
	}

	function logMessage(message) {
		var date = new Date();
		var timeString = "";
		timeString += (date.getHours() < 10 ? "0" : "") + date.getHours();
		timeString += ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
		timeString += ":" + (date.getSeconds() < 10 ? "0" : "") + date.getSeconds();
		$log.find('ul').prepend("<li><strong>" + timeString + "</strong><br>" + message + "</li>");

		$log.find('li').slice(5).remove();
	}

	function submitCustomEmote() {
		var emote = $customEmoteInput.val();
		$customEmoteInput.val("");

		if (emote) {
			$emoteYou.html("You: " + emote).stop().fadeIn();
			if (emoteClearTimerYou) {
				clearTimeout(emoteClearTimerYou);
			}
			emoteClearTimerYou = setTimeout(function () {
				$emoteYou.stop().fadeOut();
				emoteClearTimerYou = null;
			}, 4000);

			emit('emote', { emote: emote });
		}

		$customEmoteInput.blur();
	}

	document.addEventListener('go-to-room', e => {
		updateMove(98, true, e.roomName);
		emitCurrentMove(98, e.roomName);
	})

	return { onConnect, onDisconnect, onData,  }
};

function generatePitLevel() {
	var image = (
		"11111111111111111111"
		+ "10000000000000000001"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10666666666666666601"
		+ "10000000000000000001"
		+ "11111111111111111111"
	);
	var tImage = (
		  "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
		+ "00000000000000000000"
	);

	var oLayer = [];
	var fLayer = [];
	var tLayer = [];

	for (var x = 0; x < GAME_WIDTH; x++) {
		oLayer[x] = [];
		fLayer[x] = [];
		tLayer[x] = [];
		for (var y = 0; y < GAME_HEIGHT; y++) {
			oLayer[x][y] = parseInt(image.charAt(x + y * GAME_HEIGHT), 16);
			fLayer[x][y] = 0;
			tLayer[x][y] = parseInt(tImage.charAt(x + y * GAME_HEIGHT), 16);
		}
	}

	return {
		tiles: oLayer,
		tilesF: fLayer,
		tilesT: tLayer,
	}
}

$(document).ready(function() {
	$('#changelog-link').on('click', () => $("#changelog").css({display: 'flex'}));
	$('#help-link').on('click', () => $("#help").css({display: 'flex'}));
	$('.close-info-box').on('click', function() {
		console.log($(this));
		$(this).parent().hide();
	});
})