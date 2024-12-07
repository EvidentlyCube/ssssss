var CANVAS_RENDERER = (function() {
	var CANVAS_WIDTH = TILE_EDGE * GAME_WIDTH;
	var CANVAS_HEIGHT = TILE_EDGE * GAME_HEIGHT;

	var oLayer = createCanvasLayer().context;
	var fLayer = createCanvasLayer().context;
	var transparentLayer = createCanvasLayer().context;
	var topLayer = createCanvasLayer().context;
	var ghostLayer = createCanvasLayer().context;
	var debugLayer = createCanvasLayer().context;
	var mainCanvas;
	var mainLayer;

	domReady(() => {
		mainCanvas = document.querySelector('#canvas-renderer');
		mainCanvas.width = CANVAS_WIDTH;
		mainCanvas.height = CANVAS_HEIGHT;

		mainLayer = mainCanvas.getContext('2d');
	});

	queueGameComponent('canvas:general_tiles');
	queueGameComponent('canvas:wall_tiles');

	var generalTiles = new Image();
	var wallTiles = new Image();
	generalTiles.onload = () => readyGameComponent('canvas:general_tiles');
	wallTiles.onload = () => readyGameComponent('canvas:wall_tiles');

	generalTiles.src = "gfx/GeneralTiles_128.png";
	wallTiles.src = "gfx/FoundationTiles_128.png";

	function createCanvasLayer() {
		var canvas = document.createElement('canvas');
		canvas.width = CANVAS_WIDTH;
		canvas.height = CANVAS_HEIGHT;

		if (SHOW_CANVAS) {
			canvas.style.width = "400px";
			canvas.style.height = "400px";
			canvas.style.position = "relative";
			canvas.style.top = "100vh";
			document.querySelector('body').appendChild(canvas);
		}

		return {
			canvas,
			context: canvas.getContext('2d')
		};
	}

	let isRedrawQueued = false;

    return {
		getMainCanvas: function() {
			return mainCanvas;
		},

		refreshMainLayer: function() {
			if (isRedrawQueued) {
				return;
			}

			isRedrawQueued = true;
			window.requestAnimationFrame(() => {
				isRedrawQueued = false;
				mainLayer.drawImage(oLayer.canvas, 0, 0);
				mainLayer.drawImage(fLayer.canvas, 0, 0);
				mainLayer.drawImage(transparentLayer.canvas, 0, 0);
				mainLayer.drawImage(topLayer.canvas, 0, 0);
				mainLayer.drawImage(ghostLayer.canvas, 0, 0);
				mainLayer.drawImage(debugLayer.canvas, 0, 0);
			});
		},
		clearTopLayer: function() {
			topLayer.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		},

		clearTransparentLayer: function() {
			transparentLayer.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		},

		clearFLayer: function() {
			fLayer.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		},

		clearGhosts: function() {
			ghostLayer.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		},

		clearDebug: function() {
			debugLayer.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		},

		getDebugLayer: function() {
			return debugLayer;
		},

		oLayerDraw: function(x, y, spriteX, spriteY) {
			if (typeof spriteX === "undefined") {
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			oLayer.drawImage(
				wallTiles,
				spriteX * TILE_EDGE,
				spriteY * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE,
				x * TILE_EDGE,
				y * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE
			);
		},

		fLayerDraw: function(x, y, spriteX, spriteY) {
			if (typeof spriteX === "undefined") {
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			fLayer.drawImage(
				wallTiles,
				spriteX * TILE_EDGE,
				spriteY * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE,
				x * TILE_EDGE,
				y * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE
			);
		},

		topLayerDraw: function(x, y, spriteX, spriteY, opacity, classes, opts) {
			if (typeof spriteX === "undefined") {
				classes = y.classes || [];
				opacity = y.opacity || 1;
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			opts = opts || {};

			let target = classes.indexOf('ghost') !== -1
				? ghostLayer
				: topLayer;

			target.globalAlpha = opacity;
			target.drawImage(
				generalTiles,
				spriteX * TILE_EDGE,
				spriteY * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE,
				opts.precise ? x : x * TILE_EDGE,
				opts.precise ? y : y * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE
			);
			target.globalAlpha = 1;
		},

		topLayerAnimate: function(obj, sprite, opacity, offset) {
			var drawX = (obj.prevX + (obj.x - obj.prevX) * offset) * TILE_EDGE;
			var drawY = (obj.prevY + (obj.y - obj.prevY) * offset) * TILE_EDGE;

			topLayer.globalAlpha = opacity;
			topLayer.drawImage(
				generalTiles,
				sprite.x * TILE_EDGE,
				sprite.y * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE,
				drawX,
				drawY,
				TILE_EDGE,
				TILE_EDGE
			);
			topLayer.globalAlpha = 1;
		},

		transparentLayerDraw: function(x, y, spriteX, spriteY, opacity, classes) {
			if (typeof spriteX === "undefined") {
				classes = y.classes || [];
				opacity = y.opacity || 1;
				spriteY = y.y;
				spriteX = y.x;
				y = x.y;
				x = x.x
			}

			transparentLayer.globalAlpha = opacity;
			transparentLayer.drawImage(
				generalTiles,
				spriteX * TILE_EDGE,
				spriteY * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE,
				x * TILE_EDGE,
				y * TILE_EDGE,
				TILE_EDGE,
				TILE_EDGE
			);
			transparentLayer.globalAlpha = 1;
		}
    }
})();