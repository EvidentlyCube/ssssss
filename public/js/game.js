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

	var currentRoom;
	var currentTurn;
	var currentPlayer;

	var yourMoveQueue = [];
	var friendMoveQueue = [];

	var friendName;
	var yourPosition;
	var friendPosition;
	var isPlayerDead = [false, false];

	var mousePreviewX = -1;
	var mousePreviewY = -1;

	var friendMousePreviewX = -1;
	var friendMousePreviewY = -1;
	var animationOffset = 1;

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
				currentRoom = data.room;
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
				renderer.animateTopLayer(renders.topLayerAnimate, data.room, currentPlayer, 1);
				animationOffset = 1;
				yourPosition = data.room.players[currentPlayer];
				friendPosition = data.room.players[1-currentPlayer];
				updateTurnValue(data.room.turn);
				updateRoomName(data.room.name);
				updateAuthor(data.room.author);
				updateMove(null, true);
				updateMove(null, false);

				redrawMousePreview();

				break;

			case ("processed"):
				currentRoom = data.room;
				currentTurn = data.room.turn;

				if (data.room.wasBusy) {
					renders.clearFLayer();
					renders.clearTransparentLayer();
					renderer.renderRoom(renders.oLayerDraw, renders.fLayerDraw, renders.transparentLayerDraw, data.room);
				}

				renders.clearTopLayer();
				renderer.animateTopLayer(renders.topLayerAnimate, data.room, currentPlayer, 0);
				animationOffset = 0;
				yourPosition = data.room.players[currentPlayer];
				friendPosition = data.room.players[1-currentPlayer];
				renders.clearGhosts();
				updateTurnValue(data.room.turn);
				updateMove(102, true);
				updateMove(102, false);

				if (yourMoveQueue.length > 0) {
					emitCurrentMove();
				}

				redrawMousePreview();
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

			case ("mouseMoved"):
				if (data.x !== friendMousePreviewX || data.y !== friendMousePreviewY) {
					friendMousePreviewX = data.x;
					friendMousePreviewY = data.y;
					redrawMousePreview();
				}
				break;
		}
	}

	const _onKeyPress = function (e) {
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

			if (move === 96 && currentTurn === 0) {
				logMessage("Cannot undo moves on 0th turn");
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

	function animate() {
		if (animationOffset === 1) {
			return;
		}

		renders.clearTopLayer();
		animationOffset += (1 - animationOffset) * 0.25;
		if (animationOffset >= 0.99) {
			animationOffset = 1;
		}

		renderer.animateTopLayer(renders.topLayerAnimate, currentRoom, currentPlayer, animationOffset);
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
	});

	function cleverTextDraw(layer, tileX, tileY, text, color, shadows) {
		shadows = shadows || 1;
		// Draw position under cursor
		layer.font = "50px toms_new_romantom";
		layer.fillStyle = color;
		layer.shadowColor = "#000";
		layer.shadowBlur =8;
		const measure = layer.measureText(text);
		if (mousePreviewY > 0) {
			layer.textBaseline = "bottom";
			while (shadows--) {
				layer.fillText(text, tileX * TILE_EDGE + (TILE_EDGE - measure.width) / 2, tileY * TILE_EDGE);
			}
			layer.shadowBlur = 4;
			layer.fillText(text, tileX * TILE_EDGE + (TILE_EDGE - measure.width) / 2, tileY * TILE_EDGE);
		} else {
			layer.textBaseline = "top";
			while (shadows--) {
				layer.fillText(text, tileX * TILE_EDGE + (TILE_EDGE - measure.width) / 2, tileY * TILE_EDGE+ TILE_EDGE);
			}
			layer.shadowBlur =4;
			layer.fillText(text, tileX * TILE_EDGE + (TILE_EDGE - measure.width) / 2, tileY * TILE_EDGE+ TILE_EDGE);
		}
		layer.fillStyle = "";
		layer.shadowColor = "";
		layer.shadowBlur = 0;
	}
	function redrawMousePreview() {
		const layer = CANVAS_RENDERER.getDebugLayer();
		layer.beginPath();
		CANVAS_RENDERER.clearDebug();

		if (
			friendMousePreviewX >= 0
			&& friendMousePreviewY >= 0
			&& friendMousePreviewX < GAME_WIDTH
			&& friendMousePreviewY < GAME_HEIGHT
		) {
			layer.strokeStyle = 'rgba(0, 0, 255, 0.4)';
			layer.lineWidth = 12;
			layer.beginPath();
			layer.rect(friendMousePreviewX * TILE_EDGE, friendMousePreviewY * TILE_EDGE, TILE_EDGE, TILE_EDGE);
			layer.stroke();
			layer.strokeStyle = null;
			layer.lineWidth = null;
		}

		if (mousePreviewX < 0 || mousePreviewY < 0 || mousePreviewX >= GAME_WIDTH || mousePreviewY >= GAME_HEIGHT || !currentRoom) {
			CANVAS_RENDERER.refreshMainLayer();
			return;
		}

		{ // draw cursor
			layer.strokeStyle = 'rgba(255, 255, 0, 0.4)';
			layer.lineWidth = 12;
			layer.beginPath();
			layer.rect(mousePreviewX * TILE_EDGE, mousePreviewY * TILE_EDGE, TILE_EDGE, TILE_EDGE);
			layer.stroke();
			layer.strokeStyle = null;
			layer.lineWidth = null;
		}

		{
			cleverTextDraw(
				layer,
				mousePreviewX,
				mousePreviewY,
				`${(mousePreviewX+1).toFixed(0)}:${(mousePreviewY+1).toFixed(0)}`,
				'#FFF'
			);
		}

		var TE = TILE_EDGE;
		var TH = TILE_EDGE / 2;
		var T8 = TH * 0.8;
		{
			// Draw orb connections
			for (var orb of currentRoom.orbs) {
				if (orb.x === mousePreviewX && orb.y === mousePreviewY) {
					for (var agent of orb.agents) {
						var toX = agent.x * TE + TH;
						var toY = agent.y * TE + TH;

						layer.lineWidth = 12;
						layer.strokeStyle = 'rgba(255, 255, 0, 0.4)';
						layer.beginPath();
						layer.moveTo(orb.x * TE + TH, orb.y * TE + TH);
						layer.lineTo(toX, toY);
						layer.stroke();

						switch(agent.type) {
							case (1): // Toggle, draw triangle
								layer.lineWidth = 12;
								layer.strokeStyle = 'rgba(0, 255, 255, 1)';
								layer.beginPath();
								layer.moveTo(toX, toY - T8);
								layer.lineTo(toX + T8, toY + T8);
								layer.lineTo(toX - T8, toY + T8);
								layer.lineTo(toX, toY - T8);
								layer.stroke();
								break;
							case (2): // Open, draw circle
								layer.lineWidth = 8;
								layer.strokeStyle = 'rgba(0, 255, 0, 1)';
								layer.beginPath();
								layer.arc(toX, toY, T8, 0, 2 * Math.PI);
								layer.stroke();
								break;
							case (3): // Close, draw X
								layer.lineWidth = 12;
								layer.strokeStyle = 'rgba(255, 0, 0, 1)';
								layer.beginPath();
								layer.moveTo(toX - T8, toY - T8);
								layer.lineTo(toX + T8, toY + T8);
								layer.stroke();
								layer.beginPath();
								layer.moveTo(toX + T8, toY - T8);
								layer.lineTo(toX - T8, toY + T8);
								layer.stroke();
								break;
						}
					}
				}
			}
		}

		{
			// Draw monster target and distances
			const monster = currentRoom.monsters.find(monster => monster.x === mousePreviewX && monster.y === mousePreviewY);
			if (monster) {
				const target = monster.target === 0 ? yourPosition : friendPosition;
				const otherPlayer = monster.target === 0 ? friendPosition : yourPosition;

				// Draw line to target
				layer.lineWidth = 12;
				layer.strokeStyle = 'rgba(255, 0, 0, 0.8)';
				layer.beginPath();
				layer.moveTo(monster.x * TE + TH, monster.y * TE + TH);
				layer.lineTo(target.x * TE + TH, target.y * TE + TH);
				layer.stroke();

				// Distance to You
				const distancePlayer = Math.abs(target.x - monster.x) + Math.abs(target.y - monster.y);
				const distanceFriend = Math.abs(otherPlayer.x - monster.x) + Math.abs(otherPlayer.y - monster.y);

				cleverTextDraw(layer, target.x, target.y, distancePlayer + "d.", "rgb(255, 255, 0)", 4);
				cleverTextDraw(layer, otherPlayer.x, otherPlayer.y, distanceFriend + "d.", "rgb(0, 255, 255)", 4);
			}
		}

		CANVAS_RENDERER.refreshMainLayer();
	}

	document.querySelector('canvas').addEventListener('mousemove', e => {
		var rect = e.target.getBoundingClientRect();
		var tileWidth = rect.width / GAME_WIDTH;
		var tileHeight = rect.height / GAME_HEIGHT;
		var newX = Math.floor((e.clientX - rect.left) / tileWidth);
		var newY = Math.floor((e.clientY - rect.top) / tileHeight);

		if (newX !== mousePreviewX || newY !== mousePreviewY) {
			mousePreviewX = newX;
			mousePreviewY = newY;
			emit('mouseMoved', {
				x: newX,
				y: newY
			})
			redrawMousePreview();
		}

	});
	document.querySelector('canvas').addEventListener('click', e => {
		if (mousePreviewX < 0 || mousePreviewY < 0 || mousePreviewX >= GAME_WIDTH || mousePreviewY >= GAME_HEIGHT || !currentRoom) {
			return;
		}

		var modal = $("#tile-info");
		var descriptions = [];

		switch(currentRoom.tiles[mousePreviewX][mousePreviewY]) {
			case 0:
				descriptions.push('<strong>Floor</strong> - Allows all monsters and players to walk over it.');
				break;

			case 1:
				descriptions.push("<strong>Wall</strong> - Blocks all monsters' and players' movement. Also blocks <strong>Gazer</strong>'s view.")
				break;

			case 2:
				descriptions.push("<strong>Closed Yellow Gate</strong> - Acts like <strong>Wall</strong>, will open when an appropriate pressure plate is stepped on.")
				break;

			case 3:
				descriptions.push("<strong>Open Red Gate</strong> - Acts like <strong>Floor</strong>, will close when an appropriate pressure plate is stepped on.")
				break;

			case 4:
				descriptions.push(
					"<strong>Pressure Plate</strong> - Acts like <strong>Floor</strong>. when stepped on will act upon <strong>Yellow Gates</strong>. "
					+ "Inspect the connections that appear when you move your mouse over the pressure plate to know which doors are affected and how:"
					+ "<ul>"
					+ "<li><strong>Green Circle</strong> - The door will open/</li>"
					+ "<li><strong>Cyan Triangle</strong> - The door will toggle its state; close if opened, open if closed.</li>"
					+ "<li><strong>Red X</strong> - The door will close.</li>"
					+ "</ul>"
				);
				break;

			case 5:
				descriptions.push("<strong>Pressure Plate (used)</strong> - Acts like <strong>Floor</strong>, does nothing else.")
				break;

			case 6:
				descriptions.push("<strong>Pit</strong> - Blocks all monsters' and players' movement. Allows <strong>Gazers</strong> to see through it.")
				break;

			case 7:
				descriptions.push("<strong>Trapdoor</strong> - Falls down, forming a pit when a player steps off it. When all trapdoors are dropped <strong>Red Gates</strong> will toggle.")
				break;

			case 8:
				descriptions.push("<strong>Closed Red Gate</strong> - Acts like <strong>Wall</strong>, will open when all <strong>Trapdoors</strong> are dropped.")
				break;

			case 9:
				descriptions.push("<strong>Open Red Gate</strong> - Acts like <strong>Floor</strong>, will close when all <strong>Trapdoors</strong> are dropped.")
				break;

			case 11:
				descriptions.push("<strong>Closed Black Gate</strong> - Acts like <strong>Wall</strong>, will open when all <strong>Tar</strong> is cleared.")
				break;

			case 12:
				descriptions.push("<strong>Open Black Gate</strong> - Acts like <strong>Floor</strong>, will close when all <strong>Tar</strong> is cleared.")
				break;
		}

		switch(currentRoom.tilesF[mousePreviewX][mousePreviewY]) {
			case 100:
			case 101:
			case 102:
			case 103:
			case 104:
			case 105:
			case 106:
			case 107:
				descriptions.push('<strong>Arrow</strong> - Prevents players and monsters moving against it, both when stepping onto it and when stopping off it. Can be traversed sideways.');
				break;
		}

		switch(currentRoom.tilesT[mousePreviewX][mousePreviewY]) {
			case 10:
				descriptions.push("<strong>Tar</strong> - Can only be cut on flat edges. Any blob of tar that's smaller than 2x2 will turn into tar babies. "
				 + "Can be simutlaneously stabbed in two places by two players to carve different shapes'");
				break;
		}

		for(var monster of currentRoom.monsters) {
			if (monster.x !== mousePreviewX || monster.y !== mousePreviewY) {
				continue;
			}

			switch(monster.type) {
				case (3):
					descriptions.push("<strong>Roach (monster)</strong> - Follows the closest player. If a diagonal move is blocked it'll prefer to move vertically than horizontally, if possible. "
						+ "Will kill the player upon stepping on their tile. Is blocked by swords. Can be killed by moving your sword onto its tile (either by stepping or rotating).");
						break;
				case (4):
					descriptions.push("<strong>Roach Queen (monster)</strong> - Runs away from the closest player. If a diagonal move is blocked it'll prefer to move vertically than horizontally, if possible. "
						+ "Will never attack the player. Every 30 turns it'll lay eggs around it that hatch into Raoches in 4 turns.");
						break;

				case (5):
					descriptions.push("<strong>Gazer (monster)</strong> - Stays motionless unless awoken. When woken up behaves exactly like a roach. "
						+ "Will wake up when a player moves across its line of sight (literally the line of sight). "
						+ "Diagonally facing gazers' view can often be stepped around by moving diagonally.");
						break;


				case (6):
					descriptions.push("<strong>Roach Egg (monster)</strong> - Doesn't move, hatches 4 moves after being laid.");
					break;

				case (7):
					descriptions.push("<strong>Active Gazer (monster)</strong> - Behaves exactly like a roach.");
					break;

				case (8):
					descriptions.push("<strong>Blocker (monster)</strong> - Unkillable and not dangerous. Blocks other monsters. Will not slide against walls when diagonal move is blocked. "
						+ "Not required to be killed in order to clear the room.")
						break;

				case (9):
					descriptions.push("<strong>Tar Baby (monster)</strong> - Behaves exactly like a roach. Is spawned from cutting tar.");
					break;

				case (10):
					descriptions.push("<strong>Rock Golem (monster)</strong> - Follows the closets player. If a diagonal move is blocked it'll stay motionless. "
						+ "Turns into a pile of rock that blocks movement when killed.");
					break;

				case (11):
					descriptions.push("<strong>Rock Pile</strong> - Acts like a <strong>Wall</strong>.");
					break;
			}
		}

		if (mousePreviewX === yourPosition.x && mousePreviewY === yourPosition.y) {
			descriptions.push("<strong>You, " + GAME_BRAIN.playerName + "</strong> - you can move in eight directions and swing your sword. Your job is to clear the room of all the required monsters "
				+ "and ensure your partner stays alive.");
		}
		if (mousePreviewX === friendPosition.x && mousePreviewY === friendPosition.y) {
			descriptions.push("<strong>Partner, " + GAME_BRAIN.friendName + "</strong> - they can move in eight directions and swing your sword. Tehir job is to clear the room of all the required monsters "
				+ "and ensure you stay alive.");
		}

		modal.css({display: 'flex'});
		modal.find('ul')[0].innerHTML = "<li>" + descriptions.join("</li><li>") + "</li>";
	});
	document.querySelector('canvas').addEventListener('mouseout', e => {
		if (mousePreviewX !== -1 && mousePreviewY !== -1) {
			mousePreviewX = -1;
			mousePreviewY = -1;
			emit('mouseMoved', {
				x: mousePreviewX,
				y: mousePreviewY
			})
			redrawMousePreview();
		}
	});

	setInterval(animate, 1000/60);

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
	$('#full-screen').on('click', () => {
		if (!document.fullscreenElement) {
			document.querySelector('body').requestFullscreen({navigationUI: "hide"});
		} else {
			document.exitFullscreen();
		}
	});
	$('.close-info-box').on('click', function() {
		$(this).parent().hide();
	});
})